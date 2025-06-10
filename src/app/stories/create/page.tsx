
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UploadCloud, FileText } from "lucide-react";
import { createStoryAction } from "./actions"; 
import type { CreateStoryFormValues } from "./actions"; 
import RichTextEditor from "@/components/editor/RichTextEditor";

const storyFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(150, "Title must be less than 150 characters"),
  initialNodeContent: z.string().min(10, "Initial story content must be at least 10 characters (HTML allowed).").refine(value => value !== '<p></p>', { message: "Initial story content cannot be empty." }),
  category: z.string().min(1, "Please select a category"),
  tags: z.string().optional(), 
  status: z.enum(["draft", "published"]),
  coverImage: z.instanceof(File).optional().nullable()
    .refine(file => !file || file.size <= 5 * 1024 * 1024, `Max file size is 5MB.`)
    .refine(file => !file || ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type), 'Only .jpg, .png, .gif, .webp formats are supported.'),
});

type ClientStoryFormValues = z.infer<typeof storyFormSchema>;

export default function CreateStoryPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push("/login?redirect=/stories/create");
    }
  }, [currentUser, authLoading, router]);

  const form = useForm<ClientStoryFormValues>({
    resolver: zodResolver(storyFormSchema),
    defaultValues: {
      title: "",
      initialNodeContent: "<p></p>", 
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
      setSelectedFileName(null);
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
    <div className="max-w-3xl mx-auto py-4 sm:py-8">
      <div className="text-center mb-6 sm:mb-8">
        <FileText className="h-12 w-12 text-primary mx-auto mb-2" />
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-headline">Create Your Story Thread</h1>
      </div>
      <Card className="shadow-xl rounded-lg">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="font-headline text-xl sm:text-2xl">New Masterpiece</CardTitle>
          <CardDescription className="text-sm">Fill in the details below to share your narrative.</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">Story Title</FormLabel>
                    <FormControl>
                      <Input placeholder="A catchy title for your story" {...field} className="text-sm"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="initialNodeContent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">Your Narrative (First Node)</FormLabel>
                    <FormControl>
                       <RichTextEditor
                        initialContent={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Write the first node of your story here. Use the toolbar for formatting.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="text-sm">
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
                      <FormLabel className="text-base">Tags</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., adventure, sci-fi" {...field} className="text-sm"/>
                      </FormControl>
                      <FormDescription className="text-xs">Comma-separated tags.</FormDescription>
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
                    <FormLabel className="text-base">Cover Image (Optional)</FormLabel>
                    <FormControl>
                        <div className="flex items-center justify-center w-full">
                            <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 sm:h-40 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted transition-colors">
                                <div className="flex flex-col items-center justify-center pt-4 pb-5 sm:pt-5 sm:pb-6">
                                    <UploadCloud className="w-8 h-8 sm:w-10 sm:w-10 mb-2 sm:mb-3 text-muted-foreground" />
                                    <p className="mb-1 text-xs sm:text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag & drop</p>
                                    <p className="text-2xs sm:text-xs text-muted-foreground">PNG, JPG, GIF, WEBP (MAX. 5MB)</p>
                                </div>
                                <Input 
                                    id="dropzone-file" 
                                    type="file" 
                                    className="hidden" 
                                    accept="image/png, image/jpeg, image/gif, image/webp"
                                    onChange={(e) => {
                                        const file = e.target.files ? e.target.files[0] : null;
                                        onChange(file);
                                        setSelectedFileName(file ? file.name : null);
                                    }}
                                    {...rest}
                                />
                            </label>
                        </div> 
                    </FormControl>
                    {selectedFileName && <FormDescription className="text-xs mt-1">Selected: {selectedFileName}</FormDescription>}
                    {!selectedFileName && <FormDescription className="text-xs mt-1">Upload an image to represent your story.</FormDescription>}
                    <FormMessage />
                </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">Publication Status</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full sm:w-[200px] text-sm">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="published">Publish</SelectItem>
                        </SelectContent>
                      </Select>
                    <FormDescription className="text-xs">Save as draft or publish for everyone.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || !form.formState.isValid} className="w-full sm:w-auto">
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
