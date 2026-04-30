// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

// Stillar
import './index.css'

// Context
import { AuthProvider } from './contexts/AuthContext'

// Komponentlar
import Navbar from './components/Navbar'
import Hero from './components/home/Hero'
import Features from './components/home/Features'
import Stats from './components/home/Stats'
import Footer from './components/home/Footer'

// Sahifalar
import Login from './pages/login/Login'
import Register from './pages/register/Register'
import GoogleSuccess from './pages/auth/GoogleSuccess'
import Dashboard from './pages/dashboard/Dashboard'
import HotelPortal from './pages/portal/HotelPortal'
import RoleLogin from './pages/portal/RoleLogin'

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
   App — Router (AuthProvider bilan o'ralgan)
───────────────────────────────────────────── */
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* ─── Public Routes ─── */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth/google/success" element={<GoogleSuccess />} />

          {/* ─── Dashboard (umumiy) ─── */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* ─── Hotel Portal — kartalar tanlash ─── */}
          <Route path="/portal/:slug" element={<HotelPortal />} />

          {/* ─── Role Login — Management / Front Desk / Housekeeping / Dept Manager ─── */}
          <Route path="/portal/:slug/login/:role" element={<RoleLogin />} />

          {/* ─── ⭐ Role Dashboard — login bo'lgandan keyin ─── */}
          {/* Bir xil Dashboard.tsx ishlatamiz, ichida useParams orqali slug va role olamiz */}
          <Route path="/portal/:slug/:role/dashboard" element={<Dashboard />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App