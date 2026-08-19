import { Heart, MessageCircle, Eye, Tag } from 'lucide-react';
import { PopulatedDatabasePost } from 'shared/types/post';
import useUserContext from '../../../contexts/useUserContext';
import './index.css';

interface PostCardProps {
  post: PopulatedDatabasePost;
  onLike: () => void;
}

const PostCard = ({ post, onLike }: PostCardProps) => {
  const { user } = useUserContext();
  const isLiked = post.likes.includes(user.username);
  const timeAgo = formatTimeAgo(post.createdAt);

  return (
    <article className='post-card card'>
      <div className='post-card-header'>
        <div className='post-author'>
          <div className='author-avatar'>
            {post.author.username[0].toUpperCase()}
          </div>
          <span className='author-name'>{post.author.username}</span>
          <span className='post-time text-muted text-sm'>{timeAgo}</span>
        </div>

        {post.status !== 'PUBLISHED' && (
          <span className={`badge badge-${post.status === 'DRAFT' ? 'primary' : 'error'}`}>
            {post.status}
          </span>
        )}
      </div>

      <h3 className='post-title'>{post.title}</h3>
      <p className='post-content text-muted'>
        {post.content.slice(0, 200)}{post.content.length > 200 && '…'}
      </p>

      {post.tags.length > 0 && (
        <div className='post-tags'>
          <Tag size={14} className='tag-icon' />
          {post.tags.map(tag => (
            <span key={tag} className='badge badge-primary post-tag'>{tag}</span>
          ))}
        </div>
      )}

      <div className='post-card-footer'>
        <button
          className={`post-action${isLiked ? ' liked' : ''}`}
          onClick={onLike}
          type='button'
          aria-label={isLiked ? 'Unlike' : 'Like'}
        >
          <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
          <span>{post.likes.length}</span>
        </button>

        <div className='post-action' aria-label='Comments'>
          <MessageCircle size={16} />
          <span>{post.comments.length}</span>
        </div>

        <div className='post-action' aria-label='Views'>
          <Eye size={16} />
          <span>{post.views}</span>
        </div>
      </div>
    </article>
  );
};

const formatTimeAgo = (date: Date): string => {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

export default PostCard;
