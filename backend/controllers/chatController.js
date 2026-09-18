import mongoose from "mongoose";

import Chat from "../models/Chat.js";
import Message from "../models/Message.js";

import { buildPrompt } from "../utils/promptBuilder.js";
import { callLLM } from "../services/llmService.js";

// ============================
// CREATE CHAT
// ============================
export async function createChat(req, res) {
  try {
    const { courseId, title } = req.body;
    const userId = req.userId;

    let validCourseId = null;

    if (courseId && mongoose.Types.ObjectId.isValid(courseId)) {
      validCourseId = courseId;
    }

    const chat = await Chat.create({
      userId,
      courseId: validCourseId,
      title: title || "New Chat",
      mode: "normal"
    });

    res.json({
      success: true,
      chatId: chat._id
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: err.message
    });

  }
}


// ============================
// SEND MESSAGE
// ============================
export async function sendMessage(req, res) {

  try {

    const { chatId, message, mode } = req.body;
    const cleanMessage = typeof message === "string" ? message.trim() : "";

    if (!chatId || !cleanMessage) {
      return res.status(400).json({ error: "chatId and message are required" });
    }

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ error: "Invalid chatId" });
    }

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    if (chat.userId.toString() !== req.userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const activeMode = mode || chat.mode || "normal";

    // update chat mode if user switched mode
    if (mode && mode !== chat.mode) {
      chat.mode = mode;
      await chat.save();
    }


    // ============================
    // SAVE USER MESSAGE
    // ============================

    await Message.create({
      chatId,
      role: "user",
      content: cleanMessage,
      mode: activeMode
    });


    // ============================
    // AUTO TITLE GENERATION
    // ============================

    const messageCount = await Message.countDocuments({ chatId });

    if (messageCount === 1) {

      try {

        const titlePrompt =
          `Generate a short 3-4 word title for this student query. Return ONLY the title. Query: "${cleanMessage}"`;

        const titleResult = await callLLM(titlePrompt);

        const title =
          typeof titleResult === "string"
            ? titleResult
            : titleResult?.content || "New Chat";

        await Chat.findByIdAndUpdate(chatId, {
          title: title.replace(/[\"'`]/g, "")
        });

      } catch (err) {
        console.error("Title generation failed", err.message);
      }

    }


    // ============================
    // BUILD FULL CONVERSATION CONTEXT
    // ============================

    const conversationMessages = await Message.find({ chatId })
      .sort({ createdAt: 1 });

    const conversationContext = conversationMessages
      .map(m => {
        const text =
          typeof m.content === "string"
            ? m.content
            : JSON.stringify(m.content || "");
        return `${m.role}: ${text}`;
      })
      .join("\n");


    // ============================
    // BUILD PROMPT
    // ============================

    const { prompt, citations } = await buildPrompt(
      chat,
      cleanMessage,
      chatId,
      activeMode,
      conversationContext
    );


    // ============================
    // CALL LLM
    // ============================

    const aiResponse = await callLLM(prompt);


    // ============================
    // NORMALIZE RESPONSE
    // ============================

    let aiContent = "";

    if (typeof aiResponse === "string") {
      aiContent = aiResponse;
    }
    else if (aiResponse?.content) {
      aiContent = aiResponse.content;
    }
    else if (aiResponse?.question) {
      aiContent = aiResponse.question;
    }
    else {
      aiContent = JSON.stringify(aiResponse);
    }


    // ============================
    // SAVE AI MESSAGE
    // ============================

    await Message.create({
      chatId,
      role: "assistant",
      content: aiContent,
      data: aiResponse,
      mode: activeMode,
      citations: citations || [],
      metadata: {
        contextSnapshot: conversationContext,
        responseType: aiResponse?.type || "text"
      }
    });


    res.json({
      success: true,
      response: aiResponse,
      text: aiContent,
      citations: citations || [],
      mode: activeMode
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: err.message
    });

  }

}


// ============================
// GET MESSAGES
// ============================
export async function getMessages(req, res) {

  try {

    const { chatId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ error: "Invalid chatId" });
    }

    const messages = await Message.find({ chatId })
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      messages
    });

  } catch (err) {

    res.status(500).json({ error: err.message });

  }

}


// ============================
// GET USER CHATS
// ============================
export async function getUserChats(req, res) {

  try {

    const userId = req.userId;

    const chats = await Chat.find({ userId })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      chats
    });

  } catch (err) {

    res.status(500).json({ error: err.message });

  }

}


// ============================
// DELETE CHAT
// ============================
export async function deleteChat(req, res) {

  try {

    const { chatId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ error: "Invalid chatId" });
    }

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    if (chat.userId.toString() !== req.userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await Chat.deleteOne({ _id: chatId });

    await Message.deleteMany({ chatId });

    res.json({ success: true });

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }

}
