import PostModel from '@server/models/post.model';
import {
  getPosts,
  getPostById,
  createPost,
  updatePost,
  likePost,
  deletePost,
} from '@server/services/post.service';
import { mockPost1, mockPopulatedPost1, mockPopulatedPost2, POPULATED_POSTS } from '../mockData.models';

describe('Post Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---- getPosts ----

  describe('getPosts', () => {
    const mockChain = (result: unknown) => ({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(result),
    });

    it('returns populated posts sorted by newest by default', async () => {
      jest.spyOn(PostModel, 'find').mockReturnValue(
        mockChain(POPULATED_POSTS) as unknown as ReturnType<typeof PostModel.find>
      );

      const result = await getPosts();

      expect(result).toHaveLength(2);
      expect(PostModel.find).toHaveBeenCalledWith(expect.objectContaining({ status: 'PUBLISHED' }));
    });

    it('filters by tag when provided', async () => {
      jest.spyOn(PostModel, 'find').mockReturnValue(
        mockChain([mockPopulatedPost1]) as unknown as ReturnType<typeof PostModel.find>
      );

      await getPosts('newest', '', 'typescript');

      expect(PostModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ tags: 'typescript' })
      );
    });

    it('filters by search string across title and content', async () => {
      jest.spyOn(PostModel, 'find').mockReturnValue(
        mockChain([mockPopulatedPost1]) as unknown as ReturnType<typeof PostModel.find>
      );

      await getPosts('newest', 'TypeScript');

      expect(PostModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ $or: expect.any(Array) })
      );
    });

    it('applies correct sort for mostLiked', async () => {
      const chain = mockChain(POPULATED_POSTS);
      jest.spyOn(PostModel, 'find').mockReturnValue(
        chain as unknown as ReturnType<typeof PostModel.find>
      );

      await getPosts('mostLiked');

      expect(chain.sort).toHaveBeenCalledWith(expect.objectContaining({ likesCount: -1 }));
    });
  });

  // ---- getPostById ----

  describe('getPostById', () => {
    it('returns the post and increments views', async () => {
      jest.spyOn(PostModel, 'findByIdAndUpdate').mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockPopulatedPost1),
      } as unknown as ReturnType<typeof PostModel.findByIdAndUpdate>);

      const result = await getPostById(String(mockPost1._id));

      expect(result.title).toBe('Getting Started with TypeScript');
      expect(PostModel.findByIdAndUpdate).toHaveBeenCalledWith(
        String(mockPost1._id),
        { $inc: { views: 1 } },
        { new: true }
      );
    });

    it('throws if post is not found', async () => {
      jest.spyOn(PostModel, 'findByIdAndUpdate').mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(null),
      } as unknown as ReturnType<typeof PostModel.findByIdAndUpdate>);

      await expect(getPostById('nonexistent')).rejects.toThrow('Post not found');
    });
  });

  // ---- createPost ----

  describe('createPost', () => {
    it('creates a post with empty likes and zero views', async () => {
      const mockDoc = {
        ...mockPost1,
        populate: jest.fn().mockResolvedValue(mockPopulatedPost1),
      };
      jest.spyOn(PostModel, 'create').mockResolvedValue(mockDoc as unknown as Awaited<ReturnType<typeof PostModel.create>>);

      const result = await createPost({
        title: 'New',
        content: 'Content',
        tags: [],
        status: 'PUBLISHED',
        author: 'alice',
      });

      expect(PostModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ likes: [], views: 0 })
      );
      expect(result.title).toBe('Getting Started with TypeScript');
    });
  });

  // ---- updatePost ----

  describe('updatePost', () => {
    it('updates specified fields and returns populated post', async () => {
      jest.spyOn(PostModel, 'findByIdAndUpdate').mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue({ ...mockPopulatedPost1, title: 'Updated' }),
      } as unknown as ReturnType<typeof PostModel.findByIdAndUpdate>);

      const result = await updatePost(String(mockPost1._id), { title: 'Updated' });

      expect(result.title).toBe('Updated');
      expect(PostModel.findByIdAndUpdate).toHaveBeenCalledWith(
        String(mockPost1._id),
        expect.objectContaining({ title: 'Updated' }),
        expect.objectContaining({ new: true })
      );
    });

    it('throws if post not found', async () => {
      jest.spyOn(PostModel, 'findByIdAndUpdate').mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(null),
      } as unknown as ReturnType<typeof PostModel.findByIdAndUpdate>);

      await expect(updatePost('badid', {})).rejects.toThrow('Post not found');
    });
  });

  // ---- likePost ----

  describe('likePost', () => {
    it('adds username to likes when not already liked', async () => {
      const post = { ...mockPost1, likes: [], save: jest.fn().mockResolvedValue(undefined) };
      jest.spyOn(PostModel, 'findById').mockResolvedValue(post as unknown as ReturnType<typeof PostModel.findById>);

      const result = await likePost(String(mockPost1._id), 'alice');

      expect(result.liked).toBe(true);
      expect(result.likes).toBe(1);
      expect(post.save).toHaveBeenCalled();
    });

    it('removes username from likes when already liked (unlike)', async () => {
      const post = { ...mockPost1, likes: ['alice'], save: jest.fn().mockResolvedValue(undefined) };
      jest.spyOn(PostModel, 'findById').mockResolvedValue(post as unknown as ReturnType<typeof PostModel.findById>);

      const result = await likePost(String(mockPost1._id), 'alice');

      expect(result.liked).toBe(false);
      expect(result.likes).toBe(0);
    });

    it('throws if post not found', async () => {
      jest.spyOn(PostModel, 'findById').mockResolvedValue(null);

      await expect(likePost('badid', 'alice')).rejects.toThrow('Post not found');
    });
  });

  // ---- deletePost ----

  describe('deletePost', () => {
    it('calls findByIdAndDelete with the post id', async () => {
      jest.spyOn(PostModel, 'findByIdAndDelete').mockResolvedValue(mockPost1 as unknown as Awaited<ReturnType<typeof PostModel.findByIdAndDelete>>);

      await deletePost(String(mockPost1._id));

      expect(PostModel.findByIdAndDelete).toHaveBeenCalledWith(String(mockPost1._id));
    });
  });
});
