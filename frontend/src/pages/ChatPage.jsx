import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import ChatInput from "../components/ChatInput";
import MCQPanel from "../components/modes/MCQPanel";
import InterviewPanel from "../components/modes/InterviewPanel";
import PaperPanel from "../components/modes/PaperPanel";
import Citations from "../components/Citations";
import EmptyState from "../components/EmptyState";
import ReactMarkdown from "react-markdown";
import { useChatStore } from "../store/chatStore";
import {
  getUserChats,
  getMessages,
  sendMessage,
  createChat,
  deleteChat
} from "../api/api";

export default function ChatPage() {
  const navigate = useNavigate();
  const { chatId } = useParams();

  const API =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:5002";

  // pull from zustand (assumes hook returns these functions & values)
  const { chats, setChats, messages, setMessages, setCurrentChat } = useChatStore();

  const scrollRef = useRef(null);
  const [isSending, setIsSending] = useState(false);

  const chatsArray = Array.isArray(chats) ? chats : [];
  const safeMessages = Array.isArray(messages) ? messages : [];

  function scrollToBottom() {
    if (!scrollRef.current) return;
    try {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    } catch (e) {
      // harmless fallback
      // console.debug("scroll error", e);
    }
  }

  // ---------- Debug helper ----------
  useEffect(() => {
    console.debug("[ChatPage] mount, chatId:", chatId);
    return () => {
      console.debug("[ChatPage] unmount");
    };
  }, []);

  // =========================
  // LOAD USER CHATS (once)
  // =========================
  useEffect(() => {
    let mounted = true;
    async function loadChats() {
      try {
        const data = await getUserChats();
        if (!mounted) return;
        setChats(Array.isArray(data?.chats) ? data.chats : []);
        console.debug("[loadChats] loaded", (data?.chats || []).length);
      } catch (err) {
        console.error("loadChats error", err);
      }
    }
    loadChats();
    return () => {
      mounted = false;
    };
  }, [setChats]);

  // =========================
  // LOAD MESSAGES (when chatId or chats update)
  // =========================
  useEffect(() => {
    let mounted = true;
    console.debug("[loadMessages effect] chatId:", chatId, "isSending:", isSending);

    if (!chatId) {
      // keep UI stable: set messages to [] but avoid crashing store updates
      try { setMessages([]); } catch (e) { console.error("safe setMessages [] failed", e); }
      setCurrentChat(null);
      return;
    }

    // If sending, we still want to try to load messages because we may have new chat or server state
    async function loadMessages() {
      try {
        const chatObj = chatsArray.find((c) => c._id === chatId);
        if (chatObj) setCurrentChat(chatObj);

        const data = await getMessages(chatId);
        if (!mounted) return;

        setMessages(Array.isArray(data?.messages) ? data.messages : []);
        console.debug("[loadMessages] messages loaded:", (data?.messages || []).length);
        setTimeout(scrollToBottom, 60);
      } catch (err) {
        console.error("loadMessages error", err);
      }
    }

    loadMessages();

    return () => {
      mounted = false;
    };
  }, [chatId, chatsArray.length, isSending, setMessages, setCurrentChat]);

  // =========================
  // SEND MESSAGE (robust)
  // =========================
  async function handleSend(text, mode = "normal") {
    if (!chatId || !text || !text.trim()) {
      console.warn("[handleSend] prevented: empty text or missing chatId", { chatId, text });
      return;
    }
    if (isSending) {
      console.warn("[handleSend] prevented: already sending");
      return;
    }

    setIsSending(true);
    const base = Date.now().toString();
    const userId = "u-" + base;
    const typingId = "t-" + base;

    const userMessage = { _id: userId, role: "user", content: text };
    const typingMessage = { _id: typingId, role: "assistant", content: "AI is thinking...", typing: true };

    // Defensive append
    try {
      setMessages((prev) => {
        const arr = Array.isArray(prev) ? [...prev] : [];
        arr.push(userMessage, typingMessage);
        return arr;
      });
    } catch (e) {
      console.error("setMessages append failed", e);
      // fallback: set safe array
      try { setMessages([userMessage, typingMessage]); } catch (e2) { console.error("fallback setMessages failed", e2); }
    }

    setTimeout(scrollToBottom, 20);

    try {
      const res = await sendMessage(chatId, text, mode);
      const aiMessage = {
        _id: typingId,
        role: "assistant",
        content: res?.text ?? res?.content ?? "",
        data: res?.response ?? null,
        citations: Array.isArray(res?.citations) ? res.citations : [],
        typing: false
      };

      // Replace typing locally first
      try {
        setMessages((prev) => {
          const arr = Array.isArray(prev) ? [...prev] : [];
          const idx = arr.findIndex((m) => m._id === typingId);
          if (idx !== -1) arr[idx] = aiMessage;
          else arr.push(aiMessage);
          return arr;
        });
      } catch (e) {
        console.error("local replace typing failed", e);
      }

      // THEN re-fetch messages from server to guarantee sync (prevents divergence)
      try {
        const fresh = await getMessages(chatId);
        setMessages(Array.isArray(fresh?.messages) ? fresh.messages : []);
        console.debug("[handleSend] re-fetched messages, count:", (fresh?.messages || []).length);
      } catch (fetchErr) {
        console.warn("[handleSend] failed to re-fetch messages, keeping local state", fetchErr);
      }

    } catch (err) {
      console.error("Send error", err);
      // Replace typing indicator with an error message robustly
      try {
        setMessages((prev) => {
          const arr = Array.isArray(prev) ? [...prev] : [];
          const idx = arr.findIndex((m) => m._id === typingId);
          const errMsg = { _id: typingId, role: "assistant", content: "⚠️ Connection lost. Try again.", typing: false };
          if (idx !== -1) arr[idx] = errMsg;
          else arr.push(errMsg);
          return arr;
        });
      } catch (e) {
        console.error("error-replace failed", e);
      }
    } finally {
      setIsSending(false);
      setTimeout(scrollToBottom, 50);
    }
  }

  // =========================
  // CREATE CHAT
  // =========================
  async function handleNewChat(courseId = null) {
    try {
      const data = await createChat(courseId);
      const newChatId = data?.chatId || data?._id || data?.chat?._id;
      if (!newChatId) {
        console.warn("createChat returned no id", data);
        return;
      }
      const newChat = { _id: newChatId, title: "New Chat", courseId };
      setChats((prev) => {
        const arr = Array.isArray(prev) ? [...prev] : [];
        return [newChat, ...arr];
      });
      // navigate to new chat
      navigate(`/chat/${newChatId}`);
      // Immediately set messages to [] for the new chat to avoid stale view
      setMessages([]);
    } catch (err) {
      console.error("Create chat failed", err);
    }
  }

  // =========================
  // DELETE CHAT
  // =========================
  async function handleDelete(id) {
    try {
      await deleteChat(id);
      setChats((prev) => {
        const arr = Array.isArray(prev) ? prev : [];
        return arr.filter((c) => c._id !== id);
      });
      if (chatId === id) {
        navigate("/chat");
        setMessages([]);
      }
    } catch (err) {
      console.error("Delete chat failed", err);
    }
  }

  // Helper: safe render of messages with try/catch
  function RenderMessages() {
    try {
      if (!Array.isArray(safeMessages) || safeMessages.length === 0) {
        return null;
      }
      return safeMessages.map((m, i) => {
        const key = m?._id ?? `msg-${i}`;
        const isGuardrail = m.data?.guardrail === true;
        const isUser = m.role === "user";
        const isPanel =
          m.data?.type === "mcq" || m.data?.type === "interview" || m.data?.type === "paper";

        // The question is set as a heading; the answer flows beneath it as body copy.
        if (isUser) {
          return (
            <div key={key} className="animate-settle pt-4 first:pt-0">
              <span className="mb-3 block h-px w-8 bg-vermillion-500" />
              <p className="font-ui text-[14.5px] font-medium leading-snug text-bone-200">
                {m.content}
              </p>
            </div>
          );
        }

        return (
          <div key={key} className="animate-settle">
            {isGuardrail && (
              <p className="mb-2.5 font-ui text-[11px] font-medium tracking-wide text-vermillion-400">
                Declined by Bedrock Guardrails
              </p>
            )}

            <div className={isGuardrail ? "border-l border-vermillion-500/40 pl-4" : ""}>
              {m.typing ? (
                <div className="flex items-center gap-3 py-1">
                  <span className="h-px w-10 animate-pulse-soft bg-vermillion-500" />
                  <span className="font-read text-[15px] italic text-bone-500">
                    reading your syllabus…
                  </span>
                </div>
              ) : m.data?.type === "mcq" ? (
                <MCQPanel data={m.data} />
              ) : m.data?.type === "interview" ? (
                <InterviewPanel data={m.data} onAnswer={(answer) => handleSend(answer, "interview")} />
              ) : m.data?.type === "paper" ? (

                  <PaperPanel
                    data={m.data}
                    onSubmit={async (answers) => {

                      try {

                        const res = await fetch(
                          `${API}/evaluate`,
                          {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                              answers
                            })
                          }
                        );

                        if(!res.ok){
                          console.error("Paper API error", res.status);
                          return null;
                        }

                        const data = await res.json();
                        return data;

                      } catch (err) {

                        console.error("Paper evaluation error", err);
                        return null;

                      }

                    }}
                  />

                ) : (
                <>
                  <div className={isGuardrail ? "reading text-[17px] italic text-bone-400" : "reading"}>
                    <ReactMarkdown>{m.content || m.text || ""}</ReactMarkdown>
                  </div>
                  <Citations citations={m.citations} />
                </>
              )}
            </div>
          </div>
        );
      });
    } catch (e) {
      console.error("RenderMessages crashed", e);
      return (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">
          Error rendering messages — check console.
        </div>
      );
    }
  }

  // Use a more tolerant condition so transient states don't hide the chat
  const isChatActive = Boolean(chatId) || safeMessages.length > 0 || isSending;

  return (
    <div className="grain relative flex h-screen overflow-hidden bg-ink-950 text-bone-50">
      <Sidebar
        chats={chatsArray}
        onSelectChat={(chat) => navigate(`/chat/${chat._id}`)}
        onNewChat={handleNewChat}
        onDeleteChat={handleDelete}
        activeChatId={chatId}
      />

      <main className="lit relative flex min-w-0 flex-1 flex-col">
        {isChatActive ? (
          <>
            <header className="flex flex-shrink-0 items-baseline gap-3 px-10 pb-2 pt-7">
              <span className="font-read text-[13px] italic text-bone-500">
                {isSending ? "thinking…" : "in session"}
              </span>
              <span className="h-px flex-1 bg-ink-850" />
              <span className="font-ui text-[10.5px] tracking-wide text-bone-600">
                Amazon Bedrock
              </span>
            </header>

            <div
              ref={scrollRef}
              className="thin-scroll relative flex-1 overflow-y-auto px-10"
            >
              <div className="mx-auto max-w-[660px] space-y-8 pb-14 pt-8">
                {RenderMessages()}
              </div>
            </div>

            <ChatInput onSend={handleSend} />
          </>
        ) : (
          <div className="relative flex-1 overflow-hidden">
            <EmptyState onNewChat={handleNewChat} />
          </div>
        )}
      </main>
    </div>
  );
}