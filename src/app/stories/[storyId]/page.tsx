
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
// Textarea removed
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Edit, Eye, Heart, Loader2, MessageSquare, Send, User, Tag, ThumbsUp, ThumbsDown, CornerDownRight } from "lucide-react";
import { addCommentToStoryNodeAction, upvoteStoryNodeAction, downvoteStoryNodeAction } from "./actions.ts";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import RichTextEditor from "@/components/editor/RichTextEditor";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";


const commentFormSchema = z.object({
  commentText: z.string().min(1, "Comment cannot be empty (HTML allowed)."),
});
type CommentFormValues = z.infer<typeof commentFormSchema>;

interface StoryNodeDisplayProps {
  node: StoryNode;
  allNodes: StoryNode[]; // All nodes for the story, to find children
  storyId: string;
  storyAuthorId: string;
  level?: number;
  currentUser: UserProfile | null;
  onVote: (nodeId: string, voteType: 'upvote' | 'downvote') => Promise<void>;
  refreshAllNodes: () => void; 
}

const StoryNodeDisplay: React.FC<StoryNodeDisplayProps> = ({ 
  node, 
  allNodes, 
  storyId, 
  storyAuthorId, 
  level = 0, 
  currentUser,
  onVote,
  refreshAllNodes 
}) => {
  // Find direct children of the current node
  const children = allNodes.filter(childNode => childNode.parentId === node.id).sort((a, b) => a.order - b.order);
  
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [nodeComments, setNodeComments] = useState<StoryNodeComment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const { toast } = useToast();

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
    if (!currentUser || !values.commentText.trim() || !storyId || !node.id) return;
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

  return (
    <div style={{ marginLeft: `${level * 25}px` }} className={`mt-4 p-4 border rounded-lg shadow-sm ${level > 0 ? 'bg-muted/30' : 'bg-card'}`}>
      {level > 0 && <CornerDownRight className="inline-block h-4 w-4 mr-2 text-muted-foreground" />}
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <Avatar className="h-6 w-6">
                <AvatarImage src={node.authorProfilePictureUrl || undefined} alt={node.authorUsername} />
                <AvatarFallback>{node.authorUsername?.[0]?.toUpperCase() || 'A'}</AvatarFallback>
            </Avatar>
            <Link href={`/profile/${node.authorId}`} className="font-medium hover:underline text-foreground">{node.authorUsername}</Link>
            <span>&bull;</span>
            <span>{new Date(node.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
      
      <div 
        className="prose prose-sm dark:prose-invert max-w-none leading-relaxed space-y-2 mb-3"
        dangerouslySetInnerHTML={{ __html: node.content }}
      />

      <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-3 pt-3 border-t">
        <Button variant="ghost" size="sm" onClick={() => handleLocalVote('upvote')} disabled={!currentUser} 
                className={cn(userVote === 'upvote' && 'text-primary bg-primary/10 hover:bg-primary/20')}>
          <ThumbsUp className="mr-1.5 h-4 w-4" /> {node.upvotes || 0}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => handleLocalVote('downvote')} disabled={!currentUser}
                className={cn(userVote === 'downvote' && 'text-destructive bg-destructive/10 hover:bg-destructive/20')}>
          <ThumbsDown className="mr-1.5 h-4 w-4" /> {node.downvotes || 0}
        </Button>
        <span className="flex items-center"><MessageSquare className="mr-1.5 h-4 w-4" /> {node.commentCount || 0}</span>
      </div>

      <div className="mt-4 pl-4 border-l-2 border-border/50">
        <h4 className="text-sm font-semibold mb-2 text-foreground/80">Comments:</h4>
        {isLoadingComments ? (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground py-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading comments...</span>
          </div>
        ) : nodeComments.length > 0 ? (
          <div className="space-y-3">
            {nodeComments.map(comment => (
              <div key={comment.id} className="text-xs p-2.5 bg-muted/50 rounded-md shadow-sm">
                 <div className="flex items-center mb-1">
                    <Avatar className="h-5 w-5 mr-2">
                        <AvatarImage src={comment.authorProfilePictureUrl || undefined} alt={comment.authorUsername} />
                        <AvatarFallback>{comment.authorUsername?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                    <Link href={`/profile/${comment.authorId}`} className="font-semibold text-foreground hover:underline">{comment.authorUsername || "Anonymous"}</Link>
                    <span className="ml-2 text-muted-foreground text-xs">
                        &bull; {new Date(comment.createdAt).toLocaleString()}
                    </span>
                </div>
                <div 
                  className="prose prose-xs dark:prose-invert max-w-none pl-7 text-foreground/90"
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
            <form onSubmit={commentForm.handleSubmit(handlePostComment)} className="mt-4 space-y-2">
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
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" size="sm" disabled={isSubmittingComment || !commentForm.formState.isValid}>
                {isSubmittingComment && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
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
  
  const renderNodesRecursive = (nodesToRender: StoryNode[], allNodes: StoryNode[], parentId: string | null, level: number = 0): JSX.Element[] => {
    return nodesToRender
      .filter(node => node.parentId === parentId)
      .sort((a,b) => a.order - b.order) // Ensure chronological order for siblings
      .map(node => (
        <Fragment key={node.id}>
          <StoryNodeDisplay
            node={node}
            allNodes={allNodes}
            storyId={story!.id} // story is guaranteed to be non-null here
            storyAuthorId={story!.authorId}
            level={level}
            currentUser={currentUser}
            onVote={handleVoteOnNode}
            refreshAllNodes={fetchStoryAndNodes}
          />
          {/* Recursively render children for this node */}
          {/* {renderNodesRecursive(allNodes, allNodes, node.id, level + 1)} */} 
          {/* Corrected: children already filtered inside StoryNodeDisplay */}
        </Fragment>
      ));
  };


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
  // Initial call to renderNodesRecursive starts with parentId = null for root nodes
  const rootNodesToRender = storyNodes.filter(node => node.parentId === null);


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
              priority 
            />
          </div>
        )}
        {!story.coverImageUrl && story.title && (
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

        {rootNodesToRender.length > 0 ? (
            renderNodesRecursive(rootNodesToRender, storyNodes, null, 0)
          ) : (
            <Card className="p-6 text-center">
                <CardDescription>This story doesn't have any content yet. {isAuthor ? "Why not add the first node?" : ""}</CardDescription>
                {isAuthor && 
                    <Button asChild className="mt-4">
                        <Link href={`/stories/edit/${story.id}`}>Add First Node</Link>
                    </Button>
                }
            </Card>
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
             <span className="flex items-center">
              <MessageSquare className="mr-1.5 h-5 w-5" /> 
              {/* Sum of commentCounts from all nodes - this could be denormalized on Story doc for efficiency */}
              {storyNodes.reduce((acc, curr) => acc + (curr.commentCount || 0), 0)} total comments on nodes
            </span>
          </div>
        </footer>
      </article>
    </div>
  );
}
