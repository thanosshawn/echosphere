
// src/app/about/page.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto py-8">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <Info className="h-8 w-8 text-primary" />
            <CardTitle className="text-3xl sm:text-4xl font-headline">About EchoSphere</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <p>
            Welcome to EchoSphere, a vibrant platform dedicated to the art of storytelling and collaborative creation. 
            Our mission is to provide a space where voices can converge, narratives can intertwine, and communities
            can be built around shared imagination.
          </p>
          <h2 className="font-headline text-2xl mt-6 mb-2">Our Vision</h2>
          <p>
            We believe that stories are the threads that connect us. In an increasingly fragmented world, EchoSphere
            aims to be a sanctuary for thoughtful discussion, creative exploration, and the timeless magic of
            narrative. Whether you're a seasoned author, an aspiring writer, or an avid reader, you'll find
            a home here.
          </p>
          <h2 className="font-headline text-2xl mt-6 mb-2">Core Features</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Story Posting & Management:</strong> Craft your tales with rich text support, add cover images, and organize them with tags.</li>
            <li><strong>Threaded Discussions:</strong> Engage in meaningful conversations directly within story nodes.</li>
            <li><strong>Interactive Narratives:</strong> Build upon existing stories or branch off in new directions with our unique node-based system.</li>
            <li><strong>User Profiles:</strong> Showcase your work, connect with other creators, and build your following.</li>
            <li><strong>Real-time Updates:</strong> Stay informed with notifications for comments, likes, and new followers.</li>
          </ul>
          <h2 className="font-headline text-2xl mt-6 mb-2">Join Our Community</h2>
          <p>
            EchoSphere is more than just a platform; it's a community. We encourage you to share your voice, 
            explore diverse perspectives, and contribute to the ever-expanding universe of stories.
          </p>
          <p className="mt-4">
            <em>This is a placeholder page. More details about EchoSphere will be added soon!</em>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
