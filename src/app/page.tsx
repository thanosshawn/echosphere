
// src/app/page.tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquareText, Users, Edit3, BellRing, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  const features = [
    {
      icon: <Edit3 className="h-10 w-10 sm:h-12 sm:w-12 text-primary" />,
      title: "Create & Share Stories",
      description: "Craft beautiful stories with rich text support and cover images. Share your voice with the world.",
      dataAiHint: "writing quill",
    },
    {
      icon: <MessageSquareText className="h-10 w-10 sm:h-12 sm:w-12 text-primary" />,
      title: "Threaded Discussions",
      description: "Engage in meaningful conversations with a multi-level threaded discussion system.",
      dataAiHint: "speech bubbles",
    },
    {
      icon: <BellRing className="h-10 w-10 sm:h-12 sm:w-12 text-primary" />,
      title: "Real-Time Notifications",
      description: "Stay updated with instant notifications for comments, replies, followers, and likes.",
      dataAiHint: "notification bell",
    },
    {
      icon: <Users className="h-10 w-10 sm:h-12 sm:w-12 text-primary" />,
      title: "User Profiles",
      description: "Build your identity with public profiles, showcasing your stories and connections.",
      dataAiHint: "profile avatar",
    },
    {
      icon: <Search className="h-10 w-10 sm:h-12 sm:w-12 text-primary" />,
      title: "Discover Content",
      description: "Easily find stories and users. Filter by tags, popularity, and explore trending topics.",
      dataAiHint: "magnifying glass",
    },
  ];

  return (
    <div className="space-y-16 md:space-y-24">
      <section className="text-center py-16 md:py-28 bg-muted rounded-xl shadow-lg">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-headline font-bold mb-6 text-primary">
            Welcome to EchoSphere
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-foreground mb-8 sm:mb-10 max-w-3xl mx-auto">
            A new dimension of storytelling and community engagement. Share your narratives, spark discussions, and connect with like-minded individuals.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild className="w-full sm:w-auto">
              <Link href="/signup">Get Started</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
              <Link href="/stories">Explore Stories</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-headline font-semibold text-center mb-12 md:mb-16">
            Features That Empower Your Voice
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
                <CardHeader className="items-center text-center">
                  <div className="p-3 sm:p-4 bg-primary/10 rounded-full mb-3 sm:mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="font-headline text-xl sm:text-2xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center flex-grow">
                  <CardDescription className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-28 bg-primary/5 rounded-xl shadow-lg">
        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div className="text-center md:text-left">
            <h2 className="text-3xl sm:text-4xl font-headline font-semibold mb-6">
              Join Our Growing Community
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground mb-8">
              EchoSphere is more than just a platform; it's a community of creators, thinkers, and communicators. Connect, collaborate, and grow together.
            </p>
            <Button size="lg" asChild className="w-full sm:w-auto md:mx-0 mx-auto block sm:inline-block">
              <Link href="/signup">Sign Up Today</Link>
            </Button>
          </div>
          <div className="flex justify-center">
            <Image
              src="https://placehold.co/600x400.png"
              alt="Community illustration"
              width={600}
              height={400}
              className="rounded-lg shadow-xl w-full max-w-md md:max-w-full h-auto"
              data-ai-hint="diverse community"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
