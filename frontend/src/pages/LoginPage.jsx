import { useState } from "react";

const BACKEND =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:5002";

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    setLoading(true);
    setError("");

    const url = `${BACKEND}/api/auth/${isRegister ? "register" : "login"}`;
    const body = isRegister ? { name, email, password } : { email, password };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));

      if (!data.token) {
        setError(data.error || "Those details didn't work. Try again.");
        return;
      }

      localStorage.setItem("token", data.token);
      window.location = "/chat";
    } catch (err) {
      console.error("Auth error:", err);
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") handleSubmit();
  }

  const fieldClass =
    "w-full border-b border-ink-800 bg-transparent pb-2.5 pt-1 font-read text-[17px] text-bone-50 placeholder-bone-600 outline-none transition-colors focus:border-vermillion-500";

  return (
    <div className="grain lit relative flex min-h-screen items-center bg-ink-950">
      <div className="mx-auto w-full max-w-[560px] px-10 py-16">
        <p className="animate-settle font-ui text-[11.5px] tracking-wide text-bone-600">
          VidyaAI
        </p>

        <h1 className="mt-5 animate-settle font-display text-[clamp(2.2rem,5vw,3.25rem)] leading-[1.05] tracking-[-0.02em] text-bone-50 [animation-delay:60ms]">
          {isRegister ? (
            <>
              Start asking your
              <br />
              <span className="italic text-vermillion-400">own</span> material.
            </>
          ) : (
            <>
              Your syllabus,
              <br />
              <span className="italic text-vermillion-400">answered</span>.
            </>
          )}
        </h1>

        <div className="mt-12 animate-settle space-y-7 [animation-delay:140ms]">
          {isRegister && (
            <label className="block">
              <span className="mb-1 block font-read text-[13px] italic text-bone-500">
                Your name
              </span>
              <input
                className={fieldClass}
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </label>
          )}

          <label className="block">
            <span className="mb-1 block font-read text-[13px] italic text-bone-500">
              Email
            </span>
            <input
              type="email"
              className={fieldClass}
              placeholder="you@college.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </label>

          <label className="block">
            <span className="mb-1 block font-read text-[13px] italic text-bone-500">
              Password
            </span>
            <input
              type="password"
              className={fieldClass}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </label>

          {error && (
            <p className="border-l border-vermillion-500 pl-3 font-read text-[14.5px] italic text-vermillion-400">
              {error}
            </p>
          )}

          <div className="flex items-baseline justify-between pt-2">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="group font-ui text-[13px] text-bone-50 disabled:opacity-50"
            >
              {loading ? "One moment" : isRegister ? "Create account" : "Sign in"}
              <span className="ml-2 inline-block transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
              <span className="mt-1.5 block h-px bg-vermillion-500" />
            </button>

            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError("");
              }}
              className="font-read text-[14px] italic text-bone-500 transition-colors hover:text-bone-200"
            >
              {isRegister ? "I already have one" : "I'm new here"}
            </button>
          </div>
        </div>

        <p className="mt-16 animate-settle font-read text-[13px] italic text-bone-600 [animation-delay:200ms]">
          Answers are grounded on Amazon Bedrock — every one cites the passage it
          came from.
        </p>
      </div>
    </div>
  );
}
