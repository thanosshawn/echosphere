
// src/app/stories/edit/[storyId]/actions.ts
'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase';
import { doc, collection, writeBatch, getDoc, runTransaction, serverTimestamp, FieldValue } from 'firebase/firestore';
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
    return { error: "Database service is unavailable.", newNodeId: null };
  }

  const validatedFields = addStoryNodeServerActionSchema.safeParse(values);
  if (!validatedFields.success) {
    const errorMessages = Object.values(validatedFields.error.flatten().fieldErrors).flat().join(', ');
    return { error: `Invalid data: ${errorMessages}`, newNodeId: null };
  }

  const { storyId, authorId, authorUsername, authorProfilePictureUrl, newNodeContent, parentNodeId } = validatedFields.data;
  const currentTime = Date.now();

  try {
    const storyRef = doc(db, "stories", storyId);
    
    let newNodeId: string | null = null;
    let finalNodeCount = 0;

    await runTransaction(db, async (transaction) => {
        const storySnap = await transaction.get(storyRef);
        if (!storySnap.exists()) {
            throw new Error("Story not found.");
        }
        const storyData = storySnap.data() as Story;

        // Optional: Add authorization check if only story author can add nodes, or if any authenticated user can.
        // For now, assuming any authenticated user passed via authorId can contribute.
        // if (storyData.authorId !== authorId) {
        //     throw new Error("User is not authorized to add nodes to this story.");
        // }

        const storyNodesCollectionRef = collection(db, 'stories', storyId, 'nodes');
        const newNodeRef = doc(storyNodesCollectionRef); 
        newNodeId = newNodeRef.id;

        const newStoryNode: Omit<StoryNode, 'id'> = {
            storyId: storyId,
            authorId: authorId,
            authorUsername: authorUsername,
            authorProfilePictureUrl: authorProfilePictureUrl || undefined,
            content: newNodeContent,
            order: currentTime, // Use timestamp for ordering among siblings
            parentId: parentNodeId,
            createdAt: currentTime,
            updatedAt: currentTime,
            upvotes: 0,
            downvotes: 0,
            votedBy: {},
            commentCount: 0,
        };
        transaction.set(newNodeRef, newStoryNode);
        
        // Increment nodeCount on the main story document
        transaction.update(storyRef, {
            nodeCount: FieldValue.increment(1),
            updatedAt: currentTime,
        });
        // The actual nodeCount will be storyData.nodeCount + 1 after transaction.
        // We can't read storyData.nodeCount within the transaction after updating it to get the final value
        // So we have to rely on FieldValue.increment or pass it back differently.
        // For simplicity, the updatedStoryData might not reflect the absolute final count if multiple transactions happen.
        // This is a common challenge with transactions and denormalized counters.
        // For this example, we'll return the value based on pre-transaction data.
        finalNodeCount = (storyData.nodeCount || 0) + 1; 
    });


    revalidatePath(`/stories/${storyId}`);
    revalidatePath(`/stories/edit/${storyId}`);
    revalidatePath(`/profile/${authorId}`);

    return { 
        success: "New node added successfully!", 
        newNodeId,
        updatedStoryData: { updatedAt: currentTime, nodeCount: finalNodeCount }
    };

  } catch (error: any) {
    console.error("Error adding story node:", error);
    return { error: error.message || "An error occurred while adding the new node.", newNodeId: null };
  }
}
