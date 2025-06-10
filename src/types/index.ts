import type { User as FirebaseUser } from 'firebase/auth';

export interface UserProfile extends FirebaseUser {
  // FirebaseUser already has uid, email, displayName, photoURL
  username?: string | null; // Custom username, can be different from displayName
  bio?: string;
  profilePictureUrl?: string; // Potentially from Supabase, could override photoURL
  createdAt?: Date;
  // followerCount, followingCount will be derived or stored separately
}

export interface Story {
  id: string;
  authorId: string;
  authorUsername: string; 
  authorProfilePictureUrl?: string;
  title: string;
  content: string; // Rich text (HTML or JSON from Tiptap)
  coverImageUrl?: string; // From Supabase
  tags: string[];
  category: string;
  status: 'draft' | 'published';
  createdAt: number; // Store as timestamp
  updatedAt: number; // Store as timestamp
  views: number;
  likes: number;
  commentCount: number;
}

export interface Comment {
  id: string;
  storyId: string;
  authorId: string;
  authorUsername:string;
  authorProfilePictureUrl?: string;
  text: string;
  parentId: string | null; // For threaded replies
  depth: number; // 0, 1, 2
  createdAt: number; // Store as timestamp
  upvotes: number;
  // downvotes: number; // Keeping it simple with just upvotes
  // upvotedBy: Record<string, boolean>; // Users who upvoted: { [userId]: true }
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
