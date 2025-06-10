// src/app/signup/page.tsx
import AuthForm from "@/components/auth/AuthForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle }  from "@/components/ui/card";
import Link from "next/link";
import Logo from "@/components/Logo";

export default function SignupPage() {
  return (
    <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
         <div className="text-center">
          <Logo className="justify-center mb-4 text-3xl" />
          <h2 className="mt-6 text-center text-3xl font-headline font-extrabold">
            Create your EchoSphere Account
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary hover:text-primary/90">
              Log in here
            </Link>
          </p>
        </div>
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="font-headline">Join EchoSphere</CardTitle>
            <CardDescription>Sign up to start sharing your stories and connect with others.</CardDescription>
          </CardHeader>
          <CardContent>
            <AuthForm mode="signup" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
