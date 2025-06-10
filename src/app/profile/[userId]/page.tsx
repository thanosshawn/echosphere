
// src/app/profile/[userId]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, orderBy as firestoreOrderBy, doc, getDoc } from "firebase/firestore"; 

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Edit, Mail, CalendarDays, Loader2, Eye, Heart, MessageCircle as MessageIcon, Users, Image as ImageIcon } from "lucide-react";
import type { UserProfile as UserProfileType, Story } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

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
          const storiesCollectionRef = collection(db, "stories");
          const storiesQuery = query( 
            storiesCollectionRef,
            where("authorId", "==", userId),
            where("status", "==", "published"), 
            firestoreOrderBy("createdAt", "desc")
          );
          const storySnapshots = await getDocs(storiesQuery);
          const fetchedStories: Story[] = [];
          storySnapshots.forEach((docSnap) => {
            const data = docSnap.data();
            fetchedStories.push({
              id: docSnap.id,
              ...data,
              createdAt: Number(data.createdAt),
              updatedAt: Number(data.updatedAt),
              nodeCount: data.nodeCount || 0, // Renamed from partCount
              firstNodeExcerpt: data.firstNodeExcerpt || "No excerpt available.",
            } as Story);
          });
          setUserStories(fetchedStories);

          if (currentUser && currentUser.uid === userId) {
            const userDocRef = doc(db, "users", userId);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
                const dbUser = userDocSnap.data();
                setProfileData({
                    ...currentUser, 
                    username: dbUser.username || currentUser.displayName,
                    bio: dbUser.bio,
                    createdAt: dbUser.createdAt ? (dbUser.createdAt.toDate ? dbUser.createdAt.toDate() : new Date(dbUser.createdAt)) : undefined,
                } as UserProfileType);
            } else {
                setProfileData(currentUser); 
            }
          } else {
            const userDocRef = doc(db, "users", userId);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
                const dbUser = userDocSnap.data();
                setProfileData({
                    uid: userId,
                    displayName: dbUser.displayName || `User ${userId.substring(0,6)}`,
                    email: dbUser.email, 
                    photoURL: dbUser.photoURL,
                    username: dbUser.username,
                    bio: dbUser.bio,
                    createdAt: dbUser.createdAt ? (dbUser.createdAt.toDate ? dbUser.createdAt.toDate() : new Date(dbUser.createdAt)) : undefined,
                } as UserProfileType);
            } else if (fetchedStories.length > 0) { 
                setProfileData({
                    uid: userId,
                    displayName: fetchedStories[0].authorUsername,
                    photoURL: fetchedStories[0].authorProfilePictureUrl,
                    email: null, 
                    createdAt: undefined, 
                });
            } else {
                setError("User profile not found.");
                setProfileData(null);
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

  if (error && !profileData) { 
    return <div className="text-center py-10 text-destructive">{error}</div>;
  }
  
  if (!profileData || !profileData.uid) { 
    return <div className="text-center py-10">User profile not found or user has no public activity.</div>;
  }

  const isOwnProfile = currentUser?.uid === profileData.uid;

  return (
    <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">
      <Card className="shadow-xl overflow-hidden rounded-lg">
        <div className="h-32 sm:h-40 bg-muted relative">
          <Image src="https://placehold.co/1200x200.png" alt="Profile banner" layout="fill" objectFit="cover" data-ai-hint="profile banner abstract"/>
        </div>
        <CardContent className="pt-0 relative">
          <div className="flex flex-col md:flex-row items-center md:items-end -mt-12 sm:-mt-16 md:-mt-20 p-4 sm:p-6 space-y-3 md:space-y-0 md:space-x-4">
            <Avatar className="h-24 w-24 sm:h-32 sm:w-32 md:h-40 md:w-40 border-4 border-background shadow-lg">
              <AvatarImage src={profileData.photoURL || profileData.profilePictureUrl || undefined} alt={profileData.displayName || "User"} data-ai-hint="profile portrait" />
              <AvatarFallback className="text-3xl sm:text-4xl"><User /></AvatarFallback>
            </Avatar>
            <div className="flex-grow text-center md:text-left">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-headline font-bold">{profileData.displayName || profileData.username || `User ${profileData.uid.substring(0,6)}`}</h1>
              {profileData.username && profileData.displayName !== profileData.username && <p className="text-sm sm:text-md text-muted-foreground">@{profileData.username}</p>}
               <div className="flex items-center justify-center md:justify-start space-x-3 sm:space-x-4 mt-1 sm:mt-2 text-xs sm:text-sm text-muted-foreground">
                <span><strong className="text-foreground font-medium">0</strong> Followers</span>
                <span><strong className="text-foreground font-medium">0</strong> Following</span>
                <span><strong className="text-foreground font-medium">{userStories.length}</strong> Stories</span>
              </div>
            </div>
            <div className="mt-3 md:mt-0 self-center md:self-end">
              {isOwnProfile ? (
                <Button asChild variant="outline" size="sm">
                  <Link href="/settings/profile"><Edit className="mr-1.5 h-3.5 w-3.5" /> Edit Profile</Link>
                </Button>
              ) : currentUser ? (
                <Button onClick={handleFollowToggle} variant={isFollowing ? "secondary" : "default"} size="sm" disabled>
                  {isFollowing ? "Unfollow" : "Follow"}
                </Button>
              ) : (
                 <Button asChild size="sm"><Link href={`/login?redirect=/profile/${userId}`}>Follow</Link></Button>
              )}
            </div>
          </div>
          
          {profileData.bio && (
            <div className="p-4 sm:p-6 border-t">
              <h2 className="text-xs font-semibold uppercase text-muted-foreground mb-1 tracking-wider">Bio</h2>
              <p className="text-sm sm:text-base text-foreground leading-relaxed whitespace-pre-wrap">{profileData.bio}</p>
            </div>
          )}

          <div className="p-4 sm:p-6 border-t text-xs sm:text-sm text-muted-foreground flex flex-wrap gap-x-4 sm:gap-x-6 gap-y-2">
            {isOwnProfile && profileData.email && 
              <span className="flex items-center"><Mail className="h-3.5 w-3.5 mr-1.5"/> {profileData.email}</span>}
            {profileData.createdAt && (typeof profileData.createdAt === 'number' || profileData.createdAt instanceof Date) &&
              <span className="flex items-center"><CalendarDays className="h-3.5 w-3.5 mr-1.5"/> Joined {new Date(profileData.createdAt).toLocaleDateString()}</span>}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="stories" className="w-full">
        <TabsList className="grid w-full grid-cols-1 gap-1 sm:grid-cols-3 sm:gap-0 rounded-lg">
          <TabsTrigger value="stories" className="text-sm sm:text-base">Stories ({userStories.length})</TabsTrigger>
          <TabsTrigger value="comments" className="text-sm sm:text-base">Comments</TabsTrigger>
          <TabsTrigger value="activity" className="text-sm sm:text-base">Activity</TabsTrigger>
        </TabsList>
        <TabsContent value="stories" className="mt-4 sm:mt-6">
          {userStories.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
              {userStories.map(story => (
                 <Card key={story.id} className="flex flex-col overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg">
                  <Link href={`/stories/${story.id}`} className="block group">
                    <div className="aspect-[16/9] bg-muted overflow-hidden">
                      <Image
                        src={story.coverImageUrl || `https://placehold.co/300x169.png?text=${encodeURIComponent(story.title)}`}
                        alt={`Cover for ${story.title}`}
                        width={300}
                        height={169} // Adjusted for 16:9
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        data-ai-hint={`${story.category} thumbnail`}
                      />
                    </div>
                  </Link>
                  <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
                    <CardTitle className="font-headline text-lg sm:text-xl">
                       <Link href={`/stories/${story.id}`} className="hover:text-primary line-clamp-2">{story.title}</Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 pt-1 sm:pt-2 flex-grow text-xs sm:text-sm text-muted-foreground">
                    <p className="line-clamp-2 sm:line-clamp-3">{story.firstNodeExcerpt || "No excerpt available."}</p>
                  </CardContent>
                  <CardFooter className="text-xs text-muted-foreground flex justify-between items-center border-t p-3 sm:p-4 mt-auto">
                     <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="flex items-center gap-0.5 sm:gap-1"><Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> {story.views || 0}</span>
                        <span className="flex items-center gap-0.5 sm:gap-1"><Heart className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> {story.likes || 0}</span>
                        <span className="flex items-center gap-0.5 sm:gap-1"><MessageIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> {story.commentCount || 0}</span>
                      </div>
                      {story.createdAt && <span className="text-2xs sm:text-xs">{new Date(story.createdAt).toLocaleDateString()}</span>}
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8 sm:py-12">
               <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm sm:text-base">This user hasn't published any stories yet.</p>
            </div>
          )}
        </TabsContent>
        <TabsContent value="comments" className="mt-6 text-center text-muted-foreground py-8 sm:py-12">
           <MessageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm sm:text-base">Comments made by this user will appear here.</p>
          <p className="text-xs">(Feature coming soon)</p>
        </TabsContent>
        <TabsContent value="activity" className="mt-6 text-center text-muted-foreground py-8 sm:py-12">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm sm:text-base">Recent activity of this user will appear here.</p>
          <p className="text-xs">(Feature coming soon)</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
