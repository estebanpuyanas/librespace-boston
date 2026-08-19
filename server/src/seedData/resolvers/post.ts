import { Types } from 'mongoose';

interface RawPost {
  title: string;
  content: string;
  tags: string[];
  status: string;
  authorUsername: string;
  likes: string[];
}

type SeededUser = { _id: Types.ObjectId; username: string };

// Resolves the string `authorUsername` field → the ObjectId of the already-inserted user.
// context.users is populated by populateDB.ts before posts are inserted.
export const resolvePost = (
  raw: RawPost,
  context: { users: SeededUser[] }
) => ({
  title:     raw.title,
  content:   raw.content,
  tags:      raw.tags,
  status:    raw.status,
  author:    context.users.find(u => u.username === raw.authorUsername)?._id,
  likes:     raw.likes,
  views:     0,
  comments:  [],
  createdAt: new Date(),
  updatedAt: new Date(),
});
