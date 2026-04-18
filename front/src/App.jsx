import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Orb from './bg/Orb'
import LandingPage from './pages/LandingPage'
import Topbar from "./pages/topbar";
import Chat from "./pages/ChatPage";
function App() {
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

      <div className='navi'>
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
