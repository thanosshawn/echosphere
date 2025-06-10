
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
  text: z.string().min(1, "Comment cannot be empty"),
});

export type AddCommentToStoryNodeInput = z.infer<typeof addCommentToStoryNodeSchema>;

export async function addCommentToStoryNodeAction(
  values: AddCommentToStoryNodeInput
): Promise<{ success?: string; error?: string; commentId?: string | null }> {
  if (!db) {
    return { error: "Database service is unavailable.", commentId: null };
  }
  const validatedFields = addCommentToStoryNodeSchema.safeParse(values);
  if (!validatedFields.success) {
    return { error: "Invalid comment data.", commentId: null };
  }

  const { storyId, nodeId, authorId, authorUsername, authorProfilePictureUrl, text } = validatedFields.data;
  const currentTime = Date.now();

  try {
    const batch = writeBatch(db);
    const commentRef = doc(collection(db, "stories", storyId, "nodes", nodeId, "comments"));
    const nodeRef = doc(db, "stories", storyId, "nodes", nodeId);

    const newComment: Omit<StoryNodeComment, 'id'> = {
      storyId,
      nodeId,
      authorId,
      authorUsername,
      authorProfilePictureUrl: authorProfilePictureUrl || undefined,
      text,
      createdAt: currentTime,
      parentId: null, // For top-level comments on nodes
      depth: 0,      // For top-level comments on nodes
    };
    batch.set(commentRef, newComment);
    
    // Atomically increment commentCount on the node
    batch.update(nodeRef, { commentCount: FieldValue.increment(1) });

    await batch.commit();
    revalidatePath(`/stories/${storyId}`); // Revalidate the story detail page
    return { success: "Comment posted!", commentId: commentRef.id };

  } catch (error) {
    console.error("Error posting comment:", error);
    return { error: "Failed to post comment.", commentId: null };
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
  if (!db) return { error: "Database service is unavailable." };

  const validatedFields = voteActionSchema.safeParse(values);
  if (!validatedFields.success) {
    // Construct a more detailed error message from Zod errors
    const errorMessages = Object.values(validatedFields.error.flatten().fieldErrors)
      .map(errors => errors?.join(', '))
      .filter(Boolean)
      .join('; ');
    return { error: "Invalid vote data: " + (errorMessages || "Unknown error") };
  }

  const { storyId, nodeId, userId } = validatedFields.data;
  const nodeRef = doc(db, "stories", storyId, "nodes", nodeId);

  try {
    await runTransaction(db, async (transaction) => {
      const nodeDoc = await transaction.get(nodeRef);
      if (!nodeDoc.exists()) {
        throw new Error("Story node not found.");
      }

      const nodeData = nodeDoc.data() as StoryNode;
      const currentVotedBy = nodeData.votedBy || {};
      let newUpvotes = nodeData.upvotes || 0;
      let newDownvotes = nodeData.downvotes || 0;
      const userPreviousVote = currentVotedBy[userId];

      if (voteType === 'upvote') {
        if (userPreviousVote === 'upvote') { // User is removing their upvote
          newUpvotes = Math.max(0, newUpvotes - 1);
          delete currentVotedBy[userId];
        } else { // New upvote or changing from downvote
          if (userPreviousVote === 'downvote') {
            newDownvotes = Math.max(0, newDownvotes - 1);
          }
          newUpvotes += 1;
          currentVotedBy[userId] = 'upvote';
        }
      } else { // voteType === 'downvote'
        if (userPreviousVote === 'downvote') { // User is removing their downvote
          newDownvotes = Math.max(0, newDownvotes - 1);
          delete currentVotedBy[userId];
        } else { // New downvote or changing from upvote
          if (userPreviousVote === 'upvote') {
            newUpvotes = Math.max(0, newUpvotes - 1);
          }
          newDownvotes += 1;
          currentVotedBy[userId] = 'downvote';
        }
      }
      transaction.update(nodeRef, {
        upvotes: newUpvotes,
        downvotes: newDownvotes,
        votedBy: currentVotedBy,
        updatedAt: Date.now(), // Using client-side timestamp for simplicity
      });
    });

    revalidatePath(`/stories/${storyId}`);
    return { success: "Vote recorded!" };
  } catch (error: any) {
    console.error("Error recording vote:", error);
    return { error: error.message || "Failed to record vote." };
  }
}

export async function upvoteStoryNodeAction(values: VoteActionInput): Promise<{ success?: string; error?: string }> {
  return handleVote(values, 'upvote');
}

export async function downvoteStoryNodeAction(values: VoteActionInput): Promise<{ success?: string; error?: string }> {
  return handleVote(values, 'downvote');
}
