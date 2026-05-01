// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import './index.css';

import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import useForceTheme from './hooks/useForceTheme';

import Navbar from './components/Navbar/Navbar';
import Hero from './components/home/Hero';
import Features from './components/home/Features';
import Stats from './components/home/Stats';
import Footer from './components/home/Footer';

import Login from './pages/login/Login';
import Register from './pages/register/Register';
import Dashboard from './pages/dashboard/Dashboard';
import HotelPortal from './pages/portal/HotelPortal';
import RoleLogin from './pages/portal/RoleLogin';
import StaffPage from './pages/staff';
import AddStaff from './pages/staff/AddStaff';
import EditStaff from './pages/staff/EditStaff';

/* ─────────────────────────────────────────────
   Home — Landing page (har doim LIGHT)
───────────────────────────────────────────── */
const Home = () => {
  useForceTheme('light');
  return (
    <>
      <Navbar />
      <Hero />
      <Features />
      <Stats />
      <Footer />
    </>
  );
};

/* ─────────────────────────────────────────────
   App — Router
───────────────────────────────────────────── */
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Dashboard (umumiy) */}
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Hotel Portal — kartalar tanlash */}
            <Route path="/portal/:slug" element={<HotelPortal />} />

            {/* Role Login */}
            <Route path="/portal/:slug/login/:role" element={<RoleLogin />} />

            {/* Role Dashboard */}
            <Route path="/portal/:slug/:role/dashboard" element={<Dashboard />} />

            {/* Staff Routes */}
            <Route path="/portal/:slug/:role/staff" element={<StaffPage />} />
            <Route path="/portal/:slug/:role/staff/add" element={<AddStaff />} />
            <Route path="/portal/:slug/:role/staff/:id/edit" element={<EditStaff />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;