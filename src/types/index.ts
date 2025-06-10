
import type { User as FirebaseUser } from 'firebase/auth';

export interface UserProfile extends FirebaseUser {
  // FirebaseUser already has uid, email, displayName, photoURL
  username?: string | null; // Custom username, can be different from displayName
  bio?: string;
  profilePictureUrl?: string | null; // Potentially from Supabase, could override photoURL
  createdAt?: Date;
  // followerCount, followingCount will be derived or stored separately
}

export interface Story {
  id: string;
  authorId: string;
  authorUsername: string;
  authorProfilePictureUrl?: string | null; // Updated to allow null
  title: string;
  coverImageUrl?: string | null; // From Supabase
  tags: string[];
  category: string;
  status: 'draft' | 'published';
  createdAt: number; // Store as timestamp for the story entity itself
  updatedAt: number; // Store as timestamp, updated when story metadata or any part changes
  views: number;
  likes: number; // Overall story likes, distinct from node votes
  nodeCount: number;
  firstNodeExcerpt: string;
  isLocked: boolean;
  canonicalBranchNodeId: string | null;
}

export interface StoryNode {
  id: string;
  storyId: string;
  authorId: string;
  authorUsername: string; // Denormalized for easier display
  authorProfilePictureUrl?: string | null; // Updated to allow null
  content: string;
  order: number; // Timestamp for chronological sorting of siblings
  parentId: string | null;
  createdAt: number;
  updatedAt: number;
  upvotes: number;
  downvotes: number;
  votedBy: { [userId: string]: 'upvote' | 'downvote' };
  commentCount?: number;
}

export interface StoryNodeComment {
  id: string;
  storyId: string;
  nodeId: string;
  authorId: string;
  authorUsername: string;
  authorProfilePictureUrl?: string | null; // Updated to allow null
  text: string;
  parentId: string | null; // For threaded replies to comments
  depth: number;
  createdAt: number;
}


export interface Notification {
  id: string;
  userId: string; // recipient
  type: 'new_comment' | 'new_reply' | 'new_follower' | 'story_like' | 'system' | 'welcome';
  senderId?: string; // User who triggered the notification
  senderUsername?: string;
  storyId?: string; // Related story
  commentId?: string; // Related comment
  message: string;
  isRead: boolean;
  createdAt: number; // Store as timestamp
  highlight?: boolean; // From GenAI
  link?: string; // URL to navigate to
}
