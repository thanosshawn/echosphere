
// src/components/auth/AuthForm.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup,
  signInAnonymously,
  updateProfile
} from "firebase/auth";
import { Chrome, Loader2 } from "lucide-react"; // Using Chrome as a stand-in for Google icon, Added Loader2

interface AuthFormProps {
  mode: "login" | "signup";
}

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  username: z.string().optional(), // Only for signup
});

const AuthForm: React.FC<AuthFormProps> = ({ mode }) => {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAnonLoading, setIsAnonLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      username: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoadingEmail(true);
    try {
      if (mode === "signup") {
        const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
        if (values.username && userCredential.user) {
          await updateProfile(userCredential.user, { displayName: values.username });
        }
        toast({ title: "Account created successfully!", description: "Welcome to EchoSphere." });
        router.push("/dashboard"); 
      } else {
        await signInWithEmailAndPassword(auth, values.email, values.password);
        toast({ title: "Logged in successfully!", description: "Welcome back." });
        router.push("/dashboard");
      }
    } catch (error: any) {
      toast({
        title: "Authentication Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingEmail(false);
    }
  }

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast({ title: "Signed in with Google successfully!" });
      router.push("/dashboard");
    } catch (error: any) {
      toast({
        title: "Google Sign-In Error",
        description: error.message || "Could not sign in with Google.",
        variant: "destructive",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };
  
  const handleAnonymousSignIn = async () => {
    setIsAnonLoading(true);
    try {
      await signInAnonymously(auth);
      toast({ title: "Signed in anonymously", description: "You can explore EchoSphere. Create an account to save your progress." });
      router.push("/dashboard");
    } catch (error: any) {
      toast({
        title: "Anonymous Sign-In Error",
        description: error.message || "Could not sign in anonymously.",
        variant: "destructive",
      });
    } finally {
      setIsAnonLoading(false);
    }
  };

  const anyLoading = isLoadingEmail || isGoogleLoading || isAnonLoading;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {mode === "signup" && (
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input placeholder="Choose a username" {...field} disabled={anyLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@example.com" {...field} disabled={anyLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} disabled={anyLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={anyLoading}>
          {isLoadingEmail ? <Loader2 className="animate-spin" /> : mode === "signup" ? "Create Account" : "Log In"}
        </Button>
      </form>
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>
      <div className="space-y-3">
        <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={anyLoading}>
          {isGoogleLoading ? <Loader2 className="animate-spin" /> : <><Chrome className="mr-2 h-4 w-4" /> Google</>}
        </Button>
        <Button variant="outline" className="w-full" onClick={handleAnonymousSignIn} disabled={anyLoading}>
          {isAnonLoading ? <Loader2 className="animate-spin" /> : "Sign in Anonymously"}
        </Button>
      </div>
    </Form>
  );
};

export default AuthForm;
