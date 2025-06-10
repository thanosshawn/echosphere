
// src/app/stories/create/actions.ts
'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase';
import { supabase } from '@/lib/supabase';
import { writeBatch, doc, collection } from 'firebase/firestore';
import type { Story, StoryNode } from '@/types';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';

// Schema for input to the server action - matches FormData structure
const createStoryServerActionSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(150, "Title must be less than 150 characters"),
  initialNodeContent: z.string().min(10, "Initial story content must be at least 10 characters (HTML allowed).").refine(value => value !== '<p></p>', { message: "Initial story content cannot be empty." }),
  category: z.string().min(1, "Please select a category"),
  tags: z.string().optional(),
  status: z.enum(["draft", "published"]),
  authorId: z.string(),
  authorUsername: z.string(),
  authorProfilePictureUrl: z.string().optional().nullable(),
  coverImage: z.instanceof(File).optional().nullable(),
});

// This is what the page will pass (FormData)
export type CreateStoryFormValues = FormData;


export async function createStoryAction(formData: CreateStoryFormValues): Promise<{ success?: string; error?: string; storyId?: string | null }> {
  if (!db) {
    console.error("Firestore database is not initialized.");
    return { error: "Database service is unavailable. Please check Firebase configuration.", storyId: null };
  }
   if (!supabase) {
    console.error("Supabase client is not initialized. Critical Error: Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables are correctly set in your .env.local file and the development server was restarted.");
    return { error: "Storage service is unavailable. Please check Supabase configuration and environment variables.", storyId: null };
  }

  const rawData = {
    title: formData.get('title') as string,
    initialNodeContent: formData.get('initialNodeContent') as string,
    category: formData.get('category') as string,
    tags: formData.get('tags') as string | undefined,
    status: formData.get('status') as "draft" | "published",
    authorId: formData.get('authorId') as string,
    authorUsername: formData.get('authorUsername') as string,
    authorProfilePictureUrl: formData.get('authorProfilePictureUrl') as string | null,
    coverImage: formData.get('coverImage') as File | null,
  };
  
  const validatedFields = createStoryServerActionSchema.safeParse(rawData);

  if (!validatedFields.success) {
    console.error("Invalid story data received by action:", validatedFields.error.flatten().fieldErrors);
    const errorMessages = Object.values(validatedFields.error.flatten().fieldErrors).flat().join(', ');
    return { error: `Invalid data: ${errorMessages}`, storyId: null };
  }

  const { title, initialNodeContent, category, tags, status, authorId, authorUsername, authorProfilePictureUrl, coverImage } = validatedFields.data;
  const currentTime = Date.now();
  let coverImageUrl: string | null = null;

  // Handle Cover Image Upload to Supabase
  if (coverImage) {
    const fileExtension = coverImage.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const filePath = `story-covers/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('story-covers') // Ensure this bucket exists and is public or has RLS configured
      .upload(filePath, coverImage, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error("Error uploading cover image to Supabase:", uploadError);
      return { error: `Failed to upload cover image: ${uploadError.message}. Please try again.`, storyId: null };
    }
    // Construct the public URL. Adjust if your Supabase setup is different.
    const { data: publicUrlData } = supabase.storage.from('story-covers').getPublicUrl(filePath);
    coverImageUrl = publicUrlData.publicUrl;
  }


  try {
    const batch = writeBatch(db);
    const storyCollectionRef = collection(db, 'stories');
    const newStoryRef = doc(storyCollectionRef); 

    // Basic plain text excerpt - improve if rich text is complex
    const plainTextExcerpt = initialNodeContent.replace(/<[^>]+>/g, '').substring(0, 200) + (initialNodeContent.length > 200 ? "..." : "");


    const storyToCreate: Omit<Story, 'id'> = {
      authorId,
      authorUsername: authorUsername || 'Anonymous',
      authorProfilePictureUrl: authorProfilePictureUrl || undefined,
      title,
      coverImageUrl,
      tags: tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
      category,
      status,
      createdAt: currentTime,
      updatedAt: currentTime, 
      views: 0,
      likes: 0,
      nodeCount: 1, 
      firstNodeExcerpt: plainTextExcerpt,
      isLocked: false,
      canonicalBranchNodeId: null,
    };
    batch.set(newStoryRef, storyToCreate);

    const storyNodesCollectionRef = collection(db, 'stories', newStoryRef.id, 'nodes');
    const firstNodeRef = doc(storyNodesCollectionRef); 

    const firstStoryNode: Omit<StoryNode, 'id'> = {
      storyId: newStoryRef.id,
      authorId,
      authorUsername: authorUsername || 'Anonymous',
      authorProfilePictureUrl: authorProfilePictureUrl || undefined,
      content: initialNodeContent, // Save HTML content
      order: currentTime, // Use timestamp for ordering
      parentId: null, // Root node
      createdAt: currentTime,
      updatedAt: currentTime,
      upvotes: 0,
      downvotes: 0,
      votedBy: {},
      commentCount: 0,
    };
    batch.set(firstNodeRef, firstStoryNode);

    await batch.commit();

    revalidatePath('/stories');
    revalidatePath(`/stories/${newStoryRef.id}`);
    revalidatePath('/dashboard');
    if (authorId) {
      revalidatePath(`/profile/${authorId}`);
    }

    return { success: status === "published" ? "Your story is now live!" : "Your story has been saved as a draft.", storyId: newStoryRef.id };
  } catch (error)
 {
    console.error("Error creating story and first node in Firestore:", error);
    return { error: "An error this  occurred while saving your story. Please try again.", storyId: null };
  }
}

