// src/app/notifications/page.tsx
"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BellRing, Check, Loader2, MessageSquare, UserPlus, Heart } from "lucide-react";
import type { Notification } from "@/types"; // Assuming types are defined
import { cn } from "@/lib/utils";
// import { summarizeNotifications } from "@/ai/flows/notification-summarizer"; // For potential client-side summarization or to trigger summarization

// Dummy data for notifications
const dummyNotifications: Notification[] = [
  {
    id: "1",
    userId: "user1",
    type: "new_comment",
    senderUsername: "JaneDoe",
    storyId: "storyA",
    message: "JaneDoe commented on your story 'Adventures in the Cloud'.",
    isRead: false,
    createdAt: Date.now() - 1000 * 60 * 30, // 30 minutes ago
    highlight: true,
    link: "/stories/storyA#comment-123",
  },
  {
    id: "2",
    userId: "user1",
    type: "new_follower",
    senderUsername: "JohnSmith",
    message: "JohnSmith started following you.",
    isRead: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
    link: "/profile/JohnSmith",
  },
  {
    id: "3",
    userId: "user1",
    type: "story_like",
    senderUsername: "AliceWonder",
    storyId: "storyB",
    message: "AliceWonder liked your story 'The Last Stand'.",
    isRead: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 5, // 5 hours ago
    highlight: false,
    link: "/stories/storyB",
  },
   {
    id: "4",
    userId: "user1",
    type: "welcome",
    message: "Welcome to EchoSphere! We're excited to have you.",
    isRead: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
    highlight: true,
    link: "/dashboard",
  },
];

export default function NotificationsPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>(dummyNotifications); // Replace with actual data fetching
  const [isLoading, setIsLoading] = useState(true); // For fetching notifications

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push("/login?redirect=/notifications");
    } else if (currentUser) {
      // Fetch actual notifications here
      // e.g., fetchNotifications(currentUser.uid).then(setNotifications);
      setIsLoading(false); // Simulate fetch completion
    }
  }, [currentUser, authLoading, router]);

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
    // API call to mark as read on backend
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    // API call to mark all as read
  };
  
  const getNotificationIcon = (type: Notification['type']) => {
    switch(type) {
      case 'new_comment':
      case 'new_reply':
        return <MessageSquare className="h-5 w-5 text-primary" />;
      case 'new_follower':
        return <UserPlus className="h-5 w-5 text-green-500" />;
      case 'story_like':
        return <Heart className="h-5 w-5 text-red-500" />;
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}
