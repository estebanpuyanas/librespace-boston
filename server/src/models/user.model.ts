import mongoose, { Model } from 'mongoose';
import { DatabaseUser } from 'shared/types/user';
import userSchema from './schema/user.schema';

const UserModel: Model<DatabaseUser> = mongoose.model<DatabaseUser>('User', userSchema);

export default UserModel;
