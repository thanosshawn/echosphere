
// src/app/notifications/page.tsx
"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, orderBy as firestoreOrderBy, doc, updateDoc, writeBatch } from "firebase/firestore";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BellRing, Check, Loader2, MessageSquare, UserPlus, Heart } from "lucide-react";
import type { Notification } from "@/types";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";


export default function NotificationsPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push("/login?redirect=/notifications");
    } else if (currentUser && db) {
      setIsLoading(true);
      const notificationsCollectionRef = collection(db, "notifications");
      const q = firestoreQuery(
        notificationsCollectionRef,
        where("userId", "==", currentUser.uid),
        firestoreOrderBy("createdAt", "desc")
      );

      getDocs(q)
        .then((querySnapshot) => {
          const fetchedNotifications: Notification[] = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            fetchedNotifications.push({
              id: doc.id,
              ...data,
              createdAt: Number(data.createdAt), // Ensure it's a number
            } as Notification);
          });
          setNotifications(fetchedNotifications);
        })
        .catch((error) => {
          console.error("Error fetching notifications:", error);
          toast({ title: "Error", description: "Could not load notifications.", variant: "destructive" });
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (!db && currentUser) {
        toast({ title: "Error", description: "Database service unavailable.", variant: "destructive" });
        setIsLoading(false);
    }
  }, [currentUser, authLoading, router, toast]);

  const markAsRead = async (id: string) => {
    if (!db) return;
    try {
      const notificationRef = doc(db, "notifications", id);
      await updateDoc(notificationRef, { isRead: true });
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
    } catch (error) {
        console.error("Error marking notification as read:", error);
        toast({ title: "Error", description: "Failed to mark as read.", variant: "destructive" });
    }
  };

  const markAllAsRead = async () => {
    if (!db || !currentUser) return;
    const unreadNotifications = notifications.filter(n => !n.isRead);
    if (unreadNotifications.length === 0) return;

    const batch = writeBatch(db);
    unreadNotifications.forEach(notification => {
      const notificationRef = doc(db, "notifications", notification.id);
      batch.update(notificationRef, { isRead: true });
    });

    try {
      await batch.commit();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      toast({ title: "Error", description: "Failed to mark all as read.", variant: "destructive" });
    }
  };
  
  const getNotificationIcon = (type: Notification['type']) => {
    switch(type) {
      case 'new_comment':
      case 'new_reply':
        return <MessageSquare className="h-5 w-5 text-primary" />;
      case 'new_follower':
        return <UserPlus className="h-5 w-5 text-green-500" />; // Direct Tailwind color, consider theme variable
      case 'story_like':
        return <Heart className="h-5 w-5 text-red-500" />; // Direct Tailwind color, consider theme variable
      case 'welcome':
      case 'system':
      default:
        return <BellRing className="h-5 w-5 text-accent" />;
    }
  }

  if (authLoading || isLoading || !currentUser) {
    return <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-headline">Notifications</h1>
        {notifications.some(n => !n.isRead) && (
          <Button variant="outline" onClick={markAllAsRead}>
            <Check className="mr-2 h-4 w-4" /> Mark all as read
          </Button>
        )}
      </div>

      {notifications.length > 0 ? (
        <Card className="shadow-xl">
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {notifications.map((notification) => (
                <li
                  key={notification.id}
                  className={cn(
                    "p-4 hover:bg-muted/50 transition-colors",
                    !notification.isRead && "bg-primary/5",
                    notification.highlight && !notification.isRead && "border-l-4 border-accent"
                  )}
                >
                  <Link href={notification.link || "#"} className="block">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 pt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-grow">
                        <p className={cn("text-sm", !notification.isRead && "font-semibold")}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                          className="text-xs"
                          title="Mark as read"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="font-headline text-center">All caught up!</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <BellRing className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <CardDescription>You have no new notifications.</CardDescription>
            <Button variant="link" asChild className="mt-2">
                <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

