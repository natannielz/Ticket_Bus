import '../css/app.css';
import { createRoot } from 'react-dom/client';
import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';

// Pages
import Home from './Pages/Home';
import Login from './Pages/Auth/Login';
import Register from './Pages/Auth/Register';
import Catalog from './Pages/Catalog';
import MissionDetail from './Pages/MissionDetail';
import Bookings from './Pages/Bookings';
import ETicket from './Pages/ETicket';
import Profile from './Pages/Profile';
import AdminDashboard from './Pages/Admin/Dashboard';
import AdminBookings from './Pages/Admin/Bookings';
import AdminFleet from './Pages/Admin/Fleet';
import AdminUsers from './Pages/Admin/Users';
import AdminRoutes from './Pages/Admin/Routes';
import AdminCrews from './Pages/Admin/Crews';
import AdminSupport from './Pages/Admin/SupportInbox';
import OperationsCenter from './Pages/Admin/OperationsCenter';
import ChatWidget from './Components/ChatWidget';

// Simple 404 Component
function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
      <h1 className="text-8xl font-black text-gray-200">404</h1>
      <p className="text-2xl font-bold text-gray-900 mt-4">Page Not Found</p>
      <p className="text-gray-500 mt-2">The page you're looking for doesn't exist or has been moved.</p>
      <a href="/" className="mt-8 px-8 py-3 bg-black text-white font-bold text-sm uppercase tracking-widest rounded-xl hover:bg-gray-800 transition-all">
        Go Home
      </a>
    </div>
  );
}

function App() {
  const isPublicPage = window.location.pathname.startsWith('/admin') === false;

  return (
    <BrowserRouter>
      {/* Global Chat Widget for Users (Simple check, better with useLocation hook inside a wrapper) */}
      <ChatWidgetWrapper />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/catalog/:scheduleId" element={<MissionDetail />} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/booking/:bookingId/ticket" element={<ETicket />} />
        <Route path="/profile" element={<Profile />} />

        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/operations" element={<OperationsCenter />} />
        <Route path="/admin/bookings" element={<AdminBookings />} />
        <Route path="/admin/fleet" element={<AdminFleet />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/routes" element={<AdminRoutes />} />
        <Route path="/admin/crews" element={<AdminCrews />} />
        <Route path="/admin/support" element={<AdminSupport />} />

        {/* 404 Catch-All */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

// Helper to use hooks logic for conditionally rendering chat
function ChatWidgetWrapper() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  return !isAdminRoute ? <ChatWidget /> : null;
}

const container = document.getElementById('app');
const root = createRoot(container);
root.render(<App />);
