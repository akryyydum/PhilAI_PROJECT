import React from "react";
import "./topbar.css";

const Topbar = () => {
  return (
    <header className="topbar">
      <div className="logo">
        <h1>PhilAI</h1>
      </div>

      <nav className="nav-links">
        <a href="#" className="nav-link">Home</a>
        <a href="#" className="nav-link">Contacts</a>
        <button type="button" className="login-button">Login</button>
      </nav>
    </header>
  );
};

export default Topbar;