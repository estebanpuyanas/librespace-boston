// Central mock-data store — import from here in all spec files.
// Keeps IDs stable across tests and makes relationships explicit.

import { ObjectId } from 'mongodb';
import { DatabaseUser, SafeDatabaseUser } from 'shared/types/user';
import { DatabasePost, PopulatedDatabasePost } from 'shared/types/post';

// ---- Users ----

export const mockUser1 = {
  _id: new ObjectId('507f191e810c19729de860aa'),
  username: 'alice',
  email: 'alice@example.com',
  password: '$2b$10$mockhashfortest',
  role: 'USER',
  status: 'ACTIVE',
  theme: 'LIGHT',
  bio: 'Hello I am Alice',
  createdAt: new Date('2024-01-01'),
  lastSeen: new Date('2024-01-15'),
} as DatabaseUser & { password: string };

export const mockUser2 = {
  _id: new ObjectId('507f191e810c19729de860bb'),
  username: 'bob',
  email: 'bob@example.com',
  password: '$2b$10$mockhashfortest',
  role: 'USER',
  status: 'INACTIVE',
  theme: 'DARK',
  bio: '',
  createdAt: new Date('2024-01-02'),
  lastSeen: new Date('2024-01-10'),
} as DatabaseUser & { password: string };

export const mockAdmin = {
  _id: new ObjectId('507f191e810c19729de860cc'),
  username: 'admin',
  email: 'admin@example.com',
  password: '$2b$10$mockhashfortest',
  role: 'ADMIN',
  status: 'ACTIVE',
  theme: 'SYSTEM',
  bio: 'Admin user',
  createdAt: new Date('2023-12-01'),
  lastSeen: new Date('2024-01-15'),
} as DatabaseUser & { password: string };

// Safe versions — no password field, matches what API responses return
export const mockSafeUser1: SafeDatabaseUser = (() => {
  const { password: _pw, ...safe } = mockUser1;
  return safe as SafeDatabaseUser;
})();

export const mockSafeAdmin: SafeDatabaseUser = (() => {
  const { password: _pw, ...safe } = mockAdmin;
  return safe as SafeDatabaseUser;
})();

export const USERS: Array<DatabaseUser & { password: string }> = [mockUser1, mockUser2, mockAdmin];

// ---- Posts ----

export const mockPost1: DatabasePost = {
  _id: new ObjectId('65e9b58910afe6e94fc6e601'),
  title: 'Getting Started with TypeScript',
  content: 'TypeScript adds optional static typing to JavaScript. Start by adding a tsconfig.json to your project.',
  tags: ['typescript', 'javascript'],
  status: 'PUBLISHED',
  author: mockUser1._id,
  likes: ['admin'],
  views: 42,
  comments: [],
  createdAt: new Date('2024-01-10'),
  updatedAt: new Date('2024-01-10'),
};

export const mockPost2: DatabasePost = {
  _id: new ObjectId('65e9b58910afe6e94fc6e602'),
  title: 'Building REST APIs with Express',
  content: 'Express is minimal and flexible. Routes, middleware, and error handling explained.',
  tags: ['node', 'express', 'api'],
  status: 'PUBLISHED',
  author: mockAdmin._id,
  likes: [],
  views: 19,
  comments: [],
  createdAt: new Date('2024-01-09'),
  updatedAt: new Date('2024-01-09'),
};

export const mockDraftPost: DatabasePost = {
  _id: new ObjectId('65e9b58910afe6e94fc6e603'),
  title: 'Draft: React Patterns',
  content: 'Work in progress.',
  tags: ['react'],
  status: 'DRAFT',
  author: mockUser1._id,
  likes: [],
  views: 0,
  comments: [],
  createdAt: new Date('2024-01-11'),
  updatedAt: new Date('2024-01-11'),
};

// Populated versions — author is a full SafeDatabaseUser object, not an ObjectId
export const mockPopulatedPost1: PopulatedDatabasePost = {
  ...mockPost1,
  author: mockSafeUser1,
  comments: [],
};

export const mockPopulatedPost2: PopulatedDatabasePost = {
  ...mockPost2,
  author: mockSafeAdmin,
  comments: [],
};

export const POSTS: DatabasePost[] = [mockPost1, mockPost2, mockDraftPost];
export const POPULATED_POSTS: PopulatedDatabasePost[] = [mockPopulatedPost1, mockPopulatedPost2];
