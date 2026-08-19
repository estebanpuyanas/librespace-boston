import { useState } from 'react';
import usePosts from '../../../hooks/usePosts';
import PostCard from '../PostCard';
import { PostOrderType } from 'shared/types/post';
import './index.css';

const ORDER_OPTIONS: { value: PostOrderType; label: string }[] = [
  { value: 'newest',   label: 'Newest' },
  { value: 'oldest',   label: 'Oldest' },
  { value: 'mostLiked', label: 'Most Liked' },
  { value: 'trending', label: 'Trending' },
];

const PostListPage = () => {
  const { posts, loading, error, order, setOrder, search, setSearch, handleLike } = usePosts();
  const [searchInput, setSearchInput] = useState(search);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  return (
    <div className='post-list-page'>
      <div className='post-list-header'>
        <h2 className='post-list-title'>Posts</h2>

        <div className='post-list-controls'>
          <form onSubmit={handleSearch} className='search-form'>
            <input
              className='input search-input'
              type='text'
              placeholder='Search posts...'
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
            />
          </form>

          <div className='order-tabs'>
            {ORDER_OPTIONS.map(opt => (
              <button
                key={opt.value}
                className={`order-tab ${order === opt.value ? 'active' : ''}`}
                onClick={() => setOrder(opt.value)}
                type='button'
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && <p className='error-message'>{error}</p>}

      {loading ? (
        <div className='flex-center post-list-loading'>
          <div className='spinner' />
        </div>
      ) : posts.length === 0 ? (
        <div className='empty-state'>
          <p>No posts found.{search && ' Try a different search term.'}</p>
        </div>
      ) : (
        <ul className='post-list'>
          {posts.map(post => (
            <li key={String(post._id)}>
              <PostCard post={post} onLike={() => handleLike(String(post._id))} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PostListPage;
