
// src/app/stories/[storyId]/actions.ts
'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase';
import { doc, collection, writeBatch, serverTimestamp, runTransaction, Timestamp, FieldValue } from 'firebase/firestore';
import type { StoryNodeComment, StoryNode } from '@/types';
import { revalidatePath } from 'next/cache';

const addCommentToStoryNodeSchema = z.object({
  storyId: z.string().min(1),
  nodeId: z.string().min(1),
  authorId: z.string().min(1),
  authorUsername: z.string(),
  authorProfilePictureUrl: z.string().optional().nullable(),
  text: z.string().min(1, "Comment cannot be empty (HTML allowed)").refine(value => value !== '<p></p>', { message: "Comment cannot be empty." }),
});

export type AddCommentToStoryNodeInput = z.infer<typeof addCommentToStoryNodeSchema>;

export async function addCommentToStoryNodeAction(
  values: AddCommentToStoryNodeInput
): Promise<{ success?: string; error?: string; commentId?: string | null }> {
  console.log("[addCommentToStoryNodeAction] Received values:", JSON.stringify(values, null, 2));

  if (!db) {
    console.error("[addCommentToStoryNodeAction] Firestore (db) not available.");
    return { error: "Database service is unavailable.", commentId: null };
  }
  const validatedFields = addCommentToStoryNodeSchema.safeParse(values);
  if (!validatedFields.success) {
    const errorMessages = Object.values(validatedFields.error.flatten().fieldErrors).flat().join(', ');
    console.error("[addCommentToStoryNodeAction] Validation Error:", errorMessages, "Input:", values);
    return { error: `Invalid comment data: ${errorMessages}`, commentId: null };
  }

  const { storyId, nodeId, authorId, authorUsername, authorProfilePictureUrl, text } = validatedFields.data;
  const currentTime = Date.now();

  try {
    console.log("[addCommentToStoryNodeAction] Attempting to post comment. StoryID:", storyId, "NodeID:", nodeId, "AuthorID:", authorId);
    const batch = writeBatch(db);
    const commentRef = doc(collection(db, "stories", storyId, "nodes", nodeId, "comments"));
    const nodeRef = doc(db, "stories", storyId, "nodes", nodeId);

    const newComment: Omit<StoryNodeComment, 'id'> = {
      storyId,
      nodeId,
      authorId,
      authorUsername,
      authorProfilePictureUrl: authorProfilePictureUrl ?? null,
      text,
      createdAt: currentTime,
      parentId: null,
      depth: 0,
    };
    batch.set(commentRef, newComment);
    console.log("[addCommentToStoryNodeAction] Comment added to batch:", newComment);

    // Debugging FieldValue.increment with Turbopack
    console.log("[addCommentToStoryNodeAction] Checking FieldValue.increment. Type of FieldValue:", typeof FieldValue);
    if (FieldValue && typeof FieldValue.increment === 'function') { // Check if FieldValue itself and its increment property are valid
      console.log("[addCommentToStoryNodeAction] FieldValue.increment is a function. Proceeding with batch.update for commentCount.");
      batch.update(nodeRef, { commentCount: FieldValue.increment(1) });
    } else {
      const errorMessageDetail = `FieldValue.increment is NOT a function. Type of FieldValue: ${typeof FieldValue}, Type of FieldValue.increment: ${typeof FieldValue?.increment}.`;
      console.error("[addCommentToStoryNodeAction] CRITICAL ERROR:", errorMessageDetail);
      console.error("[addCommentToStoryNodeAction] Full FieldValue object for inspection:", FieldValue);
      // Try to inspect keys if FieldValue is an object
      if (typeof FieldValue === 'object' && FieldValue !== null) {
        try {
          console.error("[addCommentToStoryNodeAction] Keys of FieldValue:", Object.keys(FieldValue));
        } catch (e) {
          console.error("[addCommentToStoryNodeAction] Could not get keys of FieldValue:", e);
        }
      }
      throw new Error("Firestore FieldValue.increment is not available or not a function.");
    }
    console.log("[addCommentToStoryNodeAction] Node commentCount increment added to batch for node:", nodeRef.path);
    

    await batch.commit();
    console.log("[addCommentToStoryNodeAction] Batch commit successful. Comment ID:", commentRef.id);

    revalidatePath(`/stories/${storyId}`); 
    console.log("[addCommentToStoryNodeAction] Path revalidated:", `/stories/${storyId}`);
    
    return { success: "Comment posted!", commentId: commentRef.id };

  } catch (error: any) 
  {
    console.error("--------------------------------------------------------------------");
    console.error("[addCommentToStoryNodeAction] CRITICAL ERROR POSTING COMMENT:");
    console.error("Timestamp:", new Date().toISOString());
    console.error("Story ID:", storyId, "Node ID:", nodeId, "Author ID:", authorId);
    
    console.error("Full Error Object:", error);

    try {
      console.error("Serialized Error Object:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    } catch (e) {
      console.error("Failed to serialize error object:", e);
    }

    const errorMessage = error.message || 'An unknown error occurred.';
    console.error("Error Message:", errorMessage);
    if (error.code) { 
        console.error("Error Code (e.g., Firestore error code):", error.code);
    }
    if (error.stack) {
        console.error("Error Stack Trace:", error.stack);
    }
    console.error("--------------------------------------------------------------------");
    return { error: `Failed to post comment. Server error: ${errorMessage}. Please check server logs for details.`, commentId: null };
  }
}


const voteActionSchema = z.object({
  storyId: z.string().min(1),
  nodeId: z.string().min(1),
  userId: z.string().min(1, "User ID is required to vote."),
});

export type VoteActionInput = z.infer<typeof voteActionSchema>;

async function handleVote(
  values: VoteActionInput,
  voteType: 'upvote' | 'downvote'
): Promise<{ success?: string; error?: string }> {
  if (!db) {
    console.error("[handleVote] Firestore (db) not available.");
    return { error: "Database service is unavailable." };
  }

  const validatedFields = voteActionSchema.safeParse(values);
  if (!validatedFields.success) {
    const errorMessages = Object.values(validatedFields.error.flatten().fieldErrors)
      .map(errors => errors?.join(', '))
      .filter(Boolean)
      .join('; ');
    console.error("[handleVote] Validation Error:", errorMessages, "Input:", values);
    return { error: "Invalid vote data: " + (errorMessages || "Unknown error") };
  }

  const { storyId, nodeId, userId } = validatedFields.data;
  const nodeRef = doc(db, "stories", storyId, "nodes", nodeId);

  try {
    console.log(`[handleVote] User ${userId} attempting to ${voteType} node ${nodeId} in story ${storyId}`);
    await runTransaction(db, async (transaction) => {
      const nodeDoc = await transaction.get(nodeRef);
      if (!nodeDoc.exists()) {
        console.error(`[handleVote] Node not found: ${nodeRef.path}`);
        throw new Error("Story node not found.");
      }

      const nodeData = nodeDoc.data() as StoryNode; 
      const currentVotedBy = nodeData.votedBy || {};
      let newUpvotes = nodeData.upvotes || 0;
      let newDownvotes = nodeData.downvotes || 0;
      const userPreviousVote = currentVotedBy[userId];
      
      console.log(`[handleVote] Node ${nodeId}: currentVotes(U/D): ${newUpvotes}/${newDownvotes}, userPreviousVote: ${userPreviousVote}`);

      if (voteType === 'upvote') {
        if (userPreviousVote === 'upvote') { 
          newUpvotes = Math.max(0, newUpvotes - 1);
          delete currentVotedBy[userId];
          console.log(`[handleVote] User ${userId} removed upvote.`);
        } else { 
          if (userPreviousVote === 'downvote') {
            newDownvotes = Math.max(0, newDownvotes - 1);
            console.log(`[handleVote] User ${userId} changed from downvote to upvote. Downvotes adjusted.`);
          }
          newUpvotes += 1;
          currentVotedBy[userId] = 'upvote';
          console.log(`[handleVote] User ${userId} upvoted.`);
        }
      } else { // downvote
        if (userPreviousVote === 'downvote') { 
          newDownvotes = Math.max(0, newDownvotes - 1);
          delete currentVotedBy[userId];
          console.log(`[handleVote] User ${userId} removed downvote.`);
        } else { 
          if (userPreviousVote === 'upvote') {
            newUpvotes = Math.max(0, newUpvotes - 1);
            console.log(`[handleVote] User ${userId} changed from upvote to downvote. Upvotes adjusted.`);
          }
          newDownvotes += 1;
          currentVotedBy[userId] = 'downvote';
          console.log(`[handleVote] User ${userId} downvoted.`);
        }
      }

      // Debugging FieldValue.increment for votes
      console.log("[handleVote] Checking FieldValue.increment. Type of FieldValue:", typeof FieldValue);
      if (FieldValue && typeof FieldValue.increment === 'function') {
        console.log("[handleVote] FieldValue.increment is a function. Updating votes.");
        // Note: FieldValue.increment should not be used here directly for setting vote counts
        // as the logic above already calculates the new absolute values (newUpvotes, newDownvotes).
        // FieldValue.increment is for atomic server-side increments, not for setting calculated values.
        // The current logic of calculating newUpvotes/newDownvotes and then setting them is correct for this scenario.
      } else {
          const errorMessageDetail = `FieldValue.increment is NOT a function in handleVote. Type of FieldValue: ${typeof FieldValue}, Type of FieldValue.increment: ${typeof FieldValue?.increment}.`;
          console.error("[handleVote] CRITICAL ERROR:", errorMessageDetail);
          // This part might not be directly causing an issue if FieldValue.increment is not used for votes,
          // but it's good to log if it's unexpectedly not a function.
      }

      transaction.update(nodeRef, {
        upvotes: newUpvotes,
        downvotes: newDownvotes,
        votedBy: currentVotedBy,
        updatedAt: Date.now(), 
      });
      console.log(`[handleVote] Node ${nodeId} updated in transaction. New votes(U/D): ${newUpvotes}/${newDownvotes}`);
    });

    revalidatePath(`/stories/${storyId}`);
    console.log(`[handleVote] Path revalidated: /stories/${storyId}. Vote recorded for node ${nodeId}.`);
    return { success: "Vote recorded!" };
  } catch (error: any) {
    console.error("--------------------------------------------------------------------");
    console.error("[handleVote] CRITICAL ERROR RECORDING VOTE:");
    console.error("Timestamp:", new Date().toISOString());
    console.error("Story ID:", storyId, "Node ID:", nodeId, "User ID:", userId, "Vote Type:", voteType);
    console.error("Full Error Object:", error);
    try {
      console.error("Serialized Error Object:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    } catch (e) {
      console.error("Failed to serialize error object:", e);
    }
    const errorMessage = error.message || 'An unknown error occurred during voting.';
    console.error("Error Message:", errorMessage);
    if (error.code) {
        console.error("Error Code:", error.code);
    }
    if (error.stack) {
        console.error("Error Stack Trace:", error.stack);
    }
    console.error("--------------------------------------------------------------------");
    return { error: `Failed to record vote. Server error: ${errorMessage}. Please check server logs.` };
  }
}

export async function upvoteStoryNodeAction(values: VoteActionInput): Promise<{ success?: string; error?: string }> {
  return handleVote(values, 'upvote');
}

export async function downvoteStoryNodeAction(values: VoteActionInput): Promise<{ success?: string; error?: string }> {
  return handleVote(values, 'downvote');
}
