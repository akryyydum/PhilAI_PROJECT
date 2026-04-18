import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

const MicIcon = ({ size = 18, title }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role={title ? "img" : "presentation"}
    aria-label={title}
    aria-hidden={title ? undefined : true}
    focusable="false"
  >
    <path
      d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M19 11a7 7 0 0 1-14 0"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 18v3"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8 21h8"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const StopIcon = ({ size = 18, title }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role={title ? "img" : "presentation"}
    aria-label={title}
    aria-hidden={title ? undefined : true}
    focusable="false"
  >
    <rect
      x="7"
      y="7"
      width="10"
      height="10"
      rx="2"
      stroke="currentColor"
      strokeWidth="2"
    />
  </svg>
);

function makeId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const ChatPage = () => {
  const location = useLocation();
  const initialMessage = location.state?.initialMessage;
  const initialSeed = (initialMessage ?? "").trim();

  const API_BASE_URL = (
    import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.DEV
      ? "http://localhost:5000"
      : "https://philai-project-2.onrender.com")
  ).replace(/\/+$/, "");

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(() =>
    initialSeed ? [{ id: makeId(), sender: "user", text: initialSeed }] : []
  );
  const [isBotTyping, setIsBotTyping] = useState(false);

  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState(null);
  const [isVoiceSupported] = useState(() => {
    const SpeechRecognition =
      typeof window !== "undefined"
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : undefined;
    return Boolean(SpeechRecognition);
  });

  const seededRef = useRef(false);
  const bottomRef = useRef(null);

  const isBotTypingRef = useRef(false);

  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef("");

  useEffect(() => {
    isBotTypingRef.current = isBotTyping;
  }, [isBotTyping]);

  // UPDATED: Now fetches from your Express backend
  const queueBotReply = useCallback(async (userText) => {
    setIsBotTyping(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userText }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessages((prev) => [
          ...prev,
          { id: makeId(), sender: "philAI", text: data.reply },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { id: makeId(), sender: "philAI", text: `Error: ${data.error}` },
        ]);
      }
    } catch (error) {
      console.error("Network error:", error);
      setMessages((prev) => [
        ...prev,
        { id: makeId(), sender: "philAI", text: "Sorry, I couldn't connect to the server." },
      ]);
    } finally {
      setIsBotTyping(false);
    }
  }, [API_BASE_URL]);

  const sendUserMessage = useCallback(
    (text) => {
      const trimmed = (text ?? "").trim();
      if (!trimmed || isBotTypingRef.current) return;

      setMessages((prev) => [...prev, { id: makeId(), sender: "user", text: trimmed }]);
      queueBotReply(trimmed);
    },
    [queueBotReply]
  );

  // Voice input (Web Speech API)
  useEffect(() => {
    const SpeechRecognition =
      typeof window !== "undefined"
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : undefined;

    if (!SpeechRecognition) {
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    // `fil-PH` (Filipino/Tagalog) generally understands Tagalog + English well.
    recognition.lang = "fil-PH";

    recognition.onstart = () => {
      finalTranscriptRef.current = "";
      setVoiceError(null);
      setIsListening(true);
      setInput("");
    };

    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        const transcript = (res?.[0]?.transcript ?? "").trim();
        if (!transcript) continue;

        if (res.isFinal) {
          finalText += (finalText ? " " : "") + transcript;
        } else {
          interimText += (interimText ? " " : "") + transcript;
        }
      }

      if (finalText) {
        finalTranscriptRef.current = [finalTranscriptRef.current, finalText]
          .filter(Boolean)
          .join(" ")
          .trim();
      }

      const combined = [finalTranscriptRef.current, interimText].filter(Boolean).join(" ").trim();
      setInput(combined);
    };

    recognition.onerror = (event) => {
      setVoiceError(event?.error || "voice_error");
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);

      const finalText = (finalTranscriptRef.current || "").trim();
      finalTranscriptRef.current = "";

      if (finalText) {
        setInput("");
        sendUserMessage(finalText);
      }
    };

    recognitionRef.current = recognition;
    return () => {
      try {
        recognition.onstart = null;
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;
        recognition.stop?.();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    };
  }, [sendUserMessage]);

  // Seed the chat once from LandingPage navigate state
  useEffect(() => {
    if (seededRef.current) return;
    seededRef.current = true;
    if (!initialSeed) return;
    const t = setTimeout(() => {
      queueBotReply(initialSeed);
    }, 0);

    return () => clearTimeout(t);
  }, [initialSeed, queueBotReply]);

  // Auto-scroll to bottom on new messages / typing indicator
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isBotTyping]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput("");
    sendUserMessage(text);
  };

  const toggleVoice = () => {
    if (!isVoiceSupported) {
      setVoiceError("unsupported");
      return;
    }
    if (isBotTyping) return;

    const recognition = recognitionRef.current;
    if (!recognition) {
      setVoiceError("unavailable");
      return;
    }

    setVoiceError(null);
    try {
      if (isListening) {
        recognition.stop();
      } else {
        recognition.start();
      }
    } catch {
      // Common when `start()` is called while already started.
      setVoiceError("start_failed");
      setIsListening(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        paddingTop: "calc(var(--topbar-height) + 24px)", // leaves room for your fixed topbar
        paddingBottom: 110, // leaves room for the fixed input bar
        boxSizing: "border-box",
        color: "white",
      }}
    >
      <div
        style={{
          width: "min(920px, calc(100vw - 32px))",
          margin: "0 auto",
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
        aria-live="polite"
      >
        {voiceError && (
          <div
            style={{
              marginBottom: 10,
              padding: "10px 12px",
              borderRadius: 12,
              background: "rgba(255,255,255,0.10)",
              border: "1px solid rgba(255,255,255,0.18)",
              opacity: 0.9,
            }}
            role="status"
          >
            Voice input unavailable ({String(voiceError)}).
          </div>
        )}

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
          }}
        >
          <div>
            {messages.map((msg) => {
              const isUser = msg.sender === "user";
              return (
                <div
                  key={msg.id}
                  style={{
                    display: "flex",
                    justifyContent: isUser ? "flex-end" : "flex-start",
                    marginBottom: 10,
                  }}
                >
                  <div
                    style={{
                      maxWidth: "min(820px, 90%)",
                      padding: "10px 12px",
                      borderRadius: 16,
                      background: isUser
                        ? "rgba(255,255,255,0.18)"
                        : "rgba(255,255,255,0.10)",
                      border: "1px solid rgba(255,255,255,0.18)",
                      backdropFilter: "blur(10px)",
                      WebkitBackdropFilter: "blur(10px)",
                    }}
                  >
                    <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>
                      {isUser ? "You" : "PhilAI"}
                    </div>
                    <div style={{ whiteSpace: "pre-wrap" }}>{msg.text}</div>
                  </div>
                </div>
              );
            })}

            {isBotTyping && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div
                  style={{
                    padding: "10px 12px",
                    borderRadius: 16,
                    background: "rgba(255,255,255,0.10)",
                    border: "1px solid rgba(255,255,255,0.18)",
                    opacity: 0.9,
                  }}
                >
                  PhilAI is typing…
                </div>
              </div>
            )}
          </div>

          <div ref={bottomRef} />
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        aria-label="Chat input"
        style={{
          position: "fixed",
          left: "50%",
          bottom: 24,
          transform: "translateX(-50%)",
          width: "min(920px, calc(100vw - 32px))",
          height: 56,
          padding: 8,
          borderRadius: 999,
          display: "flex",
          gap: 10,
          alignItems: "center",
          background: "rgba(255, 255, 255, 0.10)",
          border: "1px solid rgba(255, 255, 255, 0.22)",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.35)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          boxSizing: "border-box",
          zIndex: 2,
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isListening ? "Listening…" : "Type your message…"}
          aria-label="Message"
          style={{
            flex: 1,
            height: "100%",
            border: 0,
            outline: "none",
            background: "transparent",
            color: "rgba(255,255,255,0.95)",
            paddingLeft: 14,
            fontSize: "1em",
          }}
        />

        <button
          type="button"
          onClick={toggleVoice}
          disabled={!isVoiceSupported || isBotTyping}
          aria-label={isListening ? "Stop voice input" : "Start voice input"}
          style={{
            width: 110,
            height: "100%",
            borderRadius: 999,
            background: "rgba(255, 255, 255, 0.14)",
            color: "rgba(255, 255, 255, 0.95)",
            border: "1px solid rgba(255, 255, 255, 0.22)",
            cursor: !isVoiceSupported || isBotTyping ? "not-allowed" : "pointer",
            opacity: !isVoiceSupported ? 0.65 : 1,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          title={
            !isVoiceSupported
              ? "Voice input not supported in this browser"
              : isListening
                ? "Stop"
                : "Voice"
          }
        >
          {isListening ? <StopIcon /> : <MicIcon />}
        </button>

        <button
          type="submit"
          disabled={isBotTyping}
          style={{
            width: 110,
            height: "100%",
            borderRadius: 999,
            background: "rgba(255, 255, 255, 0.14)",
            color: "rgba(255, 255, 255, 0.95)",
            border: "1px solid rgba(255, 255, 255, 0.22)",
            cursor: isBotTyping ? "not-allowed" : "pointer",
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatPage;