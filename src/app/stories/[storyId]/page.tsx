
// src/app/stories/[storyId]/page.tsx
"use client";

import { useEffect, useState, useCallback, Fragment } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, collection, getDocs, query, orderBy as firestoreOrderBy, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Story, StoryNode, StoryNodeComment, UserProfile } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Edit, Eye, Heart, Loader2, MessageSquare, Send, User, Tag, ThumbsUp, ThumbsDown, CornerDownRight, PlusCircle } from "lucide-react";
import { addCommentToStoryNodeAction, upvoteStoryNodeAction, downvoteStoryNodeAction } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import RichTextEditor from "@/components/editor/RichTextEditor";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";


const commentFormSchema = z.object({
  commentText: z.string().min(1, "Comment cannot be empty (HTML allowed).").refine(value => value !== '<p></p>', { message: "Comment cannot be empty." }),
});
type CommentFormValues = z.infer<typeof commentFormSchema>;

interface StoryNodeDisplayProps {
  node: StoryNode;
  allNodes: StoryNode[]; 
  storyId: string;
  storyAuthorId: string;
  level?: number;
  currentUser: UserProfile | null;
  onVote: (nodeId: string, voteType: 'upvote' | 'downvote') => Promise<void>;
  refreshAllNodes: () => void; 
  isStoryAuthor: boolean;
}

