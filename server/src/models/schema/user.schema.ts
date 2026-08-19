import { Schema } from 'mongoose';
import { DatabaseUser } from 'shared/types/user';

const userSchema = new Schema<DatabaseUser>({
  username:  { type: String, required: true, unique: true, immutable: true, trim: true },
  email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:  { type: String, required: true },
  role:      { type: String, enum: ['USER', 'ADMIN', 'MODERATOR'], default: 'USER' },
  status:    { type: String, enum: ['ACTIVE', 'INACTIVE', 'AWAY', 'HIDDEN'], default: 'HIDDEN' },
  theme:     { type: String, enum: ['LIGHT', 'DARK', 'SYSTEM'], default: 'LIGHT' },
  bio:       { type: String, default: '' },
  avatar:    { type: String },
  createdAt: { type: Date, default: Date.now },
  lastSeen:  { type: Date, default: Date.now },
});

userSchema.index({ username: 1 });
userSchema.index({ email: 1 });

export default userSchema;
