import { create } from "zustand";

export const useChatStore = create((set) => ({

  chats: [],
  messages: [],
  currentChat: null,

  setChats: (chats) =>
    set((state) => {
      const next = typeof chats === "function" ? chats(state.chats) : chats;
      return { chats: Array.isArray(next) ? next : [] };
    }),

  setMessages: (messages) =>
    set((state) => {
      const next = typeof messages === "function" ? messages(state.messages) : messages;
      return { messages: Array.isArray(next) ? next : [] };
    }),

  setCurrentChat: (chat) =>
    set({
      currentChat: chat
    })

}));