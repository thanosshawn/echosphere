
// src/app/stories/edit/[storyId]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, collection, getDocs, query, orderBy as firestoreOrderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Story, StoryPart } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { addStoryPartAction, type AddStoryPartActionInput } from "./actions";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Loader2, ArrowLeft, PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

const addPartFormSchema = z.object({
  newPartContent: z.string().min(10, "Part content must be at least 10 characters"),
});
type AddPartFormValues = z.infer<typeof addPartFormSchema>;

export default function EditStoryPage() {
  const params = useParams();
  const storyId = params.storyId as string;
  const router = useRouter();
  const { currentUser, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [story, setStory] = useState<Story | null>(null);
  const [storyParts, setStoryParts] = useState<StoryPart[]>([]);
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<AddPartFormValues>({
    resolver: zodResolver(addPartFormSchema),
    defaultValues: {
      newPartContent: "",
    },
  });

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push(`/login?redirect=/stories/edit/${storyId}`);
      return;
    }

    if (storyId && db && currentUser) {
      const fetchStoryAndParts = async () => {
        setIsLoadingPage(true);
        setError(null);
        try {
          const storyRef = doc(db, "stories", storyId);
          const storySnap = await getDoc(storyRef);

          if (storySnap.exists()) {
            const storyData = storySnap.data() as Omit<Story, 'id'>;
            if (storyData.authorId !== currentUser.uid) {
              setError("You are not authorized to edit this story.");
              setStory(null);
              setIsLoadingPage(false);
              return;
            }
            setStory({ id: storySnap.id, ...storyData });

            const partsCollectionRef = collection(db, "stories", storyId, "parts");
            const partsQuery = firestoreQuery(partsCollectionRef, firestoreOrderBy("order", "asc"));
            const partsSnapshot = await getDocs(partsQuery);
            const fetchedParts: StoryPart[] = [];
            partsSnapshot.forEach((partDoc) => fetchedParts.push({ id: partDoc.id, ...partDoc.data() } as StoryPart));
            setStoryParts(fetchedParts);
          } else {
            setError("Story not found.");
            setStory(null);
          }
        } catch (e) {
          console.error("Error fetching story and parts:", e);
          setError("Failed to load story data.");
        }
        setIsLoadingPage(false);
      };
      fetchStoryAndParts();
    } else if (!db) {
        setError("Database service is unavailable.");
        setIsLoadingPage(false);
    }
  }, [storyId, currentUser, authLoading, router]);

  async function onAddPartSubmit(values: AddPartFormValues) {
    if (!currentUser || !story) return;
    setIsSubmitting(true);

    const actionInput: AddStoryPartActionInput = {
      storyId: story.id,
      authorId: currentUser.uid,
      newPartContent: values.newPartContent,
    };

    const result = await addStoryPartAction(actionInput);

    if (result.error) {
      toast({ title: "Error Adding Part", description: result.error, variant: "destructive" });
    } else if (result.success) {
      toast({ title: "Part Added!", description: result.success });
      form.reset();
      // Re-fetch parts to update the list
      if (db) { // Re-check db to satisfy TypeScript
        const partsCollectionRef = collection(db, "stories", storyId, "parts");
        const partsQuery = firestoreQuery(partsCollectionRef, firestoreOrderBy("order", "asc"));
        const partsSnapshot = await getDocs(partsQuery);
        const fetchedParts: StoryPart[] = [];
        partsSnapshot.forEach((partDoc) => fetchedParts.push({ id: partDoc.id, ...partDoc.data() } as StoryPart));
        setStoryParts(fetchedParts); // Update local state
        // Also update story's updatedAt and partCount from result if provided by action
        if (result.updatedStoryData) {
            setStory(prevStory => prevStory ? {...prevStory, ...result.updatedStoryData} : null);
        }
      }
    }
    setIsSubmitting(false);
  }

  if (isLoadingPage || authLoading) {
    return <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  if (error) {
    return <div className="text-center py-10 text-destructive">{error} <Button variant="link" onClick={() => router.push('/dashboard')}>Go to Dashboard</Button></div>;
  }

  if (!story) {
    return <div className="text-center py-10">Story not found or not authorized. <Button variant="link" onClick={() => router.push('/stories')}>Browse Stories</Button></div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <Button variant="outline" onClick={() => router.push(`/stories/${story.id}`)} className="mb-2">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Story
      </Button>
      <h1 className="text-4xl font-headline">Edit Story: {story.title}</h1>
      
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Existing Parts</CardTitle>
          <CardDescription>Review the current parts of your story.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {storyParts.length > 0 ? (
            storyParts.map((part) => (
              <div key={part.id} className="p-4 border rounded-md bg-muted/30">
                <h3 className="text-lg font-semibold text-primary mb-1">Part {part.order}</h3>
                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                  {part.content.split('\n').map((paragraph, pIndex) => (
                    paragraph.trim() ? <p key={`${part.id}-p-${pIndex}`}>{paragraph}</p> : null
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Last updated: {new Date(part.updatedAt).toLocaleString()}
                </p>
                {/* Placeholder for Edit Part button */}
                {/* <Button variant="outline" size="sm" className="mt-2">Edit Part</Button> */}
              </div>
            ))
          ) : (
            <p>No parts have been added to this story yet.</p>
          )}
        </CardContent>
      </Card>

      <Separator />

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Add New Part</CardTitle>
          <CardDescription>Continue your story by adding a new part.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onAddPartSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="newPartContent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg">Content for New Part</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Continue your narrative here..."
                        className="min-h-[200px] resize-y"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Part
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
