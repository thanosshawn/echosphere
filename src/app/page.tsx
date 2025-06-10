// src/app/page.tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquareText, Users, Edit3, BellRing, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  const features = [
    {
      icon: <Edit3 className="h-12 w-12 text-primary" />,
      title: "Create & Share Stories",
      description: "Craft beautiful stories with rich text support and cover images. Share your voice with the world.",
      dataAiHint: "writing quill",
    },
    {
      icon: <MessageSquareText className="h-12 w-12 text-primary" />,
      title: "Threaded Discussions",
      description: "Engage in meaningful conversations with a multi-level threaded discussion system.",
      dataAiHint: "speech bubbles",
    },
    {
      icon: <BellRing className="h-12 w-12 text-primary" />,
      title: "Real-Time Notifications",
      description: "Stay updated with instant notifications for comments, replies, followers, and likes.",
      dataAiHint: "notification bell",
    },
    {
      icon: <Users className="h-12 w-12 text-primary" />,
      title: "User Profiles",
      description: "Build your identity with public profiles, showcasing your stories and connections.",
      dataAiHint: "profile avatar",
    },
    {
      icon: <Search className="h-12 w-12 text-primary" />,
      title: "Discover Content",
      description: "Easily find stories and users. Filter by tags, popularity, and explore trending topics.",
      dataAiHint: "magnifying glass",
    },
  ];

  return (
    <div className="space-y-16 md:space-y-24">
      <section className="text-center py-20 md:py-28 bg-muted rounded-xl shadow-lg">
        <div className="container mx-auto px-4">
          <h1 className="text-5xl md:text-6xl font-headline font-bold mb-6 text-primary">
            Welcome to EchoSphere
          </h1>
          <p className="text-xl md:text-2xl text-foreground mb-10 max-w-3xl mx-auto">
            A new dimension of storytelling and community engagement. Share your narratives, spark discussions, and connect with like-minded individuals.
          </p>
          <div className="space-x-4">
            <Button size="lg" asChild>
              <Link href="/signup">Get Started</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/stories">Explore Stories</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-headline font-semibold text-center mb-12 md:mb-16">
            Features That Empower Your Voice
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="items-center text-center">
                  <div className="p-4 bg-primary/10 rounded-full mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="font-headline text-2xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription className="text-md text-muted-foreground leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28 bg-primary/5 rounded-xl shadow-lg">
        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-headline font-semibold mb-6">
              Join Our Growing Community
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              EchoSphere is more than just a platform; it's a community of creators, thinkers, and communicators. Connect, collaborate, and grow together.
            </p>
            <Button size="lg" asChild>
              <Link href="/signup">Sign Up Today</Link>
            </Button>
          </div>
          <div>
            <Image
              src="https://placehold.co/600x400.png"
              alt="Community illustration"
              width={600}
              height={400}
              className="rounded-lg shadow-xl"
              data-ai-hint="diverse community"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
