
// src/app/stories/page.tsx
"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query as firestoreQuery } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Story } from "@/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, Heart, MessageCircle as MessageIcon, Search, User, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function StoriesPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStories = async () => {
      if (!db) {
        setError("Database service is unavailable.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const storiesCollectionRef = collection(db, "stories");
        // Query to get published stories, ordered by creation date
        const q = firestoreQuery(storiesCollectionRef, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const fetchedStories: Story[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedStories.push({
            id: doc.id,
            authorId: data.authorId,
            authorUsername: data.authorUsername,
            authorProfilePictureUrl: data.authorProfilePictureUrl,
            title: data.title,
            content: data.content, // Keep content for excerpt generation if needed, or create an excerpt field
            coverImageUrl: data.coverImageUrl,
            tags: data.tags || [],
            category: data.category,
            status: data.status,
            createdAt: Number(data.createdAt), // Ensure it's a number
            updatedAt: Number(data.updatedAt), // Ensure it's a number
            views: data.views || 0,
            likes: data.likes || 0,
            commentCount: data.commentCount || 0,
          });
        });
        setStories(fetchedStories.filter(story => story.status === 'published')); // Only show published stories
      } catch (e) {
        console.error("Error fetching stories:", e);
        setError("Failed to load stories. Please try again later.");
      }
      setLoading(false);
    };

    fetchStories();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-15rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading stories...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-semibold mb-4 text-destructive">{error}</h2>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="text-center">
        <h1 className="text-4xl font-headline mb-2">Explore Stories</h1>
        <p className="text-lg text-muted-foreground">Discover captivating narratives from the EchoSphere community.</p>
      </section>

      <section className="sticky top-16 bg-background/80 backdrop-blur-md py-4 z-40 rounded-md shadow">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-grow w-full md:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input type="search" placeholder="Search stories by title, author, or tags..." className="pl-10 w-full" />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Select>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by Tag" />
              </SelectTrigger>
              <SelectContent>
                {/* TODO: Populate tags dynamically */}
                <SelectItem value="sci-fi">Sci-Fi</SelectItem>
                <SelectItem value="fantasy">Fantasy</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">Popularity</SelectItem>
                <SelectItem value="recent">Most Recent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <section>
        {stories.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {stories.map((story) => (
              <Card key={story.id} className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                <Link href={`/stories/${story.id}`} className="block">
                  <Image
                    src={story.coverImageUrl || `https://placehold.co/600x300.png?text=${encodeURIComponent(story.title)}`}
                    alt={`Cover image for ${story.title}`}
                    width={600}
                    height={300}
                    className="w-full h-48 object-cover"
                    data-ai-hint={`${story.category} ${story.tags && story.tags.length > 0 ? story.tags[0] : 'story'}`.substring(0, 20)} // Simple hint
                  />
                </Link>
                <CardHeader>
                  <CardTitle className="font-headline text-2xl">
                    <Link href={`/stories/${story.id}`} className="hover:text-primary transition-colors">
                      {story.title}
                    </Link>
                  </CardTitle>
                  <div className="flex items-center text-sm text-muted-foreground pt-1">
                    {story.authorProfilePictureUrl ? (
                       <Image src={story.authorProfilePictureUrl} alt={story.authorUsername || "author"} width={24} height={24} className="rounded-full mr-2" />
                    ) : <User className="h-4 w-4 mr-2" /> }
                    <Link href={`/profile/${story.authorId}`} className="hover:underline">
                        {story.authorUsername || "Anonymous"}
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  {/* Simple excerpt from content. For production, consider a dedicated excerpt field or better truncation. */}
                  <CardDescription className="line-clamp-3">{story.content.substring(0, 150)}...</CardDescription>
                  <div className="mt-3 space-x-2">
                    {story.tags?.slice(0,3).map(tag => ( // Show max 3 tags
                      <Link key={tag} href={`/tags/${tag.toLowerCase()}`} className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors">
                        {tag}
                      </Link>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="text-sm text-muted-foreground flex justify-between items-center border-t pt-4">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1"><Eye className="h-4 w-4" /> {story.views}</span>
                    <span className="flex items-center gap-1"><Heart className="h-4 w-4" /> {story.likes}</span>
                    <span className="flex items-center gap-1"><MessageIcon className="h-4 w-4" /> {story.commentCount}</span>
                  </div>
                  <Link href={`/stories/${story.id}`} className="text-primary hover:underline">
                    Read More
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground">No stories found yet. Be the first to publish!</p>
            <Button asChild className="mt-6">
              <Link href="/stories/create">Share Your Story</Link>
            </Button>
          </div>
        )}
      </section>

      {/* Basic Pagination (Placeholder - requires more logic for actual pagination) */}
      {stories.length > 0 && ( // Only show if there are stories
        <section className="flex justify-center mt-12">
          <Button variant="outline" className="mr-2" disabled>Previous</Button>
          <Button variant="outline" disabled>Next</Button>
        </section>
      )}
    </div>
  );
}
