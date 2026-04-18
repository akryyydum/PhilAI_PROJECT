import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useLayoutEffect, useRef } from 'react';
import Orb from './bg/Orb'
import LandingPage from './pages/LandingPage'
import Topbar from "./pages/topbar";
import Chat from "./pages/ChatPage";
function App() {
  const navRef = useRef(null);

  useLayoutEffect(() => {
    const el = navRef.current;
    if (!el) return;

    const setTopbarHeight = () => {
      const height = el.getBoundingClientRect().height;
      if (height > 0) {
        document.documentElement.style.setProperty(
          '--topbar-height',
          `${Math.ceil(height)}px`
        );
      }
    };

    setTopbarHeight();

    const resizeObserver = new ResizeObserver(() => setTopbarHeight());
    resizeObserver.observe(el);

    window.addEventListener('resize', setTopbarHeight);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', setTopbarHeight);
    };
  }, []);

  return (
    
    <div className="app-shell">
      <div className="orb-background">
        <Orb
          hoverIntensity={2}
          rotateOnHover
          hue={0}
          forceHoverState={false}
          backgroundColor="#000000"
        />
      </div>

      <div className='navi' ref={navRef}>
        <Topbar />
      </div>

      <div className="content">
        <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/chat" element={<Chat />} />
        </Routes>
      </div>
      
    </div>
  )
}

export default App
