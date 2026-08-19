import PostModel from '../models/post.model';
import { PopulatedDatabasePost, PostOrderType, Post } from 'shared/types/post';

// Services contain all business logic — no req/res objects here.
// Controllers call these functions and handle HTTP wrapping.

export const getPosts = async (
  order: PostOrderType = 'newest',
  search = '',
  tag = '',
  page = 1,
  limit = 20
): Promise<PopulatedDatabasePost[]> => {
  const filter: Record<string, unknown> = { status: 'PUBLISHED' };
  if (tag) filter.tags = tag;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { content: { $regex: search, $options: 'i' } },
    ];
  }

  const sortMap: Record<PostOrderType, Record<string, 1 | -1>> = {
    newest:   { createdAt: -1 },
    oldest:   { createdAt: 1 },
    mostLiked: { likesCount: -1, createdAt: -1 },
    trending:  { views: -1, createdAt: -1 },
  };

  return PostModel
    .find(filter)
    .sort(sortMap[order])
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('author', '-password')
    .populate({ path: 'comments', populate: { path: 'author', select: '-password' } })
    .lean<PopulatedDatabasePost[]>();
};

export const getPostById = async (pid: string): Promise<PopulatedDatabasePost> => {
  const post = await PostModel
    .findByIdAndUpdate(pid, { $inc: { views: 1 } }, { new: true })
    .populate('author', '-password')
    .populate({ path: 'comments', populate: { path: 'author', select: '-password' } })
    .lean<PopulatedDatabasePost>();
  if (!post) throw new Error('Post not found');
  return post;
};

export const createPost = async (
  data: Omit<Post, 'likes' | 'views' | 'createdAt' | 'updatedAt'>
): Promise<PopulatedDatabasePost> => {
  const post = await PostModel.create({
    ...data, likes: [], views: 0, createdAt: new Date(), updatedAt: new Date(),
  });
  return post.populate([
    { path: 'author', select: '-password' },
    { path: 'comments', populate: { path: 'author', select: '-password' } },
  ]) as Promise<PopulatedDatabasePost>;
};

export const updatePost = async (
  pid: string,
  updates: Partial<Pick<Post, 'title' | 'content' | 'tags' | 'status'>>
): Promise<PopulatedDatabasePost> => {
  const post = await PostModel
    .findByIdAndUpdate(pid, { ...updates, updatedAt: new Date() }, { new: true, runValidators: true })
    .populate('author', '-password')
    .lean<PopulatedDatabasePost>();
  if (!post) throw new Error('Post not found');
  return post;
};

export const likePost = async (
  pid: string,
  username: string
): Promise<{ likes: number; liked: boolean }> => {
  const post = await PostModel.findById(pid);
  if (!post) throw new Error('Post not found');

  const hasLiked = (post.likes as string[]).includes(username);
  if (hasLiked) {
    post.likes = (post.likes as string[]).filter(u => u !== username);
  } else {
    (post.likes as string[]).push(username);
  }
  await post.save();
  return { likes: post.likes.length, liked: !hasLiked };
};

export const deletePost = async (pid: string): Promise<void> => {
  await PostModel.findByIdAndDelete(pid);
};
