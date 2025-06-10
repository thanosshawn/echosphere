
// src/app/stories/create/page.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
// Textarea removed
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UploadCloud } from "lucide-react";
import { createStoryAction } from "./actions"; // Ensure this path is correct
import type { CreateStoryFormValues } from "./actions"; // Import type from actions
import RichTextEditor from "@/components/editor/RichTextEditor";


// This schema is for client-side form validation
const storyFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(150, "Title must be less than 150 characters"),
  initialNodeContent: z.string().min(10, "Initial story content must be at least 10 characters (HTML allowed)."), // Updated name and min length
  category: z.string().min(1, "Please select a category"),
  tags: z.string().optional(), // Comma-separated tags
  status: z.enum(["draft", "published"]),
  coverImage: z.instanceof(File).optional().nullable(),
});

// Client-side form values type
type ClientStoryFormValues = z.infer<typeof storyFormSchema>;


export default function CreateStoryPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push("/login?redirect=/stories/create");
    }
  }, [currentUser, authLoading, router]);

  const form = useForm<ClientStoryFormValues>({
    resolver: zodResolver(storyFormSchema),
    defaultValues: {
      title: "",
      initialNodeContent: "<p></p>", // Start with an empty paragraph for Tiptap
      category: "",
      tags: "",
      status: "draft",
      coverImage: null,
    },
  });

  async function onSubmit(values: ClientStoryFormValues) {
    if (!currentUser) {
      toast({ title: "Authentication Error", description: "You must be logged in to create a story.", variant: "destructive"});
      router.push("/login?redirect=/stories/create");
      return;
    }
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("title", values.title);
    formData.append("initialNodeContent", values.initialNodeContent);
    formData.append("category", values.category);
    formData.append("tags", values.tags || "");
    formData.append("status", values.status);
    if (values.coverImage) {
      formData.append("coverImage", values.coverImage);
    }
    formData.append("authorId", currentUser.uid);
    formData.append("authorUsername", currentUser.displayName || currentUser.email || "Anonymous User");
    formData.append("authorProfilePictureUrl", currentUser.photoURL || "");
    
    const result = await createStoryAction(formData);

    if (result.error) {
      toast({ title: "Submission Error", description: result.error, variant: "destructive" });
    } else if (result.success && result.storyId) {
      toast({ title: "Story Submitted!", description: result.success });
      form.reset(); 
      router.push(`/stories/${result.storyId}`); 
    } else {
      toast({ title: "Unexpected Error", description: "Something went wrong. Please try again.", variant: "destructive" });
    }

    setIsSubmitting(false);
  }

  if (authLoading || !currentUser) {
    return <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-headline mb-8 text-center">Create Your Story Thread</h1>
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline">New Masterpiece</CardTitle>
          <CardDescription>Fill in the details below to share your narrative with the EchoSphere community.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg">Story Title</FormLabel>
                    <FormControl>
                      <Input placeholder="A catchy title for your story" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="initialNodeContent" // Updated name
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg">Your Narrative (First Node)</FormLabel>
                    <FormControl>
                       <RichTextEditor
                        initialContent={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormDescription>
                      Write the first node of your story here. Use the toolbar for formatting.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid md:grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg">Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="fiction">Fiction</SelectItem>
                          <SelectItem value="non-fiction">Non-Fiction</SelectItem>
                          <SelectItem value="poetry">Poetry</SelectItem>
                          <SelectItem value="tech">Tech</SelectItem>
                          <SelectItem value="life">Life</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg">Tags</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., adventure, sci-fi, personal growth" {...field} />
                      </FormControl>
                      <FormDescription>Comma-separated tags.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="coverImage"
                render={({ field: { onChange, value, ...rest } }) => (
                <FormItem>
                    <FormLabel className="text-lg">Cover Image (Optional)</FormLabel>
                    <FormControl>
                        <div className="flex items-center justify-center w-full">
                            <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted transition-colors">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                                    <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                    <p className="text-xs text-muted-foreground">PNG, JPG, GIF (MAX. 5MB)</p>
                                </div>
                                <Input 
                                    id="dropzone-file" 
                                    type="file" 
                                    className="hidden" 
                                    accept="image/*"
                                    onChange={(e) => onChange(e.target.files ? e.target.files[0] : null)}
                                    {...rest}
                                />
                            </label>
                        </div> 
                    </FormControl>
                    <FormDescription>
                    Upload an image that represents your story.
                    </FormDescription>
                    {form.formState.errors.coverImage && <FormMessage>{form.formState.errors.coverImage.message?.toString()}</FormMessage>}
                     {value && <p className="text-sm text-muted-foreground mt-2">Selected file: {value.name}</p>}
                </FormItem>
                )}
              />


              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg">Publication Status</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="published">Publish</SelectItem>
                        </SelectContent>
                      </Select>
                    <FormDescription>Save as draft to work on it later, or publish it for everyone to see.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-4 pt-4">
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || !form.formState.isValid}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {form.getValues("status") === "published" ? "Publish Story" : "Save Draft"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
