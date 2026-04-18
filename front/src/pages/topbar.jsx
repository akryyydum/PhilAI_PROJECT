import React, { useEffect, useState } from "react";
import "./topbar.css";

const Topbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <header className="topbar">
      <div className="topbar-main">
        <div className="logo">
          <h1>PhilAI</h1>
        </div>

        <button
          type="button"
          className="menu-button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <nav className="nav-links nav-desktop" aria-label="Primary">
        <a href="#" className="nav-link">Home</a>
        <a href="#" className="nav-link">Contacts</a>
        <button type="button" className="login-button">Login</button>
      </nav>

      {menuOpen && (
        <nav className="nav-links nav-mobile" aria-label="Mobile">
          <a href="#" className="nav-link" onClick={() => setMenuOpen(false)}>
            Home
          </a>
          <a href="#" className="nav-link" onClick={() => setMenuOpen(false)}>
            Contacts
          </a>
          <button
            type="button"
            className="login-button"
            onClick={() => setMenuOpen(false)}
          >
            Login
          </button>
        </nav>
      )}
    </header>
  );
};

export default Topbar;