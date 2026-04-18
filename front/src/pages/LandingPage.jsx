import React, { useState} from "react";
import "./LandingPage.css";
import TextType from "../components/TextType";
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    // TODO: send `message` to your backend/chat logic here
    navigate("/chat", { state: { initialMessage: message } }); // Pass message to Chat page
    setMessage("");
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
            placeholder="Ask PhilAI…"
            aria-label="Your question"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button className="Subscribe-btn chat-send" type="submit">
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default LandingPage;