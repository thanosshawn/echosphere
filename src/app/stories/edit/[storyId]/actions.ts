
// src/app/stories/edit/[storyId]/actions.ts
'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase';
import { doc, collection, writeBatch, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import type { Story, StoryPart } from '@/types';
import { revalidatePath } from 'next/cache';

const addStoryPartServerActionSchema = z.object({
  storyId: z.string().min(1, "Story ID is required"),
  authorId: z.string().min(1, "Author ID is required"),
  newPartContent: z.string().min(10, "Part content must be at least 10 characters"),
});

export type AddStoryPartActionInput = z.infer<typeof addStoryPartServerActionSchema>;

interface AddStoryPartActionResult {
    success?: string;
    error?: string;
    newPartId?: string | null;
    updatedStoryData?: { updatedAt: number; partCount: number };
}

export async function addStoryPartAction(values: AddStoryPartActionInput): Promise<AddStoryPartActionResult> {
  if (!db) {
    return { error: "Database service is unavailable.", newPartId: null };
  }

  const validatedFields = addStoryPartServerActionSchema.safeParse(values);
  if (!validatedFields.success) {
    return { error: "Invalid data provided.", newPartId: null };
  }

  const { storyId, authorId, newPartContent } = validatedFields.data;
  const currentTime = Date.now();

  try {
    const storyRef = doc(db, "stories", storyId);
    
    let newPartId: string | null = null;
    let finalPartCount = 0;

    await runTransaction(db, async (transaction) => {
        const storySnap = await transaction.get(storyRef);
        if (!storySnap.exists()) {
            throw new Error("Story not found.");
        }
        const storyData = storySnap.data() as Story;

        if (storyData.authorId !== authorId) {
            throw new Error("User is not authorized to add parts to this story.");
        }

        const currentPartCount = storyData.partCount || 0;
        const newPartOrder = currentPartCount + 1;
        finalPartCount = newPartOrder;

        const storyPartsCollectionRef = collection(db, 'stories', storyId, 'parts');
        const newPartRef = doc(storyPartsCollectionRef); // Auto-generate ID for the new part
        newPartId = newPartRef.id;

        const newStoryPart: Omit<StoryPart, 'id'> = {
            storyId: storyId,
            authorId: authorId,
            content: newPartContent,
            order: newPartOrder,
            createdAt: currentTime,
            updatedAt: currentTime,
        };
        transaction.set(newPartRef, newStoryPart);
        
        transaction.update(storyRef, {
            partCount: newPartOrder,
            updatedAt: currentTime, // Use client-side timestamp for consistency if serverTimestamp() causes issues with number type
        });
    });


    revalidatePath(`/stories/${storyId}`);
    revalidatePath(`/stories/edit/${storyId}`);
    revalidatePath(`/profile/${authorId}`);

    return { 
        success: "New part added successfully!", 
        newPartId,
        updatedStoryData: { updatedAt: currentTime, partCount: finalPartCount }
    };

  } catch (error: any) {
    console.error("Error adding story part:", error);
    return { error: error.message || "An error occurred while adding the new part.", newPartId: null };
  }
}
