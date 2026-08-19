// One-off backfill script — run after a schema migration to fill in new fields
// on existing documents.
//
// Run: npm run backfill
//
// Example: ensure every Post document has the `views` field initialized to 0.

import { connectDB, disconnectDB } from '../utils/database.util';
import PostModel from '../models/post.model';

const backfill = async () => {
  await connectDB();
  console.log('Starting backfill...');

  const result = await PostModel.updateMany(
    { views: { $exists: false } },
    { $set: { views: 0 } }
  );

  console.log(`Backfilled ${result.modifiedCount} posts.`);
  await disconnectDB();
};

backfill().catch(err => { console.error(err); process.exit(1); });
