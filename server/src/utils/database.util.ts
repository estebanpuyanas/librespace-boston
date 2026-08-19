import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/webapp';

export const connectDB = async (): Promise<void> => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(MONGODB_URI);
  console.log(`MongoDB connected: ${MONGODB_URI}`);
};

export const disconnectDB = async (): Promise<void> => {
  await mongoose.disconnect();
};

// Sequentially populate nested fields that a single .populate() chain can't handle.
// Useful for deeply nested relations or conditional population paths.
export const populateDocument = async <T extends mongoose.Document>(
  doc: T,
  fields: string[]
): Promise<T> => {
  let result = doc;
  for (const field of fields) {
    result = await result.populate(field);
  }
  return result;
};
