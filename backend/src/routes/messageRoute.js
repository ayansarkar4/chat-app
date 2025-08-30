import { Router } from "express";

import {
  getUsersForSidebar,
  getMessages,
  markMessageAsSeen,
  sendMessage,
} from "../controllers/MessageController.js";
import authUser from "../middlewares/auth.js";

const router = Router();
router.get("/users", authUser, getUsersForSidebar);
router.get("/:id", authUser, getMessages);
router.put("/mark/:id", authUser, markMessageAsSeen);
router.post("/send/:id", authUser, sendMessage);

export default router;
