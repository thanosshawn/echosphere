# **App Name**: EchoSphere

## Core Features:

- User Authentication: User authentication via Firebase (email/password, Google Sign-In, anonymous login with account upgrade).
- Story Posting and Management: Story creation, editing, and deletion with rich text support (Tiptap editor), cover image upload to Supabase, tags/categories, and publication status.
- Threaded Discussion: Threaded discussion system with comments, replies (3 levels), real-time updates using Firebase Realtime Database, upvote/downvote system, and comment moderation.
- Real-Time Notifications: Real-time notifications for new comments/replies, followers, or likes, delivered via Firebase Realtime Database. A tool will decide whether to highlight particular notification types.
- User Profiles: Public user profiles with username, bio, profile picture (Supabase), published stories, follower/following counts, and a 'Follow' button.
- Search and Discovery: Search stories/users, filter stories by tags/popularity/date, and display a trending section based on views/likes/comments.
- Moderation: Admin dashboard for moderators to review reported content, ban/suspend users, and edit community guidelines, with a reporting system for inappropriate content.

## Style Guidelines:

- Primary color: Soft blue (#79A3B1) to evoke a sense of calm and trustworthiness, promoting thoughtful discussion.
- Background color: Light gray (#E8E8E8), providing a neutral backdrop that enhances readability and reduces eye strain.
- Accent color: Muted purple (#A98DCD) to highlight interactive elements, CTAs, and notifications.
- Body text: 'PT Sans' (sans-serif) for body text.
- Headline text: 'Playfair' (serif) to contrast nicely with the PT Sans.
- Simple, clear icons for user actions, category labels, and navigation. Use consistent styling to convey a polished and professional feel.
- Subtle transitions and loading animations to provide feedback during interactions. Keep animations brief and functional, avoiding unnecessary distractions.