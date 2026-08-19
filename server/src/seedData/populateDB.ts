import bcrypt from 'bcrypt';
import { connectDB, disconnectDB } from '../utils/database.util';
import UserModel from '../models/user.model';
import PostModel from '../models/post.model';

// Run: npm run seed
// Seeds the DB with a small dataset for local development and testing.
// Uses bcrypt so passwords match real login flows.

const seed = async () => {
  await connectDB();
  console.log('Connected — seeding database...');

  await UserModel.deleteMany({});
  await PostModel.deleteMany({});

  const password = await bcrypt.hash('password123', 10);

  const users = await UserModel.insertMany([
    {
      username: 'admin', email: 'admin@example.com', password,
      role: 'ADMIN', status: 'ACTIVE', theme: 'LIGHT', bio: 'Admin user',
      createdAt: new Date(), lastSeen: new Date(),
    },
    {
      username: 'alice', email: 'alice@example.com', password,
      role: 'USER', status: 'ACTIVE', theme: 'DARK', bio: 'Hello, I am Alice',
      createdAt: new Date(), lastSeen: new Date(),
    },
    {
      username: 'bob', email: 'bob@example.com', password,
      role: 'USER', status: 'INACTIVE', theme: 'SYSTEM', bio: '',
      createdAt: new Date(), lastSeen: new Date(Date.now() - 10 * 60_000),
    },
  ]);

  const [admin, alice] = users;

  await PostModel.insertMany([
    {
      title: 'Getting Started with TypeScript',
      content: 'TypeScript adds optional static typing to JavaScript. It helps catch bugs early and improves IDE support. Start by adding a tsconfig.json to your project and gradually annotating your functions.',
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
      content: 'Express is a minimal and flexible Node.js web framework. In this guide we cover defining routes, applying middleware for auth and logging, structuring controllers and services, and returning consistent JSON responses.',
      tags: ['node', 'express', 'api', 'backend'],
      status: 'PUBLISHED',
      author: admin._id,
      likes: [],
      views: 19,
      comments: [],
      createdAt: new Date(Date.now() - 86_400_000),
      updatedAt: new Date(Date.now() - 86_400_000),
    },
    {
      title: 'Draft: React Patterns in 2025',
      content: 'Work in progress — exploring hooks, context, and server components.',
      tags: ['react', 'frontend'],
      status: 'DRAFT',
      author: alice._id,
      likes: [],
      views: 0,
      comments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  console.log('Database seeded successfully.');
  await disconnectDB();
};

seed().catch(err => { console.error(err); process.exit(1); });
