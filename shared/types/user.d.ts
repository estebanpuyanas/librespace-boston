import { ObjectId } from 'mongodb';
import { Request } from 'express';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'AWAY' | 'HIDDEN';
export type UserTheme = 'LIGHT' | 'DARK' | 'SYSTEM';
export type UserRole = 'USER' | 'ADMIN' | 'MODERATOR';

export interface UserCredentials {
  username: string;
  password: string;
}

// Base domain type — no DB concerns
export interface User {
  username: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  theme: UserTheme;
  bio: string;
  avatar?: string;
  createdAt: Date;
  lastSeen: Date;
}

// Stored in DB — includes _id and hashed password
export interface DatabaseUser extends User {
  _id: ObjectId;
  password: string;
}

// Safe to send to clients — password omitted
export type SafeDatabaseUser = Omit<DatabaseUser, 'password'>;

// ---- Request Types ----

export interface LoginRequest extends Request {
  body: UserCredentials;
}

export interface RegisterRequest extends Request {
  body: UserCredentials & { email: string };
}

export interface UpdateProfileRequest extends Request {
  body: Partial<Pick<User, 'bio' | 'avatar' | 'theme' | 'status'>>;
  params: { username: string };
}

// ---- Response Types ----

export type LoginResponse = { token: string; user: SafeDatabaseUser } | { error: string };
export type UserResponse = SafeDatabaseUser | { error: string };
export type UserListResponse = SafeDatabaseUser[] | { error: string };
