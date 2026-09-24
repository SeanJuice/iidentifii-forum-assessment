export type UserRole = 'User' | 'Moderator';
export type ForumTopic = 'API' | 'Integration' | 'Security' | 'SDK' | 'General';
export type PostSort = 'date' | 'likes';

export interface UserResponse {
  id: string;
  displayName: string;
  email: string;
  roles: UserRole[];
}

export interface AuthResponse {
  accessToken: string;
  expiresAt: string;
  user: UserResponse;
}

export interface RegisterRequest {
  displayName: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthorResponse {
  id: string;
  displayName: string;
  role: UserRole;
}

export interface AuthorFilterResponse {
  id: string;
  displayName: string;
  postCount: number;
}

export interface PostListItemResponse {
  id: string;
  title: string;
  excerpt: string;
  author: AuthorResponse;
  topics: ForumTopic[];
  createdAt: string;
  likeCount: number;
  commentCount: number;
  likedByCurrentUser: boolean;
  isFlagged: boolean;
}

export interface CommentResponse {
  id: string;
  content: string;
  author: AuthorResponse;
  createdAt: string;
}

export interface ModerationTagResponse {
  tag: string;
  moderator: AuthorResponse;
  createdAt: string;
}

export interface PostDetailResponse {
  id: string;
  title: string;
  content: string;
  author: AuthorResponse;
  topics: ForumTopic[];
  createdAt: string;
  updatedAt: string | null;
  likeCount: number;
  likedByCurrentUser: boolean;
  commentCount: number;
  moderationTag: ModerationTagResponse | null;
}

export interface PagedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface PostQuery {
  page: number;
  pageSize: number;
  topic?: ForumTopic;
  search?: string;
  fromDate?: string;
  toDate?: string;
  authorId?: string;
  flagged?: boolean;
  sortBy: PostSort;
  sortDirection: 'asc' | 'desc';
}

export interface CommentQuery {
  page: number;
  pageSize: number;
  sortDirection: 'asc' | 'desc';
  fromDate?: string;
  toDate?: string;
  authorId?: string;
}

export interface CreatePostRequest {
  title: string;
  content: string;
  topics: ForumTopic[];
}
