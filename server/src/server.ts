import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app';
import { ServerToClientEvents, ClientToServerEvents } from 'shared/types/socket';
import { connectDB } from './utils/database.util';
import { startStatusUpdateJob } from './jobs/statusUpdater.job';

const PORT = process.env.PORT ?? 8000;

const httpServer = createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL ?? 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', socket => {
  socket.on('joinRoom', roomId => socket.join(roomId));
  socket.on('leaveRoom', roomId => socket.leave(roomId));
  socket.on('subscribeToPost', postId => socket.join(`post:${postId}`));
  socket.on('unsubscribeFromPost', postId => socket.leave(`post:${postId}`));
  socket.on('disconnect', () => {});
});

connectDB().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    const stopJob = startStatusUpdateJob(io);
    process.on('SIGTERM', stopJob);
  });
});
