
// src/app/stories/edit/[storyId]/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, collection, getDocs, query, orderBy as firestoreOrderBy, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Story, StoryNode } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { addStoryNodeAction } from "./actions";
import type { AddStoryNodeActionInput } from "./actions";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription, // Added FormDescription
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
// Textarea removed
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Loader2, ArrowLeft, PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import RichTextEditor from "@/components/editor/RichTextEditor";

const addNodeFormSchema = z.object({
  newNodeContent: z.string().min(10, "Node content must be at least 10 characters (HTML allowed)."),
  parentNodeId: z.string().min(1, "You must select a parent node to branch from."),
});
type AddNodeFormValues = z.infer<typeof addNodeFormSchema>;

export default function EditStoryPage() {
  const params = useParams();
  const storyId = params.storyId as string;
  const router = useRouter();
  const { currentUser, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [story, setStory] = useState<Story | null>(null);
  const [storyNodes, setStoryNodes] = useState<StoryNode[]>([]);
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<AddNodeFormValues>({
    resolver: zodResolver(addNodeFormSchema),
    defaultValues: {
      newNodeContent: "<p></p>", // Start with an empty paragraph for Tiptap
      parentNodeId: "",
    },
  });
  
  const fetchStoryAndNodes = useCallback(async () => {
    if (!currentUser || !storyId || !db) return;
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
        setStory({ 
          id: storySnap.id, 
          ...storyData,
          createdAt: Number(storyData.createdAt),
          updatedAt: Number(storyData.updatedAt),
         });

        const nodesCollectionRef = collection(db, "stories", storyId, "nodes");
        const nodesQuery = query(nodesCollectionRef, firestoreOrderBy("order", "asc"));
        const nodesSnapshot = await getDocs(nodesQuery);
        const fetchedNodes: StoryNode[] = [];
        nodesSnapshot.forEach((nodeDoc) => {
          const nodeData = nodeDoc.data();
          fetchedNodes.push({
            id: nodeDoc.id,
            ...nodeData,
             order: Number(nodeData.order),
             // Ensure all fields from StoryNode type are mapped
             upvotes: nodeData.upvotes || 0,
             downvotes: nodeData.downvotes || 0,
             votedBy: nodeData.votedBy || {},
             commentCount: nodeData.commentCount || 0,
          } as StoryNode);
        });
        setStoryNodes(fetchedNodes);
        if (fetchedNodes.length > 0 && !form.getValues('parentNodeId')) {
          // Default parentNodeId to the last node if not already set
          form.setValue('parentNodeId', fetchedNodes[fetchedNodes.length - 1].id);
        }

      } else {
        setError("Story not found.");
        setStory(null);
      }
    } catch (e) {
      console.error("Error fetching story and nodes:", e);
      setError("Failed to load story data.");
    }
    setIsLoadingPage(false);
  }, [storyId, currentUser, db, form]);


  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push(`/login?redirect=/stories/edit/${storyId}`);
      return;
    }
    if (currentUser && storyId && db) {
      fetchStoryAndNodes();
    } else if (!db && !authLoading) {
        setError("Database service is unavailable.");
        setIsLoadingPage(false);
    }
  }, [storyId, currentUser, authLoading, router, db, fetchStoryAndNodes]);


  async function onAddNodeSubmit(values: AddNodeFormValues) {
    if (!currentUser || !story) return;
    setIsSubmitting(true);

    const actionInput: AddStoryNodeActionInput = {
      storyId: story.id,
      authorId: currentUser.uid,
      authorUsername: currentUser.displayName || currentUser.email || "Anonymous",
      authorProfilePictureUrl: currentUser.photoURL || null,
      newNodeContent: values.newNodeContent,
      parentNodeId: values.parentNodeId,
    };

    const result = await addStoryNodeAction(actionInput);

    if (result.error) {
      toast({ title: "Error Adding Node", description: result.error, variant: "destructive" });
    } else if (result.success) {
      toast({ title: "Node Added!", description: result.success });
      form.reset({ newNodeContent: "<p></p>", parentNodeId: values.parentNodeId }); // Reset content, keep parent
      fetchStoryAndNodes(); // Re-fetch to update the list and story data
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
          <CardTitle className="font-headline">Existing Story Nodes</CardTitle>
          <CardDescription>Review the current nodes of your story. New nodes will branch from a selected parent.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {storyNodes.length > 0 ? (
            storyNodes.map((node, index) => (
              <div key={node.id} className="p-4 border rounded-md bg-muted/30">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold text-primary">
                        Node {index + 1} (ID: ...{node.id.slice(-6)})
                        {node.parentId && <span className="text-xs text-muted-foreground ml-2">(Parent: ...{node.parentId.slice(-6)})</span>}
                    </h3>
                    {/* Placeholder for Edit Node button */}
                </div>
                <div 
                    className="prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: node.content }} 
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Created: {new Date(node.createdAt).toLocaleString()}
                </p>
              </div>
            ))
          ) : (
            <p>No nodes have been added to this story yet, besides the initial one (which is not shown here for editing).</p>
          )}
        </CardContent>
      </Card>

      <Separator />

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Add New Story Node</CardTitle>
          <CardDescription>Continue your story by adding a new node, branching from an existing one.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onAddNodeSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="parentNodeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg">Branch from Node</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select parent node" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {storyNodes.map((node, index) => (
                          <SelectItem key={node.id} value={node.id}>
                            Node {index + 1}: "{node.content.replace(/<[^>]+>/g, '').substring(0, 30)}..." (ID: ...{node.id.slice(-6)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Choose an existing node to add your new contribution after.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="newNodeContent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg">Content for New Node</FormLabel>
                    <FormControl>
                      <RichTextEditor
                        initialContent={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                     <FormDescription>Write your contribution here. Use the toolbar for formatting.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting || !form.formState.isValid}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Node
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
