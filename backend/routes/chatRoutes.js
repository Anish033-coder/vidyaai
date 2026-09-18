import express from "express";
import auth from "../middleware/authMiddleware.js";
import {
  createChat,
  sendMessage,
  getMessages,
  getUserChats,
  deleteChat
} from "../controllers/chatController.js";

const router = express.Router();

router.post("/create", auth,createChat);

router.post("/message", auth,sendMessage);

router.get("/my", auth, getUserChats);

router.get("/:chatId/messages",auth, getMessages);
router.delete("/:chatId", auth, deleteChat);
export default router;