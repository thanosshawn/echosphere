
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
import { getWritingSuggestions } from '@/ai/flows/writing-suggester-flow';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Loader2, ArrowLeft, PlusCircle, Edit2, Maximize, Lightbulb, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import RichTextEditor from "@/components/editor/RichTextEditor";
import Link from "next/link";

const addNodeFormSchema = z.object({
  newNodeContent: z.string().min(10, "Node content must be at least 10 characters (HTML allowed).").refine(value => value !== '<p></p>', { message: "Node content cannot be empty." }),
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
  const [isSubmittingNode, setIsSubmittingNode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [showSuggestionsDialog, setShowSuggestionsDialog] = useState(false);

  const form = useForm<AddNodeFormValues>({
    resolver: zodResolver(addNodeFormSchema),
    defaultValues: {
      newNodeContent: "<p></p>",
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
          toast({ title: "Access Denied", description: "You cannot edit this story.", variant: "destructive" });
          router.push(`/stories/${storyId}`);
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
             upvotes: nodeData.upvotes || 0,
             downvotes: nodeData.downvotes || 0,
             votedBy: nodeData.votedBy || {},
             commentCount: nodeData.commentCount || 0,
          } as StoryNode);
        });
        setStoryNodes(fetchedNodes);
        if (fetchedNodes.length > 0 && !form.getValues('parentNodeId')) {
          const urlParams = new URLSearchParams(window.location.search);
          const targetNodeId = urlParams.get('nodeId');
          form.setValue('parentNodeId', targetNodeId || fetchedNodes[fetchedNodes.length - 1].id);
        }
      } else {
        setError("Story not found.");
        toast({ title: "Error", description: "Story not found.", variant: "destructive" });
        setStory(null);
        router.push('/stories');
      }
    } catch (e) {
      console.error("Error fetching story and nodes:", e);
      setError("Failed to load story data.");
      toast({ title: "Error", description: "Failed to load story data.", variant: "destructive" });
    }
    setIsLoadingPage(false);
  }, [storyId, currentUser, db, form, toast, router]);


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
    setIsSubmittingNode(true);

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
    } else if (result.success && result.newNodeId) {
      toast({ title: "Node Added!", description: result.success });
      form.reset({ newNodeContent: "<p></p>", parentNodeId: result.newNodeId }); 
      fetchStoryAndNodes(); 
    }
    setIsSubmittingNode(false);
  }

  const handleGetSuggestions = async () => {
    const currentText = form.getValues("newNodeContent");
    const storyGenre = story?.category;

    if (!currentText || currentText === "<p></p>") {
      toast({ title: "Cannot get suggestions", description: "Please write some content for the new node first.", variant: "destructive" });
      return;
    }

    setIsFetchingSuggestions(true);
    try {
      const result = await getWritingSuggestions({ currentText, storyGenre });
      setAiSuggestions(result.suggestions);
      setShowSuggestionsDialog(true);
    } catch (error) {
      console.error("Error fetching AI suggestions:", error);
      toast({ title: "AI Suggestion Error", description: "Could not fetch suggestions at this time.", variant: "destructive" });
    } finally {
      setIsFetchingSuggestions(false);
    }
  };

  if (isLoadingPage || authLoading) {
    return <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  if (error) {
    return <div className="text-center py-10 text-destructive">{error} <Button variant="link" onClick={() => router.push('/dashboard')}>Go to Dashboard</Button></div>;
  }

  if (!story) {
    return <div className="text-center py-10">Story data is not available. <Button variant="link" onClick={() => router.push('/stories')}>Browse Stories</Button></div>;
  }

  return (
    <>
      <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8 py-4 sm:py-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => router.push(`/stories/${story.id}`)} size="sm">
            <ArrowLeft className="mr-1.5 h-4 w-4" /> View Story
          </Button>
          {/* Placeholder for story settings edit link */}
          {/* <Button variant="outline" onClick={() => router.push(`/stories/settings/${story.id}`)} size="sm" className="flex items-center gap-1.5"> 
              <Edit2 className="h-4 w-4"/> Edit Story Details
          </Button> */}
        </div>

        <div className="text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-headline">Edit Story:</h1>
          <p className="text-lg sm:text-xl text-primary font-semibold">{story.title}</p>
        </div>
        
        <Card className="rounded-lg">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="font-headline text-xl sm:text-2xl">Existing Story Nodes</CardTitle>
            <CardDescription className="text-sm">Review current nodes. New nodes branch from a selected parent.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-4 sm:p-6 max-h-[300px] overflow-y-auto">
            {storyNodes.length > 0 ? (
              storyNodes.map((node, index) => (
                <div key={node.id} className="p-3 border rounded-md bg-muted/30 relative group">
                  <div className="flex justify-between items-start mb-1">
                      <h3 className="text-sm sm:text-base font-semibold text-primary/90 pr-8">
                          Node {index + 1} 
                          {node.parentId && <span className="text-2xs sm:text-xs text-muted-foreground ml-1.5">(Parent: ...{node.parentId.slice(-4)})</span>}
                      </h3>
                  </div>
                  <div 
                      className="prose prose-xs sm:prose-sm dark:prose-invert max-w-none line-clamp-3"
                      dangerouslySetInnerHTML={{ __html: node.content }} 
                  />
                  <p className="text-2xs sm:text-xs text-muted-foreground mt-1.5">
                    By: {node.authorUsername} &bull; {new Date(node.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No nodes yet (besides the initial one, if created).</p>
            )}
          </CardContent>
        </Card>

        <Separator />

        <Card className="shadow-lg rounded-lg">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="font-headline text-xl sm:text-2xl">Add New Story Node</CardTitle>
            <CardDescription className="text-sm">Continue your story by adding a new node.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onAddNodeSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="parentNodeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Branch from Node</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="text-sm w-full">
                            <SelectValue placeholder="Select parent node" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {storyNodes.length > 0 ? storyNodes.map((node, index) => (
                            <SelectItem key={node.id} value={node.id} className="text-sm">
                              Node {index + 1}: "{node.content.replace(/<[^>]+>/g, '').substring(0, 30)}..."
                            </SelectItem>
                          )) : <SelectItem value="" disabled>No existing nodes to select</SelectItem>}
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-xs">Choose an existing node to add your contribution after.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="newNodeContent"
                  render={({ field }) => (
                    <FormItem>
                       <div className="flex justify-between items-center mb-1">
                        <FormLabel className="text-base">Content for New Node</FormLabel>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleGetSuggestions}
                          disabled={isFetchingSuggestions}
                        >
                          {isFetchingSuggestions ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Lightbulb className="mr-2 h-4 w-4" />
                          )}
                          AI Suggestions
                        </Button>
                      </div>
                      <FormControl>
                        <RichTextEditor
                          initialContent={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                       <FormDescription className="text-xs">Write your contribution here. Use the toolbar for formatting.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex flex-col sm:flex-row justify-end pt-3">
                  <Button type="submit" disabled={isSubmittingNode || !form.formState.isValid || storyNodes.length === 0} className="w-full sm:w-auto">
                    {isSubmittingNode && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Node
                  </Button>
                </div>
                 {storyNodes.length === 0 && (
                  <p className="text-xs text-destructive text-center mt-2">
                    This story doesn't have any selectable parent nodes yet. An initial node must exist.
                  </p>
                )}
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showSuggestionsDialog} onOpenChange={setShowSuggestionsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>AI Writing Suggestions</DialogTitle>
            <DialogDescription>
              Here are some ideas to help you continue your story. Click the copy icon to copy a suggestion.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4 max-h-[50vh] overflow-y-auto">
            {aiSuggestions.length > 0 ? aiSuggestions.map((suggestion, index) => (
              <Card key={index} className="p-3 bg-muted/50">
                <div className="flex justify-between items-start gap-2">
                  <p className="text-sm flex-grow">{suggestion}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 flex-shrink-0"
                    onClick={() => {
                      navigator.clipboard.writeText(suggestion);
                      toast({ title: "Copied to clipboard!" });
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            )) : <p className="text-sm text-muted-foreground text-center">No suggestions available at the moment.</p>}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowSuggestionsDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

