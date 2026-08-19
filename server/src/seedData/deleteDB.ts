import { connectDB, disconnectDB } from '../utils/database.util';
import UserModel from '../models/user.model';
import PostModel from '../models/post.model';

// Run: npm run seed:delete
// Clears all documents — useful before re-seeding or resetting test state.

const clean = async () => {
  await connectDB();
  console.log('Connected — clearing database...');
  await Promise.all([
    UserModel.deleteMany({}),
    PostModel.deleteMany({}),
  ]);
  console.log('Database cleared.');
  await disconnectDB();
};

clean().catch(err => { console.error(err); process.exit(1); });
