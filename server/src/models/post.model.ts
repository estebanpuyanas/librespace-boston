import mongoose, { Model } from 'mongoose';
import { DatabasePost } from 'shared/types/post';
import postSchema from './schema/post.schema';

const PostModel: Model<DatabasePost> = mongoose.model<DatabasePost>('Post', postSchema);

export default PostModel;
