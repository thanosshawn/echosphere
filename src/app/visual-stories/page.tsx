// src/app/visual-stories/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, GalleryHorizontalEnd } from "lucide-react";
import Image from "next/image";

export default function VisualStoriesPage() {
  return (
    <div className="max-w-5xl mx-auto py-8">
      <section className="text-center mb-12">
        <div className="inline-flex items-center justify-center bg-primary/10 p-3 rounded-full mb-4">
            <GalleryHorizontalEnd className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-headline mb-3">Visual Stories</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          A space for narratives told through images, comics, and visual sequences.
        </p>
      </section>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Coming Soon!</CardTitle>
          <CardDescription>
            We're currently developing this exciting new section. Stay tuned for a visually rich storytelling experience.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-xl font-semibold mb-2">What to Expect:</h2>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Image-driven narratives</li>
                <li>Comic strip hosting</li>
                <li>Photo essays</li>
                <li>Interactive visual journeys</li>
                <li>Community showcases of visual art</li>
              </ul>
              <p className="mt-4 text-sm">
                Prepare to explore stories where pictures don't just illustrate the words—they <span className="italic">are</span> the words.
              </p>
            </div>
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden">
              <Image 
                src="https://placehold.co/600x400.png" 
                alt="Visual stories placeholder" 
                width={600} 
                height={400} 
                className="object-cover"
                data-ai-hint="camera photography abstract"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="mt-12 text-center">
        <h3 className="text-xl font-semibold mb-2">Interested in contributing?</h3>
        <p className="text-muted-foreground">
          We'll be announcing submission guidelines soon. Get your cameras and drawing tablets ready!
        </p>
        <Camera className="h-12 w-12 text-primary mx-auto mt-6 opacity-50" />
      </section>
    </div>
  );
}
