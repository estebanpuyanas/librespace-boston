import express, { Request, Response } from "express";
import { Server } from "socket.io";
import {
  getPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  likePost,
} from "../services/post.service";
import {
  GetPostsRequest,
  GetPostByIdRequest,
  CreatePostRequest,
  LikePostRequest,
  UpdatePostRequest,
} from "shared/types/post";
import {
  ServerToClientEvents,
  ClientToServerEvents,
} from "shared/types/socket";

type AppSocket = Server<ClientToServerEvents, ServerToClientEvents>;

// socket is optional so this controller can also be unit-tested without a live socket
const postController = (socket?: AppSocket) => {
  const router = express.Router();

  router.get("/", async (req: GetPostsRequest, res: Response) => {
    try {
      const {
        order = "newest",
        search = "",
        tag = "",
        page = "1",
        limit = "20",
      } = req.query;
      const posts = await getPosts(
        order,
        search,
        tag,
        parseInt(page),
        parseInt(limit),
      );
      res.status(200).json(posts);
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  router.get("/:pid", async (req: GetPostByIdRequest, res: Response) => {
    try {
      const post = await getPostById(req.params.pid);
      res.status(200).json(post);
    } catch (e) {
      res.status(404).json({ error: (e as Error).message });
    }
  });

  router.post("/", async (req: CreatePostRequest, res: Response) => {
    try {
      const username = (req as Request & { username?: string }).username;
      if (!username) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const post = await createPost({ ...req.body, author: username });
      socket?.emit("postCreated", { post });
      res.status(201).json(post);
    } catch (e) {
      res.status(400).json({ error: (e as Error).message });
    }
  });

  router.patch("/:pid", async (req: UpdatePostRequest, res: Response) => {
    try {
      const post = await updatePost(req.params.pid, req.body);
      socket?.emit("postUpdated", { post });
      res.status(200).json(post);
    } catch (e) {
      res.status(400).json({ error: (e as Error).message });
    }
  });

  router.put("/:pid/like", async (req: LikePostRequest, res: Response) => {
    try {
      const result = await likePost(req.params.pid, req.body.username);
      // Emit only to sockets subscribed to this specific post room
      socket?.to(`post:${req.params.pid}`).emit("likeUpdated", {
        postId: req.params.pid,
        likes: result.likes,
        likedBy: req.body.username,
      });
      res.status(200).json(result);
    } catch (e) {
      res.status(400).json({ error: (e as Error).message });
    }
  });

  router.delete("/:pid", async (req: Request, res: Response) => {
    try {
      await deletePost(req.params.pid);
      socket?.emit("postDeleted", { postId: req.params.pid });
      res.status(204).send();
    } catch (e) {
      res.status(400).json({ error: (e as Error).message });
    }
  });

  return router;
};

export default postController;
