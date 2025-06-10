// src/app/stories/create/actions.ts
'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp as firestoreServerTimestamp } from 'firebase/firestore';
import type { Story } from '@/types';
import { revalidatePath } from 'next/cache';
import type { UserProfile } from '@/types'; // Ensure UserProfile is imported if needed, or pass specific fields

// Schema for input to the server action matches the form values plus author info
const createStoryServerActionSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(150, "Title must be less than 150 characters"),
  content: z.string().min(50, "Story content must be at least 50 characters"),
  category: z.string().min(1, "Please select a category"),
  tags: z.string().optional(),
  status: z.enum(["draft", "published"]),
  // coverImage: z.any().optional(), // File upload not handled in this step
  authorId: z.string(),
  authorUsername: z.string(),
  authorProfilePictureUrl: z.string().optional().nullable(),
});

export type CreateStoryActionInput = z.infer<typeof createStoryServerActionSchema>;

export async function createStoryAction(values: CreateStoryActionInput): Promise<{ success?: string; error?: string; storyId?: string | null }> {
  if (!db) {
    console.error("Firestore database is not initialized. Check Firebase configuration in .env.local and src/lib/firebase.ts.");
    return { error: "Database service is unavailable. Please contact support if the issue persists.", storyId: null };
  }

  const validatedFields = createStoryServerActionSchema.safeParse(values);

  if (!validatedFields.success) {
    console.error("Invalid story data received by action:", validatedFields.error.flatten().fieldErrors);
    return { error: "Invalid data provided. Please check the form and try again.", storyId: null };
  }

  const { title, content, category, tags, status, authorId, authorUsername, authorProfilePictureUrl } = validatedFields.data;

  try {
    // For production, using firestoreServerTimestamp() is recommended for createdAt and updatedAt.
    // The Story type in src/types/index.ts currently uses 'number'.
    // To align with this for now, we'll use Date.now().
    // Consider updating Story type and related logic to handle Firestore Timestamps.
    const storyToCreate = {
      authorId,
      authorUsername: authorUsername || 'Anonymous', // Fallback for username
      authorProfilePictureUrl: authorProfilePictureUrl || undefined,
      title,
      content,
      // coverImageUrl: '', // Actual image URL would go here after image upload is implemented
      tags: tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
      category,
      status,
      createdAt: Date.now(), // Using Date.now() for now. Prefer firestoreServerTimestamp()
      updatedAt: Date.now(), // Using Date.now() for now. Prefer firestoreServerTimestamp()
      views: 0,
      likes: 0,
      commentCount: 0,
    };

    const storyCollectionRef = collection(db, 'stories');
    // The object passed to addDoc should match the structure expected by Firestore,
    // and ideally align with a more strictly typed version of Story if not using Omit.
    const docRef = await addDoc(storyCollectionRef, storyToCreate);

    // Revalidate paths to update cached data across the application
    revalidatePath('/stories');
    revalidatePath('/dashboard');
    if (authorId) {
      revalidatePath(`/profile/${authorId}`);
    }

    return { success: status === "published" ? "Your story is now live!" : "Your story has been saved as a draft.", storyId: docRef.id };
  } catch (error) {
    console.error("Error creating story in Firestore:", error);
    return { error: "An error occurred while saving your story. Please try again.", storyId: null };
  }
}
