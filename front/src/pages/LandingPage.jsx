import React from "react";
import "./LandingPage.css"
import TextType from '../components/TextType';
const LandingPage = () => {
    return (
        <div className="landing-page">
            <div className="title">
                
                <TextType 
  text={["Welcome to PhilAI!", "Unsure about the law?", "Ask PhilAI!"]}
  typingSpeed={75}
  pauseDuration={1500}
  showCursor
  cursorCharacter="_"
  texts={["Welcome to React Bits! Good to see you!","Build some amazing experiences!"]}
  deletingSpeed={50}
  variableSpeedEnabled={false}
  variableSpeedMin={60}
  variableSpeedMax={120}
  cursorBlinkDuration={0.5}
/>
            </div>
                <div className="input-wrapper">
  <form
    className="chatbar"
    onSubmit={(e) => e.preventDefault()}
    aria-label="Ask PhilAI"
  >
    <input
      className="input chat-input"
      type="text"
      placeholder="Ask PhilAI…"
      aria-label="Your question"
    />
    <button className="Subscribe-btn chat-send" type="submit">
      Send
    </button>
  </form>
</div>
        </div>
        
    );  
}

export default LandingPage;