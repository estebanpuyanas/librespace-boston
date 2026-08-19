import { useState, useEffect, useCallback } from 'react';
import { PopulatedDatabasePost, PostOrderType } from 'shared/types/post';
import { PostUpdatePayload, LikeUpdatePayload } from 'shared/types/socket';
import { getPosts, likePost } from '../services/postService';
import useUserContext from '../contexts/useUserContext';

interface UsePostsReturn {
  posts: PopulatedDatabasePost[];
  loading: boolean;
  error: string | null;
  order: PostOrderType;
  search: string;
  setOrder: (order: PostOrderType) => void;
  setSearch: (search: string) => void;
  handleLike: (pid: string) => Promise<void>;
  refresh: () => void;
}

const usePosts = (): UsePostsReturn => {
  const { user, socket } = useUserContext();
  const [posts, setPosts] = useState<PopulatedDatabasePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<PostOrderType>('newest');
  const [search, setSearch] = useState('');

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getPosts(order, search);
      setPosts(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  }, [order, search]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  // Real-time socket updates
  useEffect(() => {
    const handlePostCreated = ({ post }: PostUpdatePayload) => {
      setPosts(prev => [post, ...prev]);
    };
    const handlePostUpdated = ({ post }: PostUpdatePayload) => {
      setPosts(prev => prev.map(p => (String(p._id) === String(post._id) ? post : p)));
    };
    const handlePostDeleted = ({ postId }: { postId: string }) => {
      setPosts(prev => prev.filter(p => String(p._id) !== postId));
    };
    const handleLikeUpdated = ({ postId, likes }: LikeUpdatePayload) => {
      setPosts(prev =>
        prev.map(p => (String(p._id) === postId ? { ...p, likes: Array(likes).fill('') } : p))
      );
    };

    socket.on('postCreated', handlePostCreated);
    socket.on('postUpdated', handlePostUpdated);
    socket.on('postDeleted', handlePostDeleted);
    socket.on('likeUpdated', handleLikeUpdated);

    return () => {
      socket.off('postCreated', handlePostCreated);
      socket.off('postUpdated', handlePostUpdated);
      socket.off('postDeleted', handlePostDeleted);
      socket.off('likeUpdated', handleLikeUpdated);
    };
  }, [socket]);

  const handleLike = async (pid: string) => {
    await likePost(pid, user.username);
  };

  return { posts, loading, error, order, search, setOrder, setSearch, handleLike, refresh: fetchPosts };
};

export default usePosts;
