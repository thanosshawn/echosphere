
// src/app/stories/[storyId]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Story } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Edit, Eye, Heart, Loader2, MessageSquare, Send, User, Tag } from "lucide-react";

export default function StoryDetailPage() {
  const params = useParams();
  const storyId = params.storyId as string;
  const router = useRouter();
  const { currentUser } = useAuth();

  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (storyId && db) {
      const fetchStory = async () => {
        setLoading(true);
        setError(null);
        try {
          const storyRef = doc(db, "stories", storyId);
          const storySnap = await getDoc(storyRef);
          if (storySnap.exists()) {
            const storyData = storySnap.data() as Omit<Story, 'id'>;
            // Ensure timestamps are numbers if they are Firestore Timestamps
            // For now, assuming they are numbers as per createStoryAction
            setStory({ 
              id: storySnap.id, 
              ...storyData,
              createdAt: Number(storyData.createdAt),
              updatedAt: Number(storyData.updatedAt),
            });
          } else {
            setError("Story not found.");
            setStory(null);
          }
        } catch (e) {
          console.error("Error fetching story:", e);
          setError("Failed to load the story. Please try again later.");
        }
        setLoading(false);
      };
      fetchStory();
    } else if (!db) {
      setError("Database service is unavailable.");
      setLoading(false);
    } else if (!storyId) {
        setError("Story ID is missing.");
        setLoading(false);
    }
  }, [storyId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading story...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-semibold mb-4 text-destructive">{error}</h2>
        <Button onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  if (!story) {
    // This case should ideally be covered by the error state, but as a fallback:
    return (
       <div className="text-center py-10">
        <h2 className="text-2xl font-semibold mb-4">Story not found.</h2>
        <Button onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }
  
  const isAuthor = currentUser?.uid === story.authorId;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Button variant="outline" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Stories
      </Button>

      <article>
        {story.coverImageUrl && (
          <div className="mb-8 rounded-lg overflow-hidden shadow-lg">
            <Image
              src={story.coverImageUrl}
              alt={`Cover image for ${story.title}`}
              width={800}
              height={400}
              className="w-full h-auto object-cover max-h-[400px]"
              data-ai-hint="story cover large"
            />
          </div>
        )}
        {!story.coverImageUrl && (
           <div className="mb-8 rounded-lg overflow-hidden shadow-lg bg-muted flex items-center justify-center h-[300px] md:h-[400px]">
            <Image 
              src={`https://placehold.co/800x400.png?text=${encodeURIComponent(story.title)}`}
              alt={`Placeholder for ${story.title}`}
              width={800}
              height={400}
              className="w-full h-auto object-cover max-h-[400px]"
              data-ai-hint="story placeholder large"
            />
          </div>
        )}

        <header className="mb-6">
          <h1 className="text-4xl md:text-5xl font-headline font-bold mb-4">{story.title}</h1>
          <div className="flex items-center space-x-4 text-muted-foreground text-sm">
            <Link href={`/profile/${story.authorId}`} className="flex items-center space-x-2 hover:text-primary transition-colors">
              <Avatar className="h-8 w-8">
                <AvatarImage src={story.authorProfilePictureUrl || undefined} alt={story.authorUsername} />
                <AvatarFallback>
                  {story.authorUsername ? story.authorUsername.charAt(0).toUpperCase() : <User className="h-4 w-4"/>}
                </AvatarFallback>
              </Avatar>
              <span>{story.authorUsername || "Anonymous"}</span>
            </Link>
            <span className="flex items-center"><CalendarDays className="mr-1.5 h-4 w-4" /> Published on {new Date(story.createdAt).toLocaleDateString()}</span>
            {isAuthor && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/stories/edit/${story.id}`}>
                  <Edit className="mr-1.5 h-4 w-4" /> Edit Story
                </Link>
              </Button>
            )}
          </div>
        </header>

        <Separator className="my-6" />

        {/* Render HTML content safely if it comes from a trusted source / sanitized */}
        {/* For now, treating as plain text or pre-formatted HTML */}
        <div 
          className="prose prose-lg dark:prose-invert max-w-none leading-relaxed"
          // If story.content is HTML and sanitized:
          // dangerouslySetInnerHTML={{ __html: story.content }} 
        >
          {/* For plain text content: */}
          {story.content.split('\\n').map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>


        <Separator className="my-8" />

        <footer className="space-y-6">
          {story.tags && story.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <Tag className="h-5 w-5 text-muted-foreground" />
              {story.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-sm">
                  <Link href={`/tags/${tag.toLowerCase()}`}>{tag}</Link>
                </Badge>
              ))}
            </div>
          )}

          <div className="flex items-center space-x-6 text-muted-foreground">
            <span className="flex items-center"><Eye className="mr-1.5 h-5 w-5" /> {story.views} views</span>
            <span className="flex items-center"><Heart className="mr-1.5 h-5 w-5" /> {story.likes} likes</span>
            <span className="flex items-center"><MessageSquare className="mr-1.5 h-5 w-5" /> {story.commentCount} comments</span>
          </div>
        </footer>
      </article>

      <Separator className="my-10" />

      {/* Comments Section Placeholder */}
      <section className="space-y-6">
        <h2 className="text-2xl font-headline font-semibold">Comments ({story.commentCount})</h2>
        {currentUser ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-headline">Leave a Comment</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea placeholder={`Commenting as ${currentUser.displayName || currentUser.email}...`} className="min-h-[100px]" />
            </CardContent>
            <CardFooter>
              <Button className="ml-auto"><Send className="mr-2 h-4 w-4" />Post Comment</Button>
            </CardFooter>
          </Card>
        ) : (
          <Card className="p-6 text-center bg-muted/50">
            <CardDescription>
              <Link href={`/login?redirect=/stories/${story.id}`} className="text-primary hover:underline font-semibold">Log in</Link> or <Link href={`/signup?redirect=/stories/${story.id}`} className="text-primary hover:underline font-semibold">sign up</Link> to leave a comment.
            </CardDescription>
          </Card>
        )}
        
        {/* Placeholder for existing comments */}
        <div className="py-6 text-center text-muted-foreground">
          <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No comments yet. Be the first to share your thoughts!</p>
          {/* Or, if there are comments, map through them here */}
        </div>
      </section>
    </div>
  );
}

