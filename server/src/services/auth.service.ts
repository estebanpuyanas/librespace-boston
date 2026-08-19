import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import UserModel from '../models/user.model';
import { DatabaseUser, SafeDatabaseUser } from 'shared/types/user';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret';
const SALT_ROUNDS = 10;

const toSafe = (user: DatabaseUser & { password: string }): SafeDatabaseUser => {
  const { password: _pw, ...safe } = user;
  return safe as SafeDatabaseUser;
};

export const loginUser = async (
  username: string,
  password: string
): Promise<{ token: string; user: SafeDatabaseUser }> => {
  const user = await UserModel.findOne({ username }).lean<DatabaseUser & { password: string }>();
  if (!user) throw new Error('Invalid credentials');

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new Error('Invalid credentials');

  const token = jwt.sign(
    { username: user.username, id: String(user._id), role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  return { token, user: toSafe(user) };
};

export const registerUser = async (
  username: string,
  email: string,
  password: string
): Promise<{ token: string; user: SafeDatabaseUser }> => {
  const exists = await UserModel.findOne({ $or: [{ username }, { email }] });
  if (exists) throw new Error('Username or email already in use');

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const doc = await UserModel.create({
    username, email, password: hashed,
    role: 'USER', status: 'ACTIVE', theme: 'LIGHT', bio: '',
    createdAt: new Date(), lastSeen: new Date(),
  });

  const token = jwt.sign(
    { username, id: String(doc._id), role: 'USER' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  return { token, user: toSafe(doc.toObject() as DatabaseUser & { password: string }) };
};
