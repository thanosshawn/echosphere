
// src/app/stories/create/actions.ts
'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase';
import { supabase } from '@/lib/supabase'; // Corrected import
import { writeBatch, doc, collection } from 'firebase/firestore';
import type { Story, StoryNode } from '@/types';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';

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

export type CreateStoryFormValues = FormData;

export async function createStoryAction(formData: CreateStoryFormValues): Promise<{ success?: string; error?: string; storyId?: string | null }> {
  console.log("[createStoryAction] Received formData. Keys:", Array.from(formData.keys()).join(', '));
  
  const rawData = {
    title: formData.get('title') as string,
    initialNodeContent: formData.get('initialNodeContent') as string,
    category: formData.get('category') as string,
    tags: formData.get('tags') as string | undefined,
    status: formData.get('status') as "draft" | "published",
    authorId: formData.get('authorId') as string,
    authorUsername: formData.get('authorUsername') as string,
    authorProfilePictureUrl: formData.get('authorProfilePictureUrl') as string | null,
    // More robust check for File instance
    coverImage: formData.get('coverImage') instanceof File ? formData.get('coverImage') as File : null,
  };

  console.log("[createStoryAction] Parsed rawData. Cover image details (if any):", {
    title: rawData.title,
    category: rawData.category,
    status: rawData.status,
    authorId: rawData.authorId,
    hasCoverImage: !!rawData.coverImage,
    coverImageName: rawData.coverImage?.name,
    coverImageSize: rawData.coverImage?.size,
    coverImageType: rawData.coverImage?.type,
  });
  
  if (!db) {
    console.error("[createStoryAction] CRITICAL: Firestore database (db) is not initialized. Check Firebase configuration.");
    return { error: "Database service is unavailable. Firebase might not be configured correctly.", storyId: null };
  }
  if (!supabase) {
    console.error("[createStoryAction] CRITICAL: Supabase client is not initialized. Check Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY) and restart server if changed.");
    return { error: "Storage service (Supabase) is unavailable. Please check configuration and environment variables.", storyId: null };
  }

  const validatedFields = createStoryServerActionSchema.safeParse(rawData);

  if (!validatedFields.success) {
    console.error("[createStoryAction] Validation Error: Invalid story data received.", validatedFields.error.flatten().fieldErrors);
    const errorMessages = Object.values(validatedFields.error.flatten().fieldErrors).flat().join(', ');
    return { error: `Invalid data submitted: ${errorMessages}`, storyId: null };
  }

  const { title, initialNodeContent, category, tags, status, authorId, authorUsername, authorProfilePictureUrl, coverImage } = validatedFields.data;
  const currentTime = Date.now();
  let coverImageUrl: string | null = null;

  try {
    if (coverImage) {
      console.log(`[createStoryAction] Attempting to upload cover image: ${coverImage.name}, size: ${coverImage.size} bytes, type: ${coverImage.type}`);
      const fileExtension = coverImage.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExtension}`;
      const filePath = `story-covers/${fileName}`;

      console.log(`[createStoryAction] Uploading to Supabase path: ${filePath}`);
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('story-covers') // Ensure this bucket exists and has correct policies
        .upload(filePath, coverImage, {
          cacheControl: '3600',
          upsert: false, // Consider if upsert should be true or false based on your needs
        });

      if (uploadError) {
        console.error("[createStoryAction] Supabase Upload Error:", uploadError);
        return { error: `Failed to upload cover image to Supabase: ${uploadError.message}. Check bucket permissions and RLS.`, storyId: null };
      }
      console.log("[createStoryAction] Supabase upload successful. Upload data:", uploadData);
      
      const { data: publicUrlData } = supabase.storage.from('story-covers').getPublicUrl(filePath);
      coverImageUrl = publicUrlData.publicUrl;
      console.log("[createStoryAction] Supabase public URL retrieved:", coverImageUrl);
      if (!coverImageUrl) {
        console.warn("[createStoryAction] Warning: Supabase getPublicUrl did not return a URL. This might happen if the file path is incorrect or bucket policies are too restrictive for public URLs.");
      }
    }

    console.log("[createStoryAction] Preparing Firestore batch write operations.");
    const batch = writeBatch(db);
    const storyCollectionRef = collection(db, 'stories');
    const newStoryRef = doc(storyCollectionRef); 

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
    console.log(`[createStoryAction] Story document (ID: ${newStoryRef.id}) added to batch.`);

    const storyNodesCollectionRef = collection(db, 'stories', newStoryRef.id, 'nodes');
    const firstNodeRef = doc(storyNodesCollectionRef); 

    const firstStoryNode: Omit<StoryNode, 'id'> = {
      storyId: newStoryRef.id,
      authorId,
      authorUsername: authorUsername || 'Anonymous',
      authorProfilePictureUrl: authorProfilePictureUrl || undefined,
      content: initialNodeContent,
      order: currentTime,
      parentId: null,
      createdAt: currentTime,
      updatedAt: currentTime,
      upvotes: 0,
      downvotes: 0,
      votedBy: {},
      commentCount: 0,
    };
    batch.set(firstNodeRef, firstStoryNode);
    console.log(`[createStoryAction] First story node (ID: ${firstNodeRef.id}) for story ${newStoryRef.id} added to batch.`);

    await batch.commit();
    console.log("[createStoryAction] Firestore batch committed successfully.");

    // Revalidate paths to ensure fresh data is fetched on navigation
    revalidatePath('/stories');
    revalidatePath(`/stories/${newStoryRef.id}`);
    revalidatePath('/dashboard'); // If dashboard lists stories
    if (authorId) {
      revalidatePath(`/profile/${authorId}`); // If profile lists stories/contributions
    }
    console.log("[createStoryAction] Paths revalidated successfully.");

    return { success: status === "published" ? "Your story is now live!" : "Your story has been saved as a draft.", storyId: newStoryRef.id };
  } catch (error: any) {
    console.error("[createStoryAction] UNCAUGHT ERROR in action's try-catch block:", error);
    // Log more details if available
    if (error.cause) console.error("[createStoryAction] Error Cause:", error.cause);
    if (error.stack) console.error("[createStoryAction] Error Stack:", error.stack);
    
    return { error: `An unexpected server error occurred: ${error.message || "Please check server logs for more details."}`, storyId: null };
  }
}
