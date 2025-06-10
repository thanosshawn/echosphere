// src/app/profile/[userId]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Edit, Mail, CalendarDays, Loader2, Eye, Heart, MessageCircle as MessageIcon } from "lucide-react";
import type { UserProfile as UserProfileType, Story } from "@/types";
import Image from "next/image";
import Link from "next/link";

// Dummy data - replace with actual data fetching
const dummyUserProfile: UserProfileType = {
  uid: "user123",
  displayName: "Alex Writer",
  username: "alexwrites",
  email: "alex@example.com",
  bio: "Passionate storyteller exploring the depths of imagination. Coffee enthusiast. Loves hiking and photography.",
  profilePictureUrl: "https://placehold.co/128x128.png",
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), // 30 days ago
  // followerCount: 150,
  // followingCount: 75,
};

const dummyUserStories: Story[] = [
  {
    id: "s1", authorId: "user123", authorUsername: "alexwrites", title: "Chronicles of the Forgotten Land",
    content: "...", coverImageUrl: "https://placehold.co/300x200.png", tags: ["Fantasy", "Adventure"], category: "Fiction",
    status: "published", createdAt: Date.now() - 1000*60*60*24*3, updatedAt: Date.now(), views: 250, likes: 45, commentCount: 5,
  },
  {
    id: "s2", authorId: "user123", authorUsername: "alexwrites", title: "Silicon Dreams",
    content: "...", coverImageUrl: "https://placehold.co/300x200.png", tags: ["Sci-Fi", "Tech"], category: "Fiction",
    status: "published", createdAt: Date.now() - 1000*60*60*24*10, updatedAt: Date.now(), views: 500, likes: 102, commentCount: 15,
  },
];


export default function UserProfilePage() {
  const params = useParams();
  const userId = params.userId as string;
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();

  const [profileData, setProfileData] = useState<UserProfileType | null>(null);
  const [userStories, setUserStories] = useState<Story[]>([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false); // Placeholder

  useEffect(() => {
    if (userId) {
      // Fetch profile data and user stories based on userId
      // Simulating fetch:
      setTimeout(() => {
        if (userId === "user123") { // Dummy check
          setProfileData(dummyUserProfile);
          setUserStories(dummyUserStories);
        } else {
           // For other UIDs, maybe show a not found or a generic profile
          setProfileData({uid: userId, displayName: `User ${userId.substring(0,6)}`, email: null});
          setUserStories([]);
        }
        setIsLoadingProfile(false);
      }, 1000);
    }
  }, [userId]);

  const handleFollowToggle = () => {
    if (!currentUser) {
      router.push("/login");
      return;
    }
    // Implement follow/unfollow logic here
    setIsFollowing(!isFollowing); 
  };

  if (isLoadingProfile || authLoading) {
    return <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  if (!profileData) {
    return <div className="text-center py-10">User profile not found.</div>;
  }

  const isOwnProfile = currentUser?.uid === profileData.uid;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <Card className="shadow-xl overflow-hidden">
        <div className="h-40 bg-muted" data-ai-hint="abstract background">
          {/* Optional Banner Image Here */}
          <Image src="https://placehold.co/1200x200.png" alt="Profile banner" width={1200} height={200} className="object-cover w-full h-full" />
        </div>
        <CardContent className="pt-0">
          <div className="flex flex-col md:flex-row items-center md:items-end -mt-16 md:-mt-20 space-x-0 md:space-x-6 p-6">
            <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-background shadow-lg">
              <AvatarImage src={profileData.profilePictureUrl || undefined} alt={profileData.displayName || "User"} data-ai-hint="profile picture" />
              <AvatarFallback className="text-4xl"><User /></AvatarFallback>
            </Avatar>
            <div className="mt-4 md:mt-0 flex-grow text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-headline font-bold">{profileData.displayName || profileData.username || "Anonymous User"}</h1>
              {profileData.username && <p className="text-md text-muted-foreground">@{profileData.username}</p>}
              <div className="flex items-center justify-center md:justify-start space-x-4 mt-2 text-sm text-muted-foreground">
                {/* Placeholder counts */}
                <span><strong className="text-foreground">150</strong> Followers</span>
                <span><strong className="text-foreground">75</strong> Following</span>
                <span><strong className="text-foreground">{userStories.length}</strong> Stories</span>
              </div>
            </div>
            <div className="mt-4 md:mt-0">
              {isOwnProfile ? (
                <Button asChild variant="outline">
                  <Link href="/settings/profile"><Edit className="mr-2 h-4 w-4" /> Edit Profile</Link>
                </Button>
              ) : currentUser ? (
                <Button onClick={handleFollowToggle} variant={isFollowing ? "secondary" : "default"}>
                  {isFollowing ? "Unfollow" : "Follow"}
                </Button>
              ) : (
                 <Button asChild><Link href="/login">Follow</Link></Button>
              )}
            </div>
          </div>
          
          {profileData.bio && (
            <div className="p-6 border-t">
              <h2 className="text-sm font-semibold uppercase text-muted-foreground mb-1">Bio</h2>
              <p className="text-foreground leading-relaxed">{profileData.bio}</p>
            </div>
          )}

          <div className="p-6 border-t text-sm text-muted-foreground flex flex-wrap gap-x-6 gap-y-2">
            {profileData.email && 
              <span className="flex items-center"><Mail className="h-4 w-4 mr-2"/> {profileData.email}</span>}
            {profileData.createdAt && 
              <span className="flex items-center"><CalendarDays className="h-4 w-4 mr-2"/> Joined {new Date(profileData.createdAt).toLocaleDateString()}</span>}
          </div>

        </CardContent>
      </Card>

      <Tabs defaultValue="stories" className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-3">
          <TabsTrigger value="stories">Stories</TabsTrigger>
          <TabsTrigger value="comments">Comments</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
        <TabsContent value="stories" className="mt-6">
          {userStories.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {userStories.map(story => (
                 <Card key={story.id} className="flex flex-col overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                  <Link href={`/stories/${story.id}`} className="block">
                    <Image
                      src={story.coverImageUrl || `https://placehold.co/300x150.png?text=${story.title.replace(/\s/g,"+")}`}
                      alt={`Cover for ${story.title}`}
                      width={300}
                      height={150}
                      className="w-full h-40 object-cover"
                      data-ai-hint="story thumbnail"
                    />
                  </Link>
                  <CardHeader className="pb-2">
                    <CardTitle className="font-headline text-xl">
                       <Link href={`/stories/${story.id}`} className="hover:text-primary">{story.title}</Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow text-sm text-muted-foreground line-clamp-2">
                    {/* Placeholder for story excerpt */}
                    This is a short excerpt of the story, enticing readers to click and learn more.
                  </CardContent>
                  <CardFooter className="text-xs text-muted-foreground flex justify-between items-center border-t pt-3 mt-2">
                     <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {story.views}</span>
                        <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {story.likes}</span>
                        <span className="flex items-center gap-1"><MessageIcon className="h-3 w-3" /> {story.commentCount}</span>
                      </div>
                      <span className="text-xs">{new Date(story.createdAt).toLocaleDateString()}</span>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">This user hasn't published any stories yet.</p>
          )}
        </TabsContent>
        <TabsContent value="comments" className="mt-6">
          <p className="text-center text-muted-foreground py-8">Comments made by this user will appear here. (Feature coming soon)</p>
        </TabsContent>
        <TabsContent value="activity" className="mt-6">
          <p className="text-center text-muted-foreground py-8">Recent activity of this user will appear here. (Feature coming soon)</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
