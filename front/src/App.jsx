import './App.css'
import Orb from './bg/Orb'
import LandingPage from './pages/LandingPage'
import Topbar from "./pages/topbar";

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
        <LandingPage />
      </div>
    </div>
  )
}

export default App
