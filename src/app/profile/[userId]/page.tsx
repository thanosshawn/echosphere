
// src/app/profile/[userId]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, orderBy as firestoreOrderBy } from "firebase/firestore";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Edit, Mail, CalendarDays, Loader2, Eye, Heart, MessageCircle as MessageIcon } from "lucide-react";
import type { UserProfile as UserProfileType, Story } from "@/types";
import Image from "next/image";
import Link from "next/link";

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.userId as string;
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();

  const [profileData, setProfileData] = useState<UserProfileType | null>(null);
  const [userStories, setUserStories] = useState<Story[]>([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false); 
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId && db) {
      const fetchProfileAndStories = async () => {
        setIsLoadingProfile(true);
        setError(null);
        try {
          // Fetch User Stories
          const storiesCollectionRef = collection(db, "stories");
          const storiesQuery = firestoreQuery(
            storiesCollectionRef,
            where("authorId", "==", userId),
            where("status", "==", "published"), 
            firestoreOrderBy("createdAt", "desc")
          );
          const storySnapshots = await getDocs(storiesQuery);
          const fetchedStories: Story[] = [];
          storySnapshots.forEach((docSnap) => { // Renamed doc to docSnap to avoid conflict
            const data = docSnap.data();
            fetchedStories.push({
              id: docSnap.id,
              ...data,
              createdAt: Number(data.createdAt),
              updatedAt: Number(data.updatedAt),
              // firstPartExcerpt: data.firstPartExcerpt, // if denormalized
            } as Story); // Cast as Story, ensure all fields match
          });
          setUserStories(fetchedStories);

          // Profile Data Logic
          if (currentUser && currentUser.uid === userId) {
            setProfileData(currentUser);
          } else {
            // For other users, attempt to get basic info from one of their stories
            // A dedicated 'users' collection is better for full profiles.
             if (fetchedStories.length > 0) {
                setProfileData({
                    uid: userId,
                    displayName: fetchedStories[0].authorUsername,
                    photoURL: fetchedStories[0].authorProfilePictureUrl,
                    email: null, 
                    createdAt: undefined, 
                });
            } else {
                // If no stories, create a minimal profile or indicate user might not exist publicly
                // This would ideally fetch from a 'users' collection
                // const userDocRef = doc(db, "users", userId); (Example)
                // const userDocSnap = await getDoc(userDocRef);
                // if (userDocSnap.exists()) setProfileData({ uid: userId, ...userDocSnap.data() } as UserProfileType);
                // else setError("User profile not found.");
                setProfileData({uid: userId, displayName: `User ${userId.substring(0,6)}`, email: null});
            }
          }

        } catch (e) {
          console.error("Error fetching profile data:", e);
          setError("Failed to load profile data.");
        }
        setIsLoadingProfile(false);
      };
      fetchProfileAndStories();
    } else if (!db) {
        setError("Database service is unavailable.");
        setIsLoadingProfile(false);
    }
  }, [userId, currentUser]);


  const handleFollowToggle = () => {
    if (!currentUser) {
      router.push("/login?redirect=/profile/" + userId);
      return;
    }
    setIsFollowing(!isFollowing); 
  };

  if (isLoadingProfile || authLoading) {
    return <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  if (error) {
    return <div className="text-center py-10 text-destructive">{error}</div>;
  }
  
  if (!profileData || !profileData.uid) {
    return <div className="text-center py-10">User profile not found or user has no public activity.</div>;
  }

  const isOwnProfile = currentUser?.uid === profileData.uid;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <Card className="shadow-xl overflow-hidden">
        <div className="h-40 bg-muted" data-ai-hint="abstract background">
          <Image src="https://placehold.co/1200x200.png" alt="Profile banner" width={1200} height={200} className="object-cover w-full h-full" data-ai-hint="profile banner abstract"/>
        </div>
        <CardContent className="pt-0">
          <div className="flex flex-col md:flex-row items-center md:items-end -mt-16 md:-mt-20 space-x-0 md:space-x-6 p-6">
            <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-background shadow-lg">
              <AvatarImage src={profileData.photoURL || profileData.profilePictureUrl || undefined} alt={profileData.displayName || "User"} data-ai-hint="profile portrait" />
              <AvatarFallback className="text-4xl"><User /></AvatarFallback>
            </Avatar>
            <div className="mt-4 md:mt-0 flex-grow text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-headline font-bold">{profileData.displayName || profileData.username || `User ${profileData.uid.substring(0,6)}`}</h1>
              {profileData.username && <p className="text-md text-muted-foreground">@{profileData.username}</p>}
               <div className="flex items-center justify-center md:justify-start space-x-4 mt-2 text-sm text-muted-foreground">
                <span><strong className="text-foreground">0</strong> Followers</span>
                <span><strong className="text-foreground">0</strong> Following</span>
                <span><strong className="text-foreground">{userStories.length}</strong> Stories</span>
              </div>
            </div>
            <div className="mt-4 md:mt-0">
              {isOwnProfile ? (
                <Button asChild variant="outline">
                  <Link href="/settings/profile"><Edit className="mr-2 h-4 w-4" /> Edit Profile</Link>
                </Button>
              ) : currentUser ? (
                <Button onClick={handleFollowToggle} variant={isFollowing ? "secondary" : "default"} disabled>
                  {isFollowing ? "Unfollow" : "Follow"}
                </Button>
              ) : (
                 <Button asChild><Link href={`/login?redirect=/profile/${userId}`}>Follow</Link></Button>
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
            {isOwnProfile && profileData.email && 
              <span className="flex items-center"><Mail className="h-4 w-4 mr-2"/> {profileData.email}</span>}
            {profileData.createdAt && (typeof profileData.createdAt === 'number' || profileData.createdAt instanceof Date) &&
              <span className="flex items-center"><CalendarDays className="h-4 w-4 mr-2"/> Joined {new Date(profileData.createdAt).toLocaleDateString()}</span>}
          </div>

        </CardContent>
      </Card>

      <Tabs defaultValue="stories" className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-3">
          <TabsTrigger value="stories">Stories ({userStories.length})</TabsTrigger>
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
                      src={story.coverImageUrl || `https://placehold.co/300x150.png?text=${encodeURIComponent(story.title)}`}
                      alt={`Cover for ${story.title}`}
                      width={300}
                      height={150}
                      className="w-full h-40 object-cover"
                      data-ai-hint={`${story.category} thumbnail`}
                    />
                  </Link>
                  <CardHeader className="pb-2">
                    <CardTitle className="font-headline text-xl">
                       <Link href={`/stories/${story.id}`} className="hover:text-primary">{story.title}</Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow text-sm text-muted-foreground">
                     {/* Excerpt removed as content is now in parts. Consider denormalizing 'firstPartExcerpt' or fetching. */}
                     {story.firstPartExcerpt ? (
                        <p className="line-clamp-2">{story.firstPartExcerpt}</p>
                     ) : (
                        <p className="line-clamp-2 italic text-muted-foreground/70">No excerpt available.</p>
                     )}
                  </CardContent>
                  <CardFooter className="text-xs text-muted-foreground flex justify-between items-center border-t pt-3 mt-2">
                     <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {story.views || 0}</span>
                        <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {story.likes || 0}</span>
                        <span className="flex items-center gap-1"><MessageIcon className="h-3 w-3" /> {story.commentCount || 0}</span>
                      </div>
                      {story.createdAt && <span className="text-xs">{new Date(story.createdAt).toLocaleDateString()}</span>}
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
