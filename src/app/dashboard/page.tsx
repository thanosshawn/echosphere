
// src/app/dashboard/page.tsx
"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Loader2, Edit3, Activity, UserCircle, ShieldAlert } from "lucide-react";

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
        <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <section>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-headline mb-2 sm:mb-4">Welcome, {currentUser.displayName || currentUser.email}!</h1>
        <p className="text-sm sm:text-base md:text-lg text-muted-foreground">This is your EchoSphere dashboard. Here's what you can do:</p>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="shadow-md hover:shadow-lg transition-shadow rounded-lg">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-2">
              <Edit3 className="h-6 w-6 text-primary" />
              <CardTitle className="font-headline text-lg sm:text-xl">Your Stories</CardTitle>
            </div>
            <CardDescription className="text-xs sm:text-sm">Manage your published and draft stories.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <p className="text-xs sm:text-sm text-muted-foreground">You have 0 stories.</p> {/* Placeholder */}
            <Button asChild className="mt-3 sm:mt-4 w-full sm:w-auto" size="sm">
              <Link href="/stories/create">Create New Story</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-shadow rounded-lg">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-2">
              <Activity className="h-6 w-6 text-primary" />
              <CardTitle className="font-headline text-lg sm:text-xl">Activity Feed</CardTitle>
            </div>
            <CardDescription className="text-xs sm:text-sm">Recent activity related to your content.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <p className="text-xs sm:text-sm text-muted-foreground">No recent activity.</p> {/* Placeholder */}
            <Button variant="outline" asChild className="mt-3 sm:mt-4 w-full sm:w-auto" size="sm">
              <Link href="/notifications">View Notifications</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-shadow rounded-lg">
          <CardHeader className="p-4 sm:p-6">
             <div className="flex items-center gap-3 mb-2">
              <UserCircle className="h-6 w-6 text-primary" />
              <CardTitle className="font-headline text-lg sm:text-xl">Profile Settings</CardTitle>
            </div>
            <CardDescription className="text-xs sm:text-sm">Update your profile information.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <p className="text-xs sm:text-sm text-muted-foreground">Keep your profile up-to-date.</p>
            <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row gap-2">
              <Button asChild className="w-full sm:w-auto" size="sm">
                <Link href={`/profile/${currentUser.uid}`}>View Profile</Link>
              </Button>
              <Button variant="outline" asChild className="w-full sm:w-auto" size="sm">
                <Link href="/settings">Edit Settings</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {currentUser.isAnonymous && (
         <Card className="mt-6 sm:mt-8 bg-accent/10 border-accent/50 rounded-lg">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-2">
                <ShieldAlert className="h-6 w-6 text-accent-foreground" />
                <CardTitle className="font-headline text-lg sm:text-xl text-accent-foreground">Upgrade Your Account</CardTitle>
            </div>
            <CardDescription className="text-xs sm:text-sm text-accent-foreground/80">
              You are currently signed in anonymously. To save your stories and interactions permanently, please create a full account.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <Button asChild variant="default" className="bg-accent hover:bg-accent/90 text-accent-foreground w-full sm:w-auto" size="sm">
              <Link href="/signup?upgrade=true">Create Full Account</Link>
            </Button>
            <p className="text-2xs sm:text-xs text-muted-foreground mt-2">
              This will link your current anonymous activity to your new account.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
