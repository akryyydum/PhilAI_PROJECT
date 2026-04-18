import React, { useCallback, useEffect, useRef, useState } from "react";
import "./LandingPage.css";
import TextType from "../components/TextType";
import { useNavigate } from "react-router-dom";

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

const LandingPage = () => {
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState(null);
  const [isVoiceSupported] = useState(() => {
    const SpeechRecognition =
      typeof window !== "undefined"
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : undefined;
    return Boolean(SpeechRecognition);
  });

  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef("");

  const sendAndNavigate = useCallback(
    (text) => {
      const trimmed = (text ?? "").trim();
      if (!trimmed) return;
      navigate("/chat", { state: { initialMessage: trimmed } });
      setMessage("");
    },
    [navigate]
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    sendAndNavigate(message);
  };

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
    recognition.lang = "fil-PH";

    recognition.onstart = () => {
      finalTranscriptRef.current = "";
      setVoiceError(null);
      setIsListening(true);
      setMessage("");
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
      setMessage(combined);
    };

    recognition.onerror = (event) => {
      setVoiceError(event?.error || "voice_error");
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      const finalText = (finalTranscriptRef.current || "").trim();
      finalTranscriptRef.current = "";
      if (finalText) sendAndNavigate(finalText);
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
  }, [sendAndNavigate]);

  const toggleVoice = () => {
    if (!isVoiceSupported) {
      setVoiceError("unsupported");
      return;
    }

    const recognition = recognitionRef.current;
    if (!recognition) {
      setVoiceError("unavailable");
      return;
    }

    setVoiceError(null);
    try {
      if (isListening) recognition.stop();
      else recognition.start();
    } catch {
      setVoiceError("start_failed");
      setIsListening(false);
    }
  };

  return (
    <div className="landing-page">
      <div className="title">
        <TextType
          text={["Welcome to PhilAI!", "Unsure about the law?", "Ask PhilAI!"]}
          typingSpeed={75}
          deletingSpeed={50}
          pauseDuration={1500}
          showCursor
          cursorCharacter="_"
          cursorBlinkDuration={0.5}
          // If you want variable speed, use:
          // variableSpeed={{ min: 60, max: 120 }}
        />
      </div>

      <div className="input-wrapper">
        <form className="chatbar" onSubmit={handleSubmit} aria-label="Ask PhilAI">
          <input
            className="input chat-input"
            type="text"
            placeholder={isListening ? "Listening…" : "Ask PhilAI…"}
            aria-label="Your question"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button
            className="Subscribe-btn chat-send"
            type="button"
            onClick={toggleVoice}
            disabled={!isVoiceSupported}
            aria-label={isListening ? "Stop voice input" : "Start voice input"}
            title={!isVoiceSupported ? "Voice input not supported in this browser" : isListening ? "Stop" : "Voice"}
            style={!isVoiceSupported ? { opacity: 0.65, cursor: "not-allowed" } : undefined}
          >
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              {isListening ? <StopIcon /> : <MicIcon />}
            </span>
          </button>
          <button className="Subscribe-btn chat-send" type="submit">
            Send
          </button>
        </form>

        {voiceError && (
          <div
            style={{
              marginTop: 10,
              padding: "10px 12px",
              borderRadius: 12,
              background: "rgba(255,255,255,0.10)",
              border: "1px solid rgba(255,255,255,0.18)",
              opacity: 0.9,
              color: "white",
            }}
            role="status"
          >
            Voice input unavailable ({String(voiceError)}).
          </div>
        )}
      </div>
    </div>
  );
};

export default LandingPage;