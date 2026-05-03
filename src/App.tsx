// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import './index.css';
import './components/PortalLayout.css';

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
import RoomsPage from './pages/rooms';
import AddRoom from './pages/rooms/AddRoom';
import AddRoomType from './pages/rooms/AddRoomType';
import EditRoomType from './pages/rooms/EditRoomType';
import EditRoom from './pages/rooms/EditRoom';
import QrCodes from './pages/qrcodes/QrCodes';
import QrRooms from './pages/qrrooms/QrRooms';
import GuestLoginPage from './pages/guest/GuestLoginPage';

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
            <Route path="/portal/:slug/:role/rooms" element={<RoomsPage />} />
            <Route path="/portal/:slug/:role/rooms/add" element={<AddRoom />} />
            <Route path="/portal/:slug/:role/rooms/types/add" element={<AddRoomType />} />
            <Route path="/portal/:slug/:role/rooms/types/:id/edit" element={<EditRoomType />} />
            <Route path="/portal/:slug/:role/rooms/:id/edit" element={<EditRoom />} />
            <Route path="/portal/:slug/:role/qr-codes" element={<QrCodes />} />
            <Route path="/portal/:slug/:role/qr-rooms" element={<QrRooms />} />
            <Route path="/g/:slug/:roomNumber" element={<GuestLoginPage />} />

          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;