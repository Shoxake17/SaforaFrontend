// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';

import './index.css';

import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { StaffNotificationsProvider } from './contexts/StaffNotificationsContext';

import Navbar from './components/Navbar/Navbar';
import Hero from './components/Home/Hero';
import Features from './components/Home/Features';
import Stats from './components/Home/Stats';
import Footer from './components/Home/Footer';

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
import Settings from '@/pages/settings/Settings';
import HotelServices from '@/pages/hotelservices/HotelServices';   // ⭐ YANGI

// ⭐ Firebase Init (FCM uchun)
import FirebaseInit from './components/FirebaseInit/FirebaseInit';

// ⭐ Mobile (Capacitor) tekshiruv
const isMobileApp = Capacitor.isNativePlatform();

const Home = () => {
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

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <StaffNotificationsProvider>
          <FirebaseInit />
          <Router>
            <Routes>
              {/* Bosh sahifa */}
              <Route path="/" element={<Home />} />
              
              {/* Auth */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Portal entry */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/portal/:slug" element={<HotelPortal />} />
              <Route path="/portal/:slug/login/:role" element={<RoleLogin />} />
              <Route path="/portal/:slug/:role/dashboard" element={<Dashboard />} />

              {/* Staff */}
              <Route path="/portal/:slug/:role/staff" element={<StaffPage />} />
              <Route path="/portal/:slug/:role/staff/add" element={<AddStaff />} />
              <Route path="/portal/:slug/:role/staff/:id/edit" element={<EditStaff />} />

              {/* Rooms */}
              <Route path="/portal/:slug/:role/rooms" element={<RoomsPage />} />
              <Route path="/portal/:slug/:role/rooms/add" element={<AddRoom />} />
              <Route path="/portal/:slug/:role/rooms/types/add" element={<AddRoomType />} />
              <Route path="/portal/:slug/:role/rooms/types/:id/edit" element={<EditRoomType />} />
              <Route path="/portal/:slug/:role/rooms/:id/edit" element={<EditRoom />} />

              {/* QR */}
              <Route path="/portal/:slug/:role/qr-codes" element={<QrCodes />} />
              <Route path="/portal/:slug/:role/qr-rooms" element={<QrRooms />} />

              {/* Settings */}
              <Route path="/portal/:slug/:role/settings" element={<Settings />} />

              {/* ⭐ YANGI — Hotel Services (manager) */}
              <Route path="/portal/:slug/:role/services" element={<HotelServices />} />

              {/* Guest mobile */}
              <Route path="/g/:slug/:roomNumber" element={<GuestLoginPage />} />
            </Routes>
          </Router>
        </StaffNotificationsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;