import '../css/app.css';
import { createRoot } from 'react-dom/client';
import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';

// Pages
import Home from './Pages/Home';
import Login from './Pages/Auth/Login';
import Register from './Pages/Auth/Register';
import Catalog from './Pages/Catalog';
import Bookings from './Pages/Bookings';
import AdminDashboard from './Pages/Admin/Dashboard';
import AdminBookings from './Pages/Admin/Bookings';
import AdminFleet from './Pages/Admin/Fleet';
import AdminUsers from './Pages/Admin/Users';
import AdminRoutes from './Pages/Admin/Routes';
import AdminCrews from './Pages/Admin/Crews';
import AdminSupport from './Pages/Admin/SupportInbox';
import OperationsCenter from './Pages/Admin/OperationsCenter';
import ChatWidget from './Components/ChatWidget';

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
        <Route path="/bookings" element={<Bookings />} />

        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/operations" element={<OperationsCenter />} />
        <Route path="/admin/bookings" element={<AdminBookings />} />
        <Route path="/admin/fleet" element={<AdminFleet />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/routes" element={<AdminRoutes />} />
        <Route path="/admin/crews" element={<AdminCrews />} />
        <Route path="/admin/support" element={<AdminSupport />} />
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
