import express, { Response } from 'express';
import bcrypt from 'bcrypt';
import UserModel from '../models/user.model';
import PostModel from '../models/post.model';

// Mounted ONLY when NODE_ENV === 'test' (see app.ts).
// Provides deterministic DB state for Cypress E2E test runs.
// Never expose these endpoints in production.

const testController = () => {
  const router = express.Router();

  // Reset DB to a known seed state — call in beforeEach
  router.post('/seed', async (_req, res: Response) => {
    try {
      await UserModel.deleteMany({});
      await PostModel.deleteMany({});

      const password = await bcrypt.hash('password123', 10);

      const users = await UserModel.insertMany([
        {
          username: 'alice', email: 'alice@example.com', password,
          role: 'USER', status: 'ACTIVE', theme: 'LIGHT', bio: 'Hello I am Alice',
          createdAt: new Date(), lastSeen: new Date(),
        },
        {
          username: 'bob', email: 'bob@example.com', password,
          role: 'USER', status: 'INACTIVE', theme: 'DARK', bio: '',
          createdAt: new Date(), lastSeen: new Date(Date.now() - 10 * 60_000),
        },
        {
          username: 'admin', email: 'admin@example.com', password,
          role: 'ADMIN', status: 'ACTIVE', theme: 'LIGHT', bio: 'Admin user',
          createdAt: new Date(), lastSeen: new Date(),
        },
      ]);

      const [alice, , admin] = users;

      await PostModel.insertMany([
        {
          title: 'Getting Started with TypeScript',
          content: 'TypeScript adds optional static typing to JavaScript. Start by adding a tsconfig.json to your project and gradually annotating your functions.',
          tags: ['typescript', 'javascript', 'tutorial'],
          status: 'PUBLISHED',
          author: alice._id,
          likes: ['admin'],
          views: 42,
          comments: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          title: 'Building REST APIs with Express',
          content: 'Express is minimal and flexible. Routes, middleware, and error handling explained.',
          tags: ['node', 'express', 'api'],
          status: 'PUBLISHED',
          author: admin._id,
          likes: [],
          views: 19,
          comments: [],
          createdAt: new Date(Date.now() - 86_400_000),
          updatedAt: new Date(Date.now() - 86_400_000),
        },
      ]);

      res.status(200).json({ message: 'Database seeded' });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  // Wipe all documents — call in afterEach if you prefer clean teardown over reset
  router.post('/cleanup', async (_req, res: Response) => {
    try {
      await Promise.all([
        UserModel.deleteMany({}),
        PostModel.deleteMany({}),
      ]);
      res.status(200).json({ message: 'Database cleared' });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  return router;
};

export default testController;
