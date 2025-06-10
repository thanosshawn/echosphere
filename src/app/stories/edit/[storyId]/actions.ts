
// src/app/stories/edit/[storyId]/actions.ts
'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase';
import { doc, collection, writeBatch, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import type { Story, StoryNode } from '@/types';
import { revalidatePath } from 'next/cache';

const addStoryNodeServerActionSchema = z.object({
  storyId: z.string().min(1, "Story ID is required"),
  authorId: z.string().min(1, "Author ID is required"),
  authorUsername: z.string(),
  authorProfilePictureUrl: z.string().optional().nullable(),
  newNodeContent: z.string().min(10, "Node content must be at least 10 characters"),
  parentNodeId: z.string().min(1, "Parent Node ID is required"),
});

export type AddStoryNodeActionInput = z.infer<typeof addStoryNodeServerActionSchema>;

interface AddStoryNodeActionResult {
    success?: string;
    error?: string;
    newNodeId?: string | null;
    updatedStoryData?: { updatedAt: number; nodeCount: number };
}

export async function addStoryNodeAction(values: AddStoryNodeActionInput): Promise<AddStoryNodeActionResult> {
  if (!db) {
    console.error("[addStoryNodeAction] Firestore (db) not available.");
    return { error: "Database service is unavailable.", newNodeId: null };
  }

  const validatedFields = addStoryNodeServerActionSchema.safeParse(values);
  if (!validatedFields.success) {
    const errorMessages = Object.values(validatedFields.error.flatten().fieldErrors).flat().join(', ');
    console.error("[addStoryNodeAction] Validation Error:", errorMessages, "Input:", values);
    return { error: `Invalid data: ${errorMessages}`, newNodeId: null };
  }

  const { storyId, authorId, authorUsername, authorProfilePictureUrl, newNodeContent, parentNodeId } = validatedFields.data;
  const currentTime = Date.now();

  try {
    console.log(`[addStoryNodeAction] Attempting to add node to story ${storyId} by author ${authorId}`);
    const storyRef = doc(db, "stories", storyId);
    
    let newNodeId: string | null = null;
    let finalNodeCount = 0;

    await runTransaction(db, async (transaction) => {
        console.log(`[addStoryNodeAction] Starting transaction for story ${storyId}`);
        const storySnap = await transaction.get(storyRef);
        if (!storySnap.exists()) {
            console.error(`[addStoryNodeAction] Story ${storyId} not found during transaction.`);
            throw new Error("Story not found.");
        }
        const storyData = storySnap.data() as Story;
        console.log(`[addStoryNodeAction] Story ${storyId} current nodeCount: ${storyData.nodeCount || 0}`);

        const storyNodesCollectionRef = collection(db, 'stories', storyId, 'nodes');
        const newNodeRef = doc(storyNodesCollectionRef); 
        newNodeId = newNodeRef.id;

        const newStoryNode: Omit<StoryNode, 'id'> = {
            storyId: storyId,
            authorId: authorId,
            authorUsername: authorUsername,
            authorProfilePictureUrl: authorProfilePictureUrl ?? null,
            content: newNodeContent,
            order: currentTime, 
            parentId: parentNodeId,
            createdAt: currentTime,
            updatedAt: currentTime,
            upvotes: 0,
            downvotes: 0,
            votedBy: {},
            commentCount: 0,
        };
        transaction.set(newNodeRef, newStoryNode);
        console.log(`[addStoryNodeAction] New node ${newNodeId} set in transaction.`);
        
        finalNodeCount = (storyData.nodeCount || 0) + 1;
        transaction.update(storyRef, {
            nodeCount: finalNodeCount,
            updatedAt: currentTime,
        });
        console.log(`[addStoryNodeAction] Story ${storyId} updated in transaction. New nodeCount: ${finalNodeCount}`);
    });

    console.log(`[addStoryNodeAction] Transaction successful for story ${storyId}. New node ID: ${newNodeId}`);

    revalidatePath(`/stories/${storyId}`);
    revalidatePath(`/stories/edit/${storyId}`);
    if (authorId) {
      revalidatePath(`/profile/${authorId}`);
    }
    console.log(`[addStoryNodeAction] Paths revalidated for story ${storyId}.`);

    return { 
        success: "New node added successfully!", 
        newNodeId,
        updatedStoryData: { updatedAt: currentTime, nodeCount: finalNodeCount }
    };

  } catch (error: any) {
    console.error("--------------------------------------------------------------------");
    console.error("[addStoryNodeAction] CRITICAL ERROR ADDING STORY NODE:");
    console.error("Timestamp:", new Date().toISOString());
    console.error("Story ID:", storyId, "Author ID:", authorId, "Parent Node ID:", parentNodeId);
    console.error("Full Error Object:", error);
    try {
      console.error("Serialized Error Object:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    } catch (e) {
      console.error("Failed to serialize error object:", e);
    }
    const errorMessage = error.message || 'An unknown error occurred while adding the new node.';
    console.error("Error Message:", errorMessage);
    if (error.code) { 
        console.error("Error Code (e.g., Firestore error code):", error.code);
    }
    if (error.stack) {
        console.error("Error Stack Trace:", error.stack);
    }
    console.error("--------------------------------------------------------------------");
    return { error: `Failed to add node. Server error: ${errorMessage}. Please check server logs for details.`, newNodeId: null };
  }
}
