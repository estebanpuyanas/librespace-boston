import express, { Response } from "express";
import { loginUser, registerUser } from "../services/auth.service";
import { LoginRequest, RegisterRequest } from "shared/types/user";

// Controllers handle only HTTP concerns: parse request, call service, return response.
// Business logic lives entirely in the service layer.

const authController = () => {
  const router = express.Router();

  router.post("/login", async (req: LoginRequest, res: Response) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        res.status(400).json({ error: "Username and password required" });
        return;
      }
      const result = await loginUser(username, password);
      res.status(200).json(result);
    } catch (e) {
      res.status(401).json({ error: (e as Error).message });
    }
  });

  router.post(
    "/register",
    async (
      req: RegisterRequest & { body: { email?: string } },
      res: Response,
    ) => {
      try {
        const { username, password, email } = req.body;
        if (!username || !password || !email) {
          res.status(400).json({ error: "All fields required" });
          return;
        }
        const result = await registerUser(username, email, password);
        res.status(201).json(result);
      } catch (e) {
        res.status(400).json({ error: (e as Error).message });
      }
    },
  );

  // Stateless JWT — client deletes the token. Optionally add server-side blacklist via Redis.
  router.post("/logout", (_req, res: Response) => {
    res.status(200).json({ message: "Logged out" });
  });

  return router;
};

export default authController;