const StoryNodeDisplay: React.FC<StoryNodeDisplayProps> = ({ 
  node, 
  allNodes, 
  storyId, 
  storyAuthorId, 
  level = 0, 
  currentUser,
  onVote,
  refreshAllNodes,
  isStoryAuthor
}) => {
  const children = allNodes.filter(childNode => childNode.parentId === node.id).sort((a, b) => a.order - b.order);
  
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [nodeComments, setNodeComments] = useState<StoryNodeComment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const commentForm = useForm<CommentFormValues>({
    resolver: zodResolver(commentFormSchema),
    defaultValues: {
      commentText: "<p></p>",
    },
  });

  const fetchNodeComments = useCallback(async (currentNodeId: string) => {
    if (!db || !storyId || !currentNodeId) return;
    setIsLoadingComments(true);
    try {
      const commentsRef = collection(db, "stories", storyId, "nodes", currentNodeId, "comments");
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
  }, [storyId, toast]);

  useEffect(() => {
    fetchNodeComments(node.id);
  }, [fetchNodeComments, node.id]);


  const handlePostComment = async (values: CommentFormValues) => {
    if (!currentUser || !values.commentText.trim() || values.commentText === "<p></p>" || !storyId || !node.id) return;
    setIsSubmittingComment(true);
    const result = await addCommentToStoryNodeAction({
      storyId,
      nodeId: node.id,
      authorId: currentUser.uid,
      authorUsername: currentUser.displayName || currentUser.email || "Anonymous",
      authorProfilePictureUrl: currentUser.photoURL,
      text: values.commentText,
    });
    if (result.success) {
      toast({ title: "Comment Posted!" });
      commentForm.reset({ commentText: "<p></p>" });
      fetchNodeComments(node.id); 
      refreshAllNodes(); 
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
    setIsSubmittingComment(false);
  };

  const handleLocalVote = async (voteType: 'upvote' | 'downvote') => {
    if (!currentUser || !storyId || !node.id) {
        toast({ title: "Authentication Required", description: "You must be logged in to vote.", variant: "destructive" });
        return;
    }
    await onVote(node.id, voteType);
  };
  
  const userVote = currentUser && node.votedBy ? node.votedBy[currentUser.uid] : null;
  const nodeIndentation = level * 16; 

  return (
    <div style={{ marginLeft: `${nodeIndentation}px` }} className={cn("mt-4 rounded-lg shadow-sm", level > 0 ? 'bg-muted/20 p-3 sm:p-4' : 'bg-card p-4 sm:p-5')}>
      {level > 0 && <CornerDownRight className="inline-block h-4 w-4 mr-1.5 text-muted-foreground mb-0.5" />}
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <Avatar className="h-6 w-6">
                <AvatarImage src={node.authorProfilePictureUrl || undefined} alt={node.authorUsername} />
                <AvatarFallback className="text-xs">
                  {node.authorUsername ? node.authorUsername.charAt(0).toUpperCase() : <User className="h-3 w-3" />}
                </AvatarFallback>
            </Avatar>
            <Link href={`/profile/${node.authorId}`} className="font-medium hover:underline text-foreground">{node.authorUsername || "Anonymous"}</Link>
            <span>&bull;</span>
            <span>{new Date(node.createdAt).toLocaleDateString()}</span>
             {isStoryAuthor && (
              <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto" onClick={() => router.push(`/stories/edit/${storyId}?nodeId=${node.id}`)} title="Add child node">
                <PlusCircle className="h-4 w-4 text-primary" />
              </Button>
            )}
        </div>
      </div>
      
      <div 
        className="prose prose-sm dark:prose-invert max-w-none leading-relaxed space-y-2 mb-3"
        dangerouslySetInnerHTML={{ __html: node.content }}
      />

      <div className="flex items-center space-x-1 sm:space-x-2 text-xs text-muted-foreground mt-3 pt-3 border-t">
        <Button variant="ghost" size="sm" onClick={() => handleLocalVote('upvote')} disabled={!currentUser} 
                className={cn("px-2 py-1", userVote === 'upvote' && 'text-primary bg-primary/10 hover:bg-primary/20')}>
          <ThumbsUp className="mr-1 h-3.5 w-3.5 sm:mr-1.5 sm:h-4 sm:w-4" /> {node.upvotes || 0}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => handleLocalVote('downvote')} disabled={!currentUser}
                className={cn("px-2 py-1", userVote === 'downvote' && 'text-destructive bg-destructive/10 hover:bg-destructive/20')}>
          <ThumbsDown className="mr-1 h-3.5 w-3.5 sm:mr-1.5 sm:h-4 sm:w-4" /> {node.downvotes || 0}
        </Button>
        <span className="flex items-center pl-1 sm:pl-2"><MessageSquare className="mr-1 h-3.5 w-3.5 sm:mr-1.5 sm:h-4 sm:w-4" /> {node.commentCount || 0}</span>
      </div>

      <div className="mt-4 pl-2 sm:pl-4 border-l-2 border-border/30">
        <h4 className="text-xs sm:text-sm font-semibold mb-2 text-foreground/80">Comments:</h4>
        {isLoadingComments ? (
          <div className="flex items-center space-x-2 text-xs text-muted-foreground py-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Loading comments...</span>
          </div>
        ) : nodeComments.length > 0 ? (
          <div className="space-y-2.5">
            {nodeComments.map(comment => (
              <div key={comment.id} className="text-xs p-2 bg-muted/40 rounded-md shadow-xs">
                 <div className="flex items-center mb-1">
                    <Avatar className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2">
                        <AvatarImage src={comment.authorProfilePictureUrl || undefined} alt={comment.authorUsername} />
                        <AvatarFallback className="text-2xs sm:text-xs">
                           {comment.authorUsername ? comment.authorUsername.charAt(0).toUpperCase() : <User className="h-3 w-3" />}
                        </AvatarFallback>
                    </Avatar>
                    <Link href={`/profile/${comment.authorId}`} className="font-semibold text-foreground hover:underline text-xs sm:text-sm">{comment.authorUsername || "Anonymous"}</Link>
                    <span className="ml-1.5 sm:ml-2 text-muted-foreground text-2xs sm:text-xs">
                        &bull; {new Date(comment.createdAt).toLocaleString()}
                    </span>
                </div>
                <div 
                  className="prose prose-xs dark:prose-invert max-w-none pl-6 sm:pl-7 text-foreground/90"
                  dangerouslySetInnerHTML={{ __html: comment.text }}
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground py-2">No comments on this node yet.</p>
        )}

        {currentUser && (
          <Form {...commentForm}>
            <form onSubmit={commentForm.handleSubmit(handlePostComment)} className="mt-3 space-y-1.5">
              <FormField
                control={commentForm.control}
                name="commentText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="sr-only">Add your comment</FormLabel>
                    <FormControl>
                      <RichTextEditor
                        initialContent={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <Button type="submit" size="sm" className="text-xs px-2.5 py-1" disabled={isSubmittingComment || !commentForm.formState.isValid}>
                {isSubmittingComment && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />}
                Post Comment
              </Button>
            </form>
          </Form>
        )}
         {!currentUser && (
             <p className="text-xs text-muted-foreground mt-3">
                <Link href={`/login?redirect=/stories/${storyId}`} className="text-primary hover:underline">Log in</Link> to comment.
            </p>
         )}
      </div>

      {children.map(childNode => (
        <StoryNodeDisplay 
            key={childNode.id} 
            node={childNode} 
            allNodes={allNodes} 
            storyId={storyId} 
            storyAuthorId={storyAuthorId} 
            level={level + 1} 
            currentUser={currentUser}
            onVote={onVote}
            refreshAllNodes={refreshAllNodes}
            isStoryAuthor={isStoryAuthor}
        />
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

  const fetchStoryAndNodes = useCallback(async () => {
    if (!storyId || !db) {
      setError(storyId ? "Database service is unavailable." : "Story ID is missing.");
      setLoading(false);
      return;
    }
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
            order: Number(nodeData.order), 
            votedBy: nodeData.votedBy || {}, 
            upvotes: nodeData.upvotes || 0,
            downvotes: nodeData.downvotes || 0,
            commentCount: nodeData.commentCount || 0,
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
  }, [storyId]);

  useEffect(() => {
    fetchStoryAndNodes();
  }, [fetchStoryAndNodes]);

  const handleVoteOnNode = async (nodeId: string, voteType: 'upvote' | 'downvote') => {
    if (!currentUser || !storyId) {
        toast({ title: "Authentication Required", description: "You must be logged in to vote.", variant: "destructive" });
        return;
    }
    const action = voteType === 'upvote' ? upvoteStoryNodeAction : downvoteStoryNodeAction;
    const result = await action({ storyId, nodeId, userId: currentUser.uid });

    if (result.success) {
        toast({ title: "Vote Counted!" });
        fetchStoryAndNodes(); 
    } else {
        toast({ title: "Error", description: result.error || "Failed to record vote.", variant: "destructive" });
    }
  };
  
  const isAuthor = currentUser?.uid === story?.authorId;
  const rootNodesToRender = storyNodes.filter(node => node.parentId === null);


  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-primary" />
        <p className="ml-3 sm:ml-4 text-md sm:text-lg">Loading story...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-destructive">{error}</h2>
        <Button onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  if (!story) {
    return (
       <div className="text-center py-10">
        <h2 className="text-xl sm:text-2xl font-semibold mb-4">Story not found.</h2>
        <Button onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6">
        <Button variant="outline" onClick={() => router.push('/')} size="sm"> {/* Changed to / from /stories */}
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Stories
        </Button>
        {isAuthor && (
          <Button variant="outline" asChild size="sm">
            <Link href={`/stories/edit/${story.id}`}> 
              <Edit className="mr-1.5 h-4 w-4" /> Edit Story
            </Link>
          </Button>
        )}
      </div>
      
      <article>
        {story.coverImageUrl && (
          <div className="mb-6 sm:mb-8 rounded-lg overflow-hidden shadow-lg aspect-[16/9] sm:aspect-[2/1] bg-muted">
            <Image
              src={story.coverImageUrl}
              alt={`Cover image for ${story.title}`}
              width={800}
              height={400}
              className="w-full h-full object-cover"
              data-ai-hint="story cover large"
              priority 
            />
          </div>
        )}
        {!story.coverImageUrl && story.title && (
           <div className="mb-6 sm:mb-8 rounded-lg overflow-hidden shadow-lg bg-muted flex items-center justify-center aspect-[16/9] sm:aspect-[2/1]">
            <Image 
              src={`https://placehold.co/800x400.png?text=${encodeURIComponent(story.title)}`}
              alt={`Placeholder for ${story.title}`}
              width={800}
              height={400}
              className="w-full h-full object-cover"
              data-ai-hint="story placeholder large"
            />
          </div>
        )}

        <header className="mb-4 sm:mb-6">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-headline font-bold mb-3 sm:mb-4">{story.title}</h1>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4 text-muted-foreground text-sm">
            <Link href={`/profile/${story.authorId}`} className="flex items-center space-x-2 hover:text-primary transition-colors">
              <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                <AvatarImage src={story.authorProfilePictureUrl || undefined} alt={story.authorUsername} />
                <AvatarFallback className="text-xs">
                  {story.authorUsername ? story.authorUsername.charAt(0).toUpperCase() : <User className="h-4 w-4"/>}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">{story.authorUsername || "Anonymous"}</span>
            </Link>
            <span className="flex items-center text-xs sm:text-sm"><CalendarDays className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" /> Published on {new Date(story.createdAt).toLocaleDateString()}</span>
          </div>
        </header>

        <Separator className="my-4 sm:my-6" />
        
        <div className="prose dark:prose-invert max-w-none">
          {rootNodesToRender.length > 0 ? (
              rootNodesToRender.map(node => (
                <Fragment key={node.id}>
                  <StoryNodeDisplay
                    node={node}
                    allNodes={storyNodes}
                    storyId={story.id} 
                    storyAuthorId={story.authorId}
                    level={0}
                    currentUser={currentUser}
                    onVote={handleVoteOnNode}
                    refreshAllNodes={fetchStoryAndNodes}
                    isStoryAuthor={isAuthor}
                  />
                </Fragment>
              ))
            ) : (
              <Card className="p-4 sm:p-6 text-center">
                  <CardDescription>This story doesn't have any content yet. {isAuthor ? "Why not add the first node?" : ""}</CardDescription>
                  {isAuthor && 
                      <Button asChild className="mt-4" size="sm">
                          <Link href={`/stories/edit/${story.id}`}>Add First Node</Link>
                      </Button>
                  }
              </Card>
            )}
        </div>

        <Separator className="my-6 sm:my-8" />

        <footer className="space-y-4 sm:space-y-6">
          {story.tags && story.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <Tag className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
              {story.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs sm:text-sm px-2 py-0.5 sm:px-2.5 sm:py-1">
                  <Link href={`/tags/${tag.toLowerCase()}`}>{tag}</Link>
                </Badge>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:gap-x-6 text-sm text-muted-foreground">
            <span className="flex items-center"><Eye className="mr-1 sm:mr-1.5 h-4 w-4 sm:h-5 sm:w-5" /> {story.views || 0} views</span>
            <span className="flex items-center"><Heart className="mr-1 sm:mr-1.5 h-4 w-4 sm:h-5 sm:w-5" /> {story.likes || 0} likes</span>
             <span className="flex items-center">
              <MessageSquare className="mr-1 sm:mr-1.5 h-4 w-4 sm:h-5 sm:w-5" /> 
              {storyNodes.reduce((acc, curr) => acc + (curr.commentCount || 0), 0)} total comments
            </span>
          </div>
        </footer>
      </article>
    </div>
  );
}
