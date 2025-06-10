// src/app/login/page.tsx
import AuthForm from "@/components/auth/AuthForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import Logo from "@/components/Logo";

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
         <Logo className="justify-center mb-4 text-3xl" />
          <h2 className="mt-6 text-center text-3xl font-headline font-extrabold">
            Log in to EchoSphere
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Or{" "}
            <Link href="/signup" className="font-medium text-primary hover:text-primary/90">
              create a new account
            </Link>
          </p>
        </div>
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="font-headline">Welcome Back!</CardTitle>
            <CardDescription>Enter your credentials to access your account.</CardDescription>
          </CardHeader>
          <CardContent>
            <AuthForm mode="login" />
          </CardContent>
        </Card>
         <p className="mt-4 text-center text-xs text-muted-foreground">
          <Link href="/forgot-password">Forgot your password?</Link>
        </p>
      </div>
    </div>
  );
}
