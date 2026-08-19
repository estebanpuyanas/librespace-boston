import { createContext } from 'react';
import type { Socket } from 'socket.io-client';
import { SafeDatabaseUser } from 'shared/types/user';
import { ServerToClientEvents, ClientToServerEvents } from 'shared/types/socket';

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export interface UserContextType {
  user: SafeDatabaseUser;
  socket: AppSocket;
}

const UserContext = createContext<UserContextType | null>(null);

export default UserContext;
