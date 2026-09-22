export type UserRole = 'User' | 'Moderator';

export type ForumTag = 'API' | 'Integration' | 'Security' | 'SDK' | 'General';

export interface ForumAuthor {
  id: string;
  displayName: string;
  role: UserRole;
}

export interface ForumPost {
  id: string;
  title: string;
  excerpt: string;
  author: ForumAuthor;
  tags: ForumTag[];
  createdAt: string;
  likeCount: number;
  commentCount: number;
  likedByCurrentUser: boolean;
  isFlagged: boolean;
}

export type PostSort = 'recent' | 'popular';

