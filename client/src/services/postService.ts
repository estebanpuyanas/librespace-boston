import api from './axios';
import {
  PopulatedDatabasePost,
  PostListResponse,
  PostResponse,
  LikeResponse,
  PostOrderType,
} from 'shared/types/post';

export const getPosts = async (
  order: PostOrderType = 'newest',
  search = '',
  tag = ''
): Promise<PopulatedDatabasePost[]> => {
  const params = new URLSearchParams({ order });
  if (search) params.set('search', search);
  if (tag) params.set('tag', tag);
  const { data } = await api.get<PostListResponse>(`/posts?${params}`);
  if ('error' in data) throw new Error(data.error);
  return data;
};

export const getPostById = async (pid: string): Promise<PopulatedDatabasePost> => {
  const { data } = await api.get<PostResponse>(`/posts/${pid}`);
  if ('error' in data) throw new Error(data.error);
  return data;
};

export const createPost = async (post: {
  title: string;
  content: string;
  tags: string[];
}): Promise<PopulatedDatabasePost> => {
  const { data } = await api.post<PostResponse>('/posts', post);
  if ('error' in data) throw new Error(data.error);
  return data;
};

export const likePost = async (pid: string, username: string): Promise<LikeResponse> => {
  const { data } = await api.put<LikeResponse>(`/posts/${pid}/like`, { username });
  return data;
};

export const deletePost = async (pid: string): Promise<void> => {
  await api.delete(`/posts/${pid}`);
};
