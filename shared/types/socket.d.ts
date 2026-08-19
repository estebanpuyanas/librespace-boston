import { PopulatedDatabasePost, PopulatedComment } from './post';

// ---- Event Payloads ----

export interface PostUpdatePayload {
  post: PopulatedDatabasePost;
}

export interface CommentUpdatePayload {
  postId: string;
  comment: PopulatedComment;
}

export interface LikeUpdatePayload {
  postId: string;
  likes: number;
  likedBy: string;
}

export interface UserStatusPayload {
  username: string;
  status: 'ACTIVE' | 'INACTIVE' | 'AWAY' | 'HIDDEN';
  timestamp: Date;
}

export interface NotificationPayload {
  type: 'like' | 'comment' | 'mention' | 'system';
  message: string;
  targetUser: string;
  data?: Record<string, unknown>;
}

// ---- Socket Event Maps ----
// Typed as Socket<ServerToClientEvents, ClientToServerEvents> on the client,
// and Server<ClientToServerEvents, ServerToClientEvents> on the server.

export interface ClientToServerEvents {
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  subscribeToPost: (postId: string) => void;
  unsubscribeFromPost: (postId: string) => void;
}

export interface ServerToClientEvents {
  postCreated: (payload: PostUpdatePayload) => void;
  postUpdated: (payload: PostUpdatePayload) => void;
  postDeleted: (payload: { postId: string }) => void;
  commentAdded: (payload: CommentUpdatePayload) => void;
  likeUpdated: (payload: LikeUpdatePayload) => void;
  statusChanged: (payload: UserStatusPayload) => void;
  notification: (payload: NotificationPayload) => void;
}
