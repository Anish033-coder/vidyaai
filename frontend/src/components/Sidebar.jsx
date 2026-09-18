import { useState, useEffect } from "react";
import { getCourses } from "../api/api";

export default function Sidebar({ chats = [], onSelectChat, onNewChat, onDeleteChat, activeChatId }) {
  const [expanded, setExpanded] = useState(false);
  const [picking, setPicking] = useState(false);
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    async function loadCourses() {
      try {
        const data = await getCourses();
        setCourses(data?.courses || []);
      } catch (error) {
        console.error("Failed to load courses", error);
      }
    }
    loadCourses();
  }, []);

  function startSession(courseId) {
    setPicking(false);
    setExpanded(false);
    onNewChat(courseId);
  }

  return (
    <>
      {/* The rail */}
      <nav className="relative z-40 flex h-screen w-[68px] flex-shrink-0 flex-col items-center justify-between py-6">
        <div className="flex flex-col items-center gap-7">
          {/* Mark */}
          <span className="select-none font-display text-[26px] leading-none text-bone-50">
            व
          </span>

          <button
            onClick={() => setPicking(!picking)}
            aria-label="New session"
            className="group relative flex h-9 w-9 items-center justify-center rounded-full text-bone-400 transition-colors hover:text-vermillion-400"
          >
            <span className="absolute inset-0 scale-75 rounded-full bg-ink-850 opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100" />
            <svg className="relative h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" d="M12 5v14M5 12h14" />
            </svg>
          </button>

          <button
            onClick={() => setExpanded(!expanded)}
            aria-label="Sessions"
            className="group relative flex h-9 w-9 items-center justify-center rounded-full text-bone-400 transition-colors hover:text-bone-50"
          >
            <span className="absolute inset-0 scale-75 rounded-full bg-ink-850 opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100" />
            <svg className="relative h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" d="M4 7h16M4 12h10M4 17h13" />
            </svg>
          </button>

          {chats.length > 0 && (
            <span className="font-ui text-[10px] tabular-nums text-bone-600">{chats.length}</span>
          )}
        </div>

        <div className="flex flex-col items-center gap-4">
          <span className="h-1 w-1 rounded-full bg-vermillion-500" title="Grounded mode active" />
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-850 font-read text-[13px] text-bone-400">
            S
          </span>
        </div>
      </nav>

      {/* Course picker */}
      {picking && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setPicking(false)} />
          <div className="absolute left-[68px] top-20 z-50 w-72 animate-settle bg-ink-900 p-2 shadow-2xl shadow-black/60">
            <button
              onClick={() => startSession(null)}
              className="flex w-full items-baseline gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-ink-850"
            >
              <span className="font-read text-[12px] text-vermillion-500">—</span>
              <span className="font-read text-[15px] text-bone-50">General assistant</span>
            </button>

            <p className="px-3 pb-1.5 pt-3 font-read text-[12px] italic text-bone-500">
              Or pick a course to ground the answers
            </p>

            <div className="thin-scroll max-h-64 overflow-y-auto">
              {courses.length === 0 && (
                <p className="px-3 py-2 font-ui text-[12px] text-bone-600">No courses found.</p>
              )}
              {courses.map((course, i) => (
                <button
                  key={course._id}
                  onClick={() => startSession(course._id)}
                  className="flex w-full items-baseline gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-ink-850"
                >
                  <span className="font-read text-[12px] tabular-nums text-vermillion-500">
                    {i + 1}.
                  </span>
                  <span className="truncate font-read text-[15px] text-bone-200">
                    {course.title}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Session history — overlays, so the reading column never reflows */}
      {expanded && (
        <>
          <div className="fixed inset-0 z-40 bg-ink-950/40" onClick={() => setExpanded(false)} />
          <aside className="absolute left-[68px] top-0 z-50 h-screen w-[290px] animate-settle overflow-hidden bg-ink-900 shadow-2xl shadow-black/60">
            <div className="flex h-full flex-col">
              <div className="px-6 pb-4 pt-7">
                <h2 className="font-display text-[22px] leading-none text-bone-50">Sessions</h2>
              </div>

              <div className="thin-scroll flex-1 overflow-y-auto px-3 pb-6">
                {chats.length === 0 && (
                  <p className="px-3 font-read text-[14px] italic leading-relaxed text-bone-500">
                    Nothing here yet. Start a session and it will appear.
                  </p>
                )}

                {chats.map((chat, i) => {
                  const isActive = activeChatId === chat._id;
                  return (
                    <div
                      key={chat._id}
                      onClick={() => {
                        onSelectChat(chat);
                        setExpanded(false);
                      }}
                      className={`group flex cursor-pointer items-baseline gap-2.5 px-3 py-2.5 transition-colors ${
                        isActive ? "bg-ink-850" : "hover:bg-ink-850/60"
                      }`}
                    >
                      <span
                        className={`font-read text-[12px] tabular-nums ${
                          isActive ? "text-vermillion-500" : "text-bone-600"
                        }`}
                      >
                        {i + 1}.
                      </span>
                      <span
                        className={`flex-1 truncate font-read text-[15px] ${
                          isActive ? "text-bone-50" : "text-bone-400 group-hover:text-bone-200"
                        }`}
                      >
                        {chat.title || "Untitled session"}
                      </span>

                      {onDeleteChat && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteChat(chat._id);
                          }}
                          aria-label="Delete session"
                          className="font-ui text-[11px] text-bone-600 opacity-0 transition-all hover:text-vermillion-400 group-hover:opacity-100"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
