
// src/app/stories/page.tsx
"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, orderBy as firestoreOrderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Story } from "@/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, Heart, MessageCircle as MessageIcon, Search, User, Loader2, ArrowRight } from "lucide-react";
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
        const q = query(
          storiesCollectionRef, 
          where("status", "==", "published"), 
          firestoreOrderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        const fetchedStories: Story[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedStories.push({
            id: doc.id,
            ...data,
            authorId: data.authorId,
            authorUsername: data.authorUsername,
            title: data.title,
            tags: data.tags || [],
            category: data.category,
            status: data.status,
            createdAt: Number(data.createdAt),
            updatedAt: Number(data.updatedAt),
            views: data.views || 0,
            likes: data.likes || 0,
            // commentCount is a sum of node comments on story detail page, ensure it's handled if needed here
            commentCount: data.commentCount || (data.nodeCount ? (data.nodeCount * 0) : 0), // Placeholder if not directly on story
            nodeCount: data.nodeCount || 0, // Renamed from partCount
            firstNodeExcerpt: data.firstNodeExcerpt || "No excerpt available.",
          } as Story); 
        });
        setStories(fetchedStories);
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
      <section className="text-center pt-4 pb-8">
        <h1 className="text-3xl sm:text-4xl font-headline mb-2">Explore Stories</h1>
        <p className="text-md sm:text-lg text-muted-foreground max-w-2xl mx-auto">Discover captivating narratives from the EchoSphere community.</p>
      </section>

      <section className="sticky top-[65px] bg-background/90 backdrop-blur-md py-4 z-40 rounded-lg shadow-sm mb-8">
        <div className="container mx-auto px-2 sm:px-4">
          <div className="flex flex-col md:flex-row gap-3 items-center">
            <div className="relative flex-grow w-full md:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Search stories..." className="pl-10 w-full text-sm" />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Select>
                <SelectTrigger className="w-full md:w-[150px] text-sm">
                  <SelectValue placeholder="Filter by Tag" />
                </SelectTrigger>
                <SelectContent>
                  {/* TODO: Populate tags dynamically */}
                  <SelectItem value="all">All Tags</SelectItem>
                  <SelectItem value="sci-fi">Sci-Fi</SelectItem>
                  <SelectItem value="fantasy">Fantasy</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="w-full md:w-[150px] text-sm">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="popular">Popularity</SelectItem>
                  <SelectItem value="views">Most Views</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      <section>
        {stories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {stories.map((story) => (
              <Card key={story.id} className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out rounded-lg">
                <Link href={`/stories/${story.id}`} className="block group">
                  <div className="overflow-hidden aspect-[16/9] bg-muted">
                    <Image
                      src={story.coverImageUrl || `https://placehold.co/400x225.png?text=${encodeURIComponent(story.title)}`}
                      alt={`Cover image for ${story.title}`}
                      width={400}
                      height={225}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      data-ai-hint={`${story.category} ${story.tags && story.tags.length > 0 ? story.tags[0] : 'story'}`.substring(0, 20)}
                    />
                  </div>
                </Link>
                <CardHeader className="p-4">
                  <CardTitle className="font-headline text-xl lg:text-2xl leading-tight">
                    <Link href={`/stories/${story.id}`} className="hover:text-primary transition-colors">
                      {story.title}
                    </Link>
                  </CardTitle>
                  <div className="flex items-center text-xs text-muted-foreground pt-1 gap-1.5">
                    {story.authorProfilePictureUrl ? (
                       <Image src={story.authorProfilePictureUrl} alt={story.authorUsername || "author"} width={20} height={20} className="rounded-full" />
                    ) : <User className="h-3.5 w-3.5" /> }
                    <Link href={`/profile/${story.authorId}`} className="hover:underline">
                        {story.authorUsername || "Anonymous"}
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="p-4 flex-grow">
                  <CardDescription className="text-sm line-clamp-3">{story.firstNodeExcerpt || "No excerpt available."}</CardDescription>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {story.tags?.slice(0,2).map(tag => (
                      <Link key={tag} href={`/tags/${tag.toLowerCase()}`} className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors">
                        #{tag}
                      </Link>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="text-xs text-muted-foreground flex justify-between items-center border-t p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {story.views}</span>
                    <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" /> {story.likes}</span>
                    <span className="flex items-center gap-1"><MessageIcon className="h-3.5 w-3.5" /> {story.commentCount || 0}</span>
                  </div>
                  <Link href={`/stories/${story.id}`} className="text-primary hover:underline font-medium flex items-center gap-1">
                    Read More <ArrowRight className="h-3.5 w-3.5"/>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-xl text-muted-foreground">No stories found yet.</p>
            <p className="text-sm text-muted-foreground mb-6">Why not be the first to share yours?</p>
            <Button asChild className="mt-2">
              <Link href="/stories/create">Share Your Story</Link>
            </Button>
          </div>
        )}
      </section>

      {stories.length > 0 && ( /* Basic Pagination Placeholder */
        <section className="flex justify-center mt-12 space-x-2">
          <Button variant="outline" className="text-sm" disabled>Previous</Button>
          <Button variant="outline" className="text-sm" disabled>Next</Button>
        </section>
      )}
    </div>
  );
}
