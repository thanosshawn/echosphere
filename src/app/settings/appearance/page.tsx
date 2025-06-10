
// src/app/settings/appearance/page.tsx
"use client";

import ThemeSwitcher from "@/components/ThemeSwitcher";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function AppearanceSettingsPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push("/login?redirect=/settings/appearance");
    }
  }, [currentUser, authLoading, router]);

  if (authLoading || !currentUser) {
    return <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }
  
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <Button variant="outline" asChild className="mb-4">
        <Link href="/settings">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Settings
        </Link>
      </Button>
      <h1 className="text-4xl font-headline">Appearance Settings</h1>
      
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline">Customize Theme</CardTitle>
          <CardDescription>
            Personalize the look and feel of EchoSphere. Changes are saved automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeSwitcher />
        </CardContent>
      </Card>
    </div>
  );
}
