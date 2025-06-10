// src/app/dashboard/page.tsx
"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push("/login");
    }
  }, [currentUser, loading, router]);

  if (loading || !currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-4xl font-headline mb-4">Welcome, {currentUser.displayName || currentUser.email}!</h1>
        <p className="text-lg text-muted-foreground">This is your EchoSphere dashboard. Here's what you can do:</p>
      </section>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Your Stories</CardTitle>
            <CardDescription>Manage your published and draft stories.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Placeholder for story list or stats */}
            <p className="text-sm text-muted-foreground">You have 0 stories.</p>
            <Button asChild className="mt-4">
              <Link href="/stories/create">Create New Story</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Activity Feed</CardTitle>
            <CardDescription>Recent activity related to your content.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Placeholder for activity feed */}
            <p className="text-sm text-muted-foreground">No recent activity.</p>
            <Button variant="outline" asChild className="mt-4">
              <Link href="/notifications">View Notifications</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Profile Settings</CardTitle>
            <CardDescription>Update your profile information.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Keep your profile up-to-date.</p>
            <Button asChild className="mt-4">
              <Link href={`/profile/${currentUser.uid}`}>View Profile</Link>
            </Button>
             <Button variant="outline" asChild className="mt-2 ml-2">
              <Link href="/settings">Edit Settings</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
      
      {/* Placeholder for anonymous user upgrade */}
      {currentUser.isAnonymous && (
         <Card className="mt-8 bg-accent/20 border-accent">
          <CardHeader>
            <CardTitle className="font-headline text-accent-foreground">Upgrade Your Account</CardTitle>
            <CardDescription className="text-accent-foreground/80">
              You are currently signed in anonymously. To save your stories and interactions permanently, please create a full account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="default">
              <Link href="/signup?upgrade=true">Create Full Account</Link>
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              This will link your current anonymous activity to your new account.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
