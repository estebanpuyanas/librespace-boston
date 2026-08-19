import { Schema } from 'mongoose';
import { DatabasePost } from 'shared/types/post';

const postSchema = new Schema<DatabasePost>({
  title:   { type: String, required: true, trim: true, maxlength: 200 },
  content: { type: String, required: true },
  tags:    [{ type: String, trim: true, lowercase: true }],
  status:  { type: String, enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'], default: 'DRAFT' },
  author:  { type: Schema.Types.ObjectId, ref: 'User', required: true },
  likes:   [{ type: String }],
  views:   { type: Number, default: 0 },
  comments:[{ type: Schema.Types.ObjectId, ref: 'Comment' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

postSchema.index({ status: 1, createdAt: -1 });
postSchema.index({ tags: 1 });
// Text index enables full-text search via $text operator
postSchema.index({ title: 'text', content: 'text' });

export default postSchema;
