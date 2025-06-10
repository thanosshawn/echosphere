
// src/app/stories/create/actions.ts
'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp as firestoreServerTimestamp, writeBatch, doc } from 'firebase/firestore';
import type { Story, StoryPart } from '@/types';
import { revalidatePath } from 'next/cache';

// Schema for input to the server action matches the form values plus author info
// 'content' here refers to the content of the *first part* of the story.
const createStoryServerActionSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(150, "Title must be less than 150 characters"),
  initialContent: z.string().min(50, "Story content must be at least 50 characters"), // Renamed for clarity
  category: z.string().min(1, "Please select a category"),
  tags: z.string().optional(),
  status: z.enum(["draft", "published"]),
  authorId: z.string(),
  authorUsername: z.string(),
  authorProfilePictureUrl: z.string().optional().nullable(),
});

export type CreateStoryActionInput = z.infer<typeof createStoryServerActionSchema>;

export async function createStoryAction(values: CreateStoryActionInput): Promise<{ success?: string; error?: string; storyId?: string | null }> {
  if (!db) {
    console.error("Firestore database is not initialized.");
    return { error: "Database service is unavailable. Please contact support if the issue persists.", storyId: null };
  }

  const validatedFields = createStoryServerActionSchema.safeParse(values);

  if (!validatedFields.success) {
    console.error("Invalid story data received by action:", validatedFields.error.flatten().fieldErrors);
    return { error: "Invalid data provided. Please check the form and try again.", storyId: null };
  }

  const { title, initialContent, category, tags, status, authorId, authorUsername, authorProfilePictureUrl } = validatedFields.data;
  const currentTime = Date.now();

  try {
    const batch = writeBatch(db);

    // 1. Create the main Story document
    const storyCollectionRef = collection(db, 'stories');
    const newStoryRef = doc(storyCollectionRef); // Generate a new ID for the story

    const storyToCreate: Omit<Story, 'id'> = {
      authorId,
      authorUsername: authorUsername || 'Anonymous',
      authorProfilePictureUrl: authorProfilePictureUrl || undefined,
      title,
      // coverImageUrl: '', // To be implemented
      tags: tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
      category,
      status,
      createdAt: currentTime,
      updatedAt: currentTime, // Will be updated if parts change
      views: 0,
      likes: 0,
      commentCount: 0,
      partCount: 1, // Starts with one part
      // firstPartExcerpt: initialContent.substring(0, 150) + (initialContent.length > 150 ? "..." : ""), // Example excerpt
    };
    batch.set(newStoryRef, storyToCreate);

    // 2. Create the first StoryPart document in the subcollection
    const storyPartsCollectionRef = collection(db, 'stories', newStoryRef.id, 'parts');
    const firstPartRef = doc(storyPartsCollectionRef); // Generate ID for the part

    const firstStoryPart: Omit<StoryPart, 'id'> = {
      storyId: newStoryRef.id,
      authorId,
      content: initialContent,
      order: 1,
      createdAt: currentTime,
      updatedAt: currentTime,
    };
    batch.set(firstPartRef, firstStoryPart);

    await batch.commit();

    revalidatePath('/stories');
    revalidatePath(`/stories/${newStoryRef.id}`);
    revalidatePath('/dashboard');
    if (authorId) {
      revalidatePath(`/profile/${authorId}`);
    }

    return { success: status === "published" ? "Your story is now live!" : "Your story has been saved as a draft.", storyId: newStoryRef.id };
  } catch (error) {
    console.error("Error creating story and first part in Firestore:", error);
    return { error: "An error occurred while saving your story. Please try again.", storyId: null };
  }
}
