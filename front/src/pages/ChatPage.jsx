import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

function makeBotReply(userText) {
  const text = userText.toLowerCase();

  if (text.includes("hello") || text.includes("hi")) {
    return "Hi! I’m PhilAI (front-end demo). Ask me anything and I’ll respond with a placeholder reply.";
  }

  return `Front-end demo reply: I received: "${userText}". Wire me to your backend to generate real PhilAI responses.`;
}

function makeId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const ChatPage = () => {
  const location = useLocation();
  const initialMessage = location.state?.initialMessage;

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isBotTyping, setIsBotTyping] = useState(false);

  const seededRef = useRef(false);
  const bottomRef = useRef(null);

  const queueBotReply = (userText) => {
    setIsBotTyping(true);
    window.setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: makeId(), sender: "philAI", text: makeBotReply(userText) },
      ]);
      setIsBotTyping(false);
    }, 650);
  };

  // Seed the chat once from LandingPage navigate state
  useEffect(() => {
    if (seededRef.current) return;
    seededRef.current = true;

    const first = (initialMessage ?? "").trim();
    if (!first) return;

    setMessages([{ id: makeId(), sender: "user", text: first }]);
    queueBotReply(first);
  }, [initialMessage]);

  // Auto-scroll to bottom on new messages / typing indicator
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isBotTyping]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isBotTyping) return;

    setInput("");
    setMessages((prev) => [...prev, { id: makeId(), sender: "user", text }]);
    queueBotReply(text);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        paddingTop: 84, // leaves room for your fixed topbar
        paddingBottom: 110, // leaves room for the fixed input bar
        boxSizing: "border-box",
        color: "white",
      }}
    >
      <div
        style={{
          width: "min(920px, calc(100vw - 32px))",
          margin: "0 auto",
        }}
        aria-live="polite"
      >
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

        <div ref={bottomRef} />
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
          placeholder="Type your message…"
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