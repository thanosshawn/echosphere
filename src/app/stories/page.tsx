// src/app/stories/page.tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, Heart, MessageCircle as MessageIcon, Search, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

// Dummy data for stories - replace with actual data fetching
const dummyStories = [
  {
    id: "1",
    title: "The Journey of a Thousand Stars",
    author: "Cosmic Voyager",
    authorProfilePictureUrl: "https://placehold.co/40x40.png",
    coverImageUrl: "https://placehold.co/600x400.png",
    dataAiHint: "galaxy stars",
    excerpt: "A tale of adventure across distant galaxies, seeking the origin of an ancient signal...",
    tags: ["Sci-Fi", "Adventure", "Space"],
    views: 1200,
    likes: 350,
    comments: 45,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
  },
  {
    id: "2",
    title: "Whispers in the Old Forest",
    author: "Elara Meadowlight",
    authorProfilePictureUrl: "https://placehold.co/40x40.png",
    coverImageUrl: "https://placehold.co/600x400.png",
    dataAiHint: "mystical forest",
    excerpt: "An ancient forest holds secrets, and only those who listen carefully can hear its whispers...",
    tags: ["Fantasy", "Mystery", "Nature"],
    views: 850,
    likes: 210,
    comments: 30,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
  },
  {
    id: "3",
    title: "City of Echoes",
    author: "Urban Explorer",
    coverImageUrl: "https://placehold.co/600x400.png",
    dataAiHint: "futuristic city",
    excerpt: "In a sprawling metropolis of the future, every action creates an echo that shapes reality...",
    tags: ["Cyberpunk", "Dystopian", "Tech"],
    views: 2500,
    likes: 600,
    comments: 120,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
  },
];

export default function StoriesPage() {
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
                <SelectItem value="sci-fi">Sci-Fi</SelectItem>
                <SelectItem value="fantasy">Fantasy</SelectItem>
                <SelectItem value="mystery">Mystery</SelectItem>
                <SelectItem value="adventure">Adventure</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">Popularity</SelectItem>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="trending">Trending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <section>
        {dummyStories.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {dummyStories.map((story) => (
              <Card key={story.id} className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                <Link href={`/stories/${story.id}`} className="block">
                  <Image
                    src={story.coverImageUrl || `https://placehold.co/600x400.png?text=${story.title.replace(/\s/g, "+")}`}
                    alt={`Cover image for ${story.title}`}
                    width={600}
                    height={300} // Adjusted for aspect ratio
                    className="w-full h-48 object-cover" // Fixed height for card image
                    data-ai-hint={story.dataAiHint || "story cover"}
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
                       <Image src={story.authorProfilePictureUrl} alt={story.author || "author"} width={24} height={24} className="rounded-full mr-2" />
                    ) : <User className="h-4 w-4 mr-2" /> }
                    <span>{story.author || "Anonymous"}</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <CardDescription className="line-clamp-3">{story.excerpt}</CardDescription>
                  <div className="mt-3 space-x-2">
                    {story.tags.map(tag => (
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
                    <span className="flex items-center gap-1"><MessageIcon className="h-4 w-4" /> {story.comments}</span>
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
            <p className="text-xl text-muted-foreground">No stories found. Try adjusting your filters or search.</p>
            <Button asChild className="mt-6">
              <Link href="/stories/create">Be the first to share a story!</Link>
            </Button>
          </div>
        )}
      </section>

      {/* Pagination (Placeholder) */}
      <section className="flex justify-center mt-12">
        <Button variant="outline" className="mr-2">Previous</Button>
        <Button variant="outline">Next</Button>
      </section>
    </div>
  );
}
