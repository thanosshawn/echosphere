
// src/app/settings/page.tsx
"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { User, Shield, Bell, Palette, LogOut, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const { currentUser, loading: authLoading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push("/login?redirect=/settings");
    }
  }, [currentUser, authLoading, router]);

  if (authLoading || !currentUser) {
     return <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  const settingCategories = [
    {
      title: "Profile",
      description: "Update your personal information, bio, and profile picture.",
      icon: <User className="h-5 w-5 text-primary" />,
      link: "/settings/profile", // Assuming this page exists or will be created
    },
    {
      title: "Account",
      description: "Manage your email, password, and account security settings.",
      icon: <Shield className="h-5 w-5 text-primary" />,
      link: "/settings/account", // Assuming this page exists or will be created
    },
    {
      title: "Notifications",
      description: "Configure your notification preferences.",
      icon: <Bell className="h-5 w-5 text-primary" />,
      link: "/settings/notifications", // Assuming this page exists or will be created
    },
    {
      title: "Appearance",
      description: "Customize the look and feel of EchoSphere (e.g., theme).",
      icon: <Palette className="h-5 w-5 text-primary" />,
      link: "/settings/appearance", // Updated link
    },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <h1 className="text-4xl font-headline mb-8">Settings</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        {settingCategories.map((category) => (
          <Card key={category.title} className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
              {category.icon}
              <CardTitle className="font-headline text-xl">{category.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{category.description}</p>
              <Button variant="outline" asChild size="sm">
                <Link href={category.link}>Go to {category.title}</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="font-headline">Logout</CardTitle>
          <CardDescription>Sign out of your EchoSphere account.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" /> Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
