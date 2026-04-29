import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

// Stillar
import './index.css'

// Komponentlar
import Navbar from './components/Navbar'
import Hero from './components/home/Hero'
import Features from './components/home/Features'
import Stats from './components/home/Stats'
import Footer from './components/home/Footer'

// Sahifalar
import Login from './pages/login/Login'
import Register from './pages/register/Register'

/* ─────────────────────────────────────────────
   Home — Landing page
───────────────────────────────────────────── */
const Home = () => (
  <>
    <Navbar />
    <Hero />
    <Features />
    <Stats />
    <Footer />
  </>
)

/* ─────────────────────────────────────────────
   App — Router
───────────────────────────────────────────── */
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </Router>
  )
}

export default App