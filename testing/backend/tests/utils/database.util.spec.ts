import mongoose from 'mongoose';
import { connectDB, disconnectDB, populateDocument } from '@server/utils/database.util';

describe('connectDB', () => {
  it('does not reconnect if already connected', async () => {
    const connectSpy = jest.spyOn(mongoose, 'connect').mockResolvedValue(mongoose);
    jest.spyOn(mongoose.connection, 'readyState', 'get').mockReturnValue(1);

    await connectDB();

    expect(connectSpy).not.toHaveBeenCalled();
  });

  it('calls mongoose.connect when not yet connected', async () => {
    const connectSpy = jest.spyOn(mongoose, 'connect').mockResolvedValue(mongoose);
    jest.spyOn(mongoose.connection, 'readyState', 'get').mockReturnValue(0);

    await connectDB();

    expect(connectSpy).toHaveBeenCalled();
  });
});

describe('disconnectDB', () => {
  it('calls mongoose.disconnect', async () => {
    const disconnectSpy = jest.spyOn(mongoose, 'disconnect').mockResolvedValue();

    await disconnectDB();

    expect(disconnectSpy).toHaveBeenCalled();
  });
});

describe('populateDocument', () => {
  it('calls populate once per field and returns the document', async () => {
    const mockDoc = {
      populate: jest.fn().mockImplementation(function(this: unknown) { return this; }),
    } as unknown as mongoose.Document;

    const result = await populateDocument(mockDoc, ['author', 'comments']);

    expect(mockDoc.populate).toHaveBeenCalledTimes(2);
    expect(mockDoc.populate).toHaveBeenCalledWith('author');
    expect(mockDoc.populate).toHaveBeenCalledWith('comments');
    expect(result).toBe(mockDoc);
  });

  it('returns the document unchanged when fields array is empty', async () => {
    const mockDoc = {
      populate: jest.fn(),
    } as unknown as mongoose.Document;

    const result = await populateDocument(mockDoc, []);

    expect(mockDoc.populate).not.toHaveBeenCalled();
    expect(result).toBe(mockDoc);
  });
});
