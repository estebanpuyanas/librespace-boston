import { ObjectId } from 'mongodb';
import { Request } from 'express';
import { SafeDatabaseUser } from './user';

export type PostStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type PostOrderType = 'newest' | 'oldest' | 'mostLiked' | 'trending';

// Base domain type
export interface Post {
  title: string;
  content: string;
  tags: string[];
  status: PostStatus;
  author: string;       // username reference (string in transit)
  likes: string[];      // array of usernames
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

// Stored in DB — ObjectId references
export interface DatabasePost extends Omit<Post, 'author'> {
  _id: ObjectId;
  author: ObjectId;
  comments: ObjectId[];
}

// Fully resolved — used in API responses
export interface PopulatedDatabasePost extends Omit<DatabasePost, 'author' | 'comments'> {
  author: SafeDatabaseUser;
  comments: PopulatedComment[];
}

export interface Comment {
  content: string;
  author: string;
  createdAt: Date;
}

export interface DatabaseComment extends Omit<Comment, 'author'> {
  _id: ObjectId;
  author: ObjectId;
  post: ObjectId;
}

export interface PopulatedComment extends Omit<DatabaseComment, 'author'> {
  author: SafeDatabaseUser;
}

// ---- Request Types ----

export interface GetPostsRequest extends Request {
  query: {
    order?: PostOrderType;
    search?: string;
    tag?: string;
    author?: string;
    page?: string;
    limit?: string;
  };
}

export interface GetPostByIdRequest extends Request {
  params: { pid: string };
}

export interface CreatePostRequest extends Request {
  body: Pick<Post, 'title' | 'content' | 'tags' | 'status'>;
}

export interface UpdatePostRequest extends Request {
  params: { pid: string };
  body: Partial<Pick<Post, 'title' | 'content' | 'tags' | 'status'>>;
}

export interface LikePostRequest extends Request {
  params: { pid: string };
  body: { username: string };
}

// ---- Response Types ----

export type PostResponse = PopulatedDatabasePost | { error: string };
export type PostListResponse = PopulatedDatabasePost[] | { error: string };
export type LikeResponse = { likes: number; liked: boolean } | { error: string };
