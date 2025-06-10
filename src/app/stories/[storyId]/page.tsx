
// src/app/stories/[storyId]/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, collection, getDocs, query, orderBy as firestoreOrderBy, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Story, StoryNode, StoryNodeComment } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Edit, Eye, Heart, Loader2, MessageSquare, Send, User, Tag, ThumbsUp, ThumbsDown, CornerDownRight } from "lucide-react";
import { addCommentToStoryNodeAction, upvoteStoryNodeAction, downvoteStoryNodeAction } from "./actions";
import { useToast } from "@/hooks/use-toast";

interface StoryNodeDisplayProps {
  node: StoryNode;
  allNodes: StoryNode[];
  storyId: string;
  storyAuthorId: string;
  level?: number;
  currentUserUid: string | undefined;
}

const StoryNodeDisplay: React.FC<StoryNodeDisplayProps> = ({ node, allNodes, storyId, storyAuthorId, level = 0, currentUserUid }) => {
  const children = allNodes.filter(childNode => childNode.parentId === node.id).sort((a, b) => a.order - b.order);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [nodeComments, setNodeComments] = useState<StoryNodeComment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const { toast } = useToast();
  const { currentUser } = useAuth();

  const fetchNodeComments = useCallback(async () => {
    if (!db || !storyId || !node.id) return;
    setIsLoadingComments(true);
    try {
      const commentsRef = collection(db, "stories", storyId, "nodes", node.id, "comments");
      const q = query(commentsRef, firestoreOrderBy("createdAt", "asc"));
      const querySnapshot = await getDocs(q);
      const fetchedComments: StoryNodeComment[] = [];
      querySnapshot.forEach(doc => {
        fetchedComments.push({ id: doc.id, ...doc.data() } as StoryNodeComment);
      });
      setNodeComments(fetchedComments);
    } catch (error) {
      console.error("Error fetching comments for node:", error);
      toast({ title: "Error", description: "Could not load comments for this node.", variant: "destructive" });
    } finally {
      setIsLoadingComments(false);
    }
  }, [storyId, node.id, toast]);

  useEffect(() => {
    fetchNodeComments();
  }, [fetchNodeComments]);


  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newComment.trim() || !storyId || !node.id) return;
    setIsSubmittingComment(true);
    const result = await addCommentToStoryNodeAction({
      storyId,
      nodeId: node.id,
      authorId: currentUser.uid,
      authorUsername: currentUser.displayName || currentUser.email || "Anonymous",
      authorProfilePictureUrl: currentUser.photoURL,
      text: newComment,
    });
    if (result.success) {
      toast({ title: "Comment Posted!" });
      setNewComment("");
      fetchNodeComments(); // Re-fetch comments
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
    setIsSubmittingComment(false);
  };

  const handleVote = async (type: 'upvote' | 'downvote') => {
    if (!currentUser || !storyId || !node.id) {
        toast({ title: "Error", description: "You must be logged in to vote.", variant: "destructive" });
        return;
    }
    const action = type === 'upvote' ? upvoteStoryNodeAction : downvoteStoryNodeAction;
    const result = await action({ storyId, nodeId: node.id, userId: currentUser.uid });

    if (result.success) {
        toast({ title: "Vote Counted!" });
        // Ideally, we'd update the node's vote count in the local state
        // For simplicity now, user might need to refresh to see updated global counts
        // Or, the action could return the updated node to update state here.
    } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
    }
  };


  return (
    <div style={{ marginLeft: `${level * 20}px` }} className={`mt-4 p-4 border rounded-md shadow-sm ${level > 0 ? 'bg-muted/30' : 'bg-card'}`}>
      {level > 0 && <CornerDownRight className="inline-block h-4 w-4 mr-2 text-muted-foreground" />}
      <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed space-y-2">
        {node.content.split('\\n').map((paragraph, pIndex) => (
          paragraph.trim() ? <p key={`${node.id}-p-${pIndex}`}>{paragraph}</p> : null
        ))}
      </div>
      <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-3 pt-3 border-t">
        <Button variant="ghost" size="sm" onClick={() => handleVote('upvote')} disabled={!currentUser}>
          <ThumbsUp className="mr-1.5 h-4 w-4" /> {node.upvotes || 0}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => handleVote('downvote')} disabled={!currentUser}>
          <ThumbsDown className="mr-1.5 h-4 w-4" /> {node.downvotes || 0}
        </Button>
        <span className="flex items-center"><MessageSquare className="mr-1.5 h-4 w-4" /> {nodeComments.length || node.commentCount || 0} comments</span>
        <span className="text-xs">By: {node.authorUsername || "Unknown"}</span>
        <span className="text-xs">On: {new Date(node.order).toLocaleDateString()}</span>
      </div>

      {/* Comments Section for this Node */}
      <div className="mt-4 pl-4 border-l-2">
        <h4 className="text-sm font-semibold mb-2">Comments on this node:</h4>
        {isLoadingComments ? (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading comments...</span>
          </div>
        ) : nodeComments.length > 0 ? (
          <div className="space-y-3">
            {nodeComments.map(comment => (
              <div key={comment.id} className="text-xs p-2 bg-background rounded-md shadow">
                 <div className="flex items-center mb-1">
                    <Avatar className="h-5 w-5 mr-2">
                        <AvatarImage src={comment.authorProfilePictureUrl || undefined} alt={comment.authorUsername} />
                        <AvatarFallback>{comment.authorUsername?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                    <span className="font-semibold">{comment.authorUsername || "Anonymous"}</span>
                    <span className="ml-2 text-muted-foreground text-xs">
                        {new Date(comment.createdAt).toLocaleString()}
                    </span>
                </div>
                <p className="pl-7">{comment.text}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No comments on this node yet.</p>
        )}

        {currentUser && (
          <form onSubmit={handlePostComment} className="mt-3 space-y-2">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add your comment..."
              className="text-xs min-h-[60px]"
              rows={2}
            />
            <Button type="submit" size="sm" disabled={isSubmittingComment || !newComment.trim()}>
              {isSubmittingComment && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
              Post Comment
            </Button>
          </form>
        )}
         {!currentUser && (
             <p className="text-xs text-muted-foreground mt-3">
                <Link href={`/login?redirect=/stories/${storyId}`} className="text-primary hover:underline">Log in</Link> to comment.
            </p>
         )}
      </div>

      {children.map(childNode => (
        <StoryNodeDisplay key={childNode.id} node={childNode} allNodes={allNodes} storyId={storyId} storyAuthorId={storyAuthorId} level={level + 1} currentUserUid={currentUserUid}/>
      ))}
    </div>
  );
};


export default function StoryDetailPage() {
  const params = useParams();
  const storyId = params.storyId as string;
  const router = useRouter();
  const { currentUser, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [story, setStory] = useState<Story | null>(null);
  const [storyNodes, setStoryNodes] = useState<StoryNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Overall comments for the story (legacy, might be removed or re-purposed)
  // const [newStoryComment, setNewStoryComment] = useState("");
  // const [isSubmittingStoryComment, setIsSubmittingStoryComment] = useState(false);


  useEffect(() => {
    if (storyId && db) {
      const fetchStoryAndNodes = async () => {
        setLoading(true);
        setError(null);
        try {
          const storyRef = doc(db, "stories", storyId);
          const storySnap = await getDoc(storyRef);

          if (storySnap.exists()) {
            const storyData = storySnap.data() as Omit<Story, 'id'>;
            setStory({ 
              id: storySnap.id, 
              ...storyData,
              createdAt: Number(storyData.createdAt),
              updatedAt: Number(storyData.updatedAt),
            });

            const nodesCollectionRef = collection(db, "stories", storyId, "nodes");
            const nodesQuery = query(nodesCollectionRef, firestoreOrderBy("order", "asc"));
            const nodesSnapshot = await getDocs(nodesQuery);
            
            const fetchedNodes: StoryNode[] = [];
            nodesSnapshot.forEach((nodeDoc) => {
              const nodeData = nodeDoc.data();
              fetchedNodes.push({
                id: nodeDoc.id,
                ...nodeData,
                order: Number(nodeData.order) // Ensure order is number for sorting
              } as StoryNode);
            });
            setStoryNodes(fetchedNodes);

          } else {
            setError("Story not found.");
            setStory(null);
            setStoryNodes([]);
          }
        } catch (e) {
          console.error("Error fetching story and nodes:", e);
          setError("Failed to load the story. Please try again later.");
        }
        setLoading(false);
      };
      fetchStoryAndNodes();
    } else if (!db) {
      setError("Database service is unavailable.");
      setLoading(false);
    } else if (!storyId) {
        setError("Story ID is missing.");
        setLoading(false);
    }
  }, [storyId]);

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading story...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-semibold mb-4 text-destructive">{error}</h2>
        <Button onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  if (!story) {
    return (
       <div className="text-center py-10">
        <h2 className="text-2xl font-semibold mb-4">Story not found.</h2>
        <Button onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }
  
  const isAuthor = currentUser?.uid === story.authorId;
  const rootNodes = storyNodes.filter(node => !node.parentId).sort((a, b) => a.order - b.order);


  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center mb-6">
        <Button variant="outline" onClick={() => router.push('/stories')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Stories
        </Button>
        {isAuthor && (
          <Button variant="outline" asChild>
            <Link href={`/stories/edit/${story.id}`}> 
              <Edit className="mr-1.5 h-4 w-4" /> Edit Story
            </Link>
          </Button>
        )}
      </div>
      

      <article>
        {story.coverImageUrl && (
          <div className="mb-8 rounded-lg overflow-hidden shadow-lg">
            <Image
              src={story.coverImageUrl}
              alt={`Cover image for ${story.title}`}
              width={800}
              height={400}
              className="w-full h-auto object-cover max-h-[400px]"
              data-ai-hint="story cover large"
            />
          </div>
        )}
        {!story.coverImageUrl && (
           <div className="mb-8 rounded-lg overflow-hidden shadow-lg bg-muted flex items-center justify-center h-[300px] md:h-[400px]">
            <Image 
              src={`https://placehold.co/800x400.png?text=${encodeURIComponent(story.title)}`}
              alt={`Placeholder for ${story.title}`}
              width={800}
              height={400}
              className="w-full h-auto object-cover max-h-[400px]"
              data-ai-hint="story placeholder large"
            />
          </div>
        )}

        <header className="mb-6">
          <h1 className="text-4xl md:text-5xl font-headline font-bold mb-4">{story.title}</h1>
          <div className="flex items-center space-x-4 text-muted-foreground text-sm">
            <Link href={`/profile/${story.authorId}`} className="flex items-center space-x-2 hover:text-primary transition-colors">
              <Avatar className="h-8 w-8">
                <AvatarImage src={story.authorProfilePictureUrl || undefined} alt={story.authorUsername} />
                <AvatarFallback>
                  {story.authorUsername ? story.authorUsername.charAt(0).toUpperCase() : <User className="h-4 w-4"/>}
                </AvatarFallback>
              </Avatar>
              <span>{story.authorUsername || "Anonymous"}</span>
            </Link>
            <span className="flex items-center"><CalendarDays className="mr-1.5 h-4 w-4" /> Published on {new Date(story.createdAt).toLocaleDateString()}</span>
          </div>
        </header>

        <Separator className="my-6" />

        {/* Render story nodes recursively */}
        {rootNodes.length > 0 ? (
            rootNodes.map(node => (
              <StoryNodeDisplay 
                key={node.id} 
                node={node} 
                allNodes={storyNodes} 
                storyId={story.id}
                storyAuthorId={story.authorId}
                currentUserUid={currentUser?.uid}
              />
            ))
          ) : (
            <p>This story doesn't have any content yet.</p>
          )}


        <Separator className="my-8" />

        <footer className="space-y-6">
          {story.tags && story.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <Tag className="h-5 w-5 text-muted-foreground" />
              {story.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-sm">
                  <Link href={`/tags/${tag.toLowerCase()}`}>{tag}</Link>
                </Badge>
              ))}
            </div>
          )}

          <div className="flex items-center space-x-6 text-muted-foreground">
            <span className="flex items-center"><Eye className="mr-1.5 h-5 w-5" /> {story.views || 0} views</span>
            <span className="flex items-center"><Heart className="mr-1.5 h-5 w-5" /> {story.likes || 0} likes</span>
            {/* Overall story comment count might need to be aggregated from all nodes or a separate field */}
            {/* <span className="flex items-center"><MessageSquare className="mr-1.5 h-5 w-5" /> {story.commentCount || 0} comments</span> */}
          </div>
        </footer>
      </article>

      <Separator className="my-10" />

      {/* Legacy Overall Story Comments Section - Consider removing or adapting for global story discussion */}
      {/* 
      <section className="space-y-6">
        <h2 className="text-2xl font-headline font-semibold">General Story Comments</h2>
        {currentUser ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-headline">Leave a General Comment</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea 
                value={newStoryComment}
                onChange={(e) => setNewStoryComment(e.target.value)}
                placeholder={`Commenting as ${currentUser.displayName || currentUser.email}...`} 
                className="min-h-[100px]" 
               />
            </CardContent>
            <CardFooter>
              <Button className="ml-auto" onClick={handlePostStoryComment} disabled={isSubmittingStoryComment || !newStoryComment.trim()}>
                {isSubmittingStoryComment && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Post Comment
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <Card className="p-6 text-center bg-muted/50">
            <CardDescription>
              <Link href={`/login?redirect=/stories/${story.id}`} className="text-primary hover:underline font-semibold">Log in</Link> or <Link href={`/signup?redirect=/stories/${story.id}`} className="text-primary hover:underline font-semibold">sign up</Link> to leave a comment.
            </CardDescription>
          </Card>
        )}
        
        <div className="py-6 text-center text-muted-foreground">
          <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No general comments yet. Share your overall thoughts!</p>
        </div>
      </section>
      */}
    </div>
  );
}

      
      
    