import supertest from 'supertest';
import app from '@server/app';
import * as postService from '@server/services/post.service';
import { mockPopulatedPost1, mockPopulatedPost2, POPULATED_POSTS } from '../mockData.models';

// Bypass JWT validation — auth is tested separately in auth.middleware.spec.ts
jest.mock('@server/middleware/auth.middleware', () => ({
  authMiddleware: (req: Express.Request & { username?: string; userId?: string; role?: string }, _res: unknown, next: () => void) => {
    req.username = 'alice';
    req.userId = '507f191e810c19729de860aa';
    req.role = 'USER';
    next();
  },
  requireRole: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

// Mock activity tracker so it doesn't issue DB calls during controller tests
jest.mock('@server/middleware/activityTracker.middleware', () => ({
  activityTracker: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

const getPostsSpy = jest.spyOn(postService, 'getPosts');
const getPostByIdSpy = jest.spyOn(postService, 'getPostById');
const createPostSpy = jest.spyOn(postService, 'createPost');
const updatePostSpy = jest.spyOn(postService, 'updatePost');
const likePostSpy = jest.spyOn(postService, 'likePost');
const deletePostSpy = jest.spyOn(postService, 'deletePost');

describe('Post Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---- GET /api/posts ----

  describe('GET /api/posts', () => {
    it('returns 200 with list of posts', async () => {
      getPostsSpy.mockResolvedValueOnce(POPULATED_POSTS);

      const response = await supertest(app).get('/api/posts');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(getPostsSpy).toHaveBeenCalledWith('newest', '', '', 1, 20);
    });

    it('passes order and search query params to service', async () => {
      getPostsSpy.mockResolvedValueOnce([mockPopulatedPost1]);

      const response = await supertest(app)
        .get('/api/posts')
        .query({ order: 'mostLiked', search: 'TypeScript', page: '2', limit: '5' });

      expect(response.status).toBe(200);
      expect(getPostsSpy).toHaveBeenCalledWith('mostLiked', 'TypeScript', '', 2, 5);
    });

    it('returns 500 if service throws', async () => {
      getPostsSpy.mockRejectedValueOnce(new Error('DB error'));

      const response = await supertest(app).get('/api/posts');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('DB error');
    });
  });

  // ---- GET /api/posts/:pid ----

  describe('GET /api/posts/:pid', () => {
    it('returns 200 with the post', async () => {
      getPostByIdSpy.mockResolvedValueOnce(mockPopulatedPost1);

      const response = await supertest(app)
        .get(`/api/posts/${mockPopulatedPost1._id}`);

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Getting Started with TypeScript');
    });

    it('returns 404 if post not found', async () => {
      getPostByIdSpy.mockRejectedValueOnce(new Error('Post not found'));

      const response = await supertest(app).get('/api/posts/nonexistentid');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Post not found');
    });
  });

  // ---- POST /api/posts ----

  describe('POST /api/posts', () => {
    const newPostBody = {
      title: 'New Post',
      content: 'Some content here',
      tags: ['test'],
      status: 'PUBLISHED',
    };

    it('returns 201 with created post', async () => {
      createPostSpy.mockResolvedValueOnce(mockPopulatedPost1);

      const response = await supertest(app)
        .post('/api/posts')
        .send(newPostBody);

      expect(response.status).toBe(201);
      expect(createPostSpy).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'New Post', author: 'alice' })
      );
    });

    it('returns 400 if service throws', async () => {
      createPostSpy.mockRejectedValueOnce(new Error('Validation failed'));

      const response = await supertest(app).post('/api/posts').send(newPostBody);

      expect(response.status).toBe(400);
    });
  });

  // ---- PATCH /api/posts/:pid ----

  describe('PATCH /api/posts/:pid', () => {
    it('returns 200 with updated post', async () => {
      const updated = { ...mockPopulatedPost1, title: 'Updated Title' };
      updatePostSpy.mockResolvedValueOnce(updated);

      const response = await supertest(app)
        .patch(`/api/posts/${mockPopulatedPost1._id}`)
        .send({ title: 'Updated Title' });

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Updated Title');
    });
  });

  // ---- PUT /api/posts/:pid/like ----

  describe('PUT /api/posts/:pid/like', () => {
    it('returns 200 with like count and liked status', async () => {
      likePostSpy.mockResolvedValueOnce({ likes: 2, liked: true });

      const response = await supertest(app)
        .put(`/api/posts/${mockPopulatedPost1._id}/like`)
        .send({ username: 'alice' });

      expect(response.status).toBe(200);
      expect(response.body.likes).toBe(2);
      expect(response.body.liked).toBe(true);
    });

    it('returns 200 with liked: false when unliking', async () => {
      likePostSpy.mockResolvedValueOnce({ likes: 0, liked: false });

      const response = await supertest(app)
        .put(`/api/posts/${mockPopulatedPost2._id}/like`)
        .send({ username: 'alice' });

      expect(response.status).toBe(200);
      expect(response.body.liked).toBe(false);
    });
  });

  // ---- DELETE /api/posts/:pid ----

  describe('DELETE /api/posts/:pid', () => {
    it('returns 204 on successful delete', async () => {
      deletePostSpy.mockResolvedValueOnce(undefined);

      const response = await supertest(app)
        .delete(`/api/posts/${mockPopulatedPost1._id}`);

      expect(response.status).toBe(204);
      expect(deletePostSpy).toHaveBeenCalledWith(String(mockPopulatedPost1._id));
    });
  });
});
