import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { AlertTriangle, X, User, Menu } from 'lucide-react';

const SOCKET_URL = typeof import.meta !== 'undefined' && import.meta.env?.VITE_SOCKET_URL
  ? import.meta.env.VITE_SOCKET_URL
  : 'http://localhost:3005';

export default function GuestLayout({ children }) {
  const [user, setUser] = useState(null);
  const [notification, setNotification] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (u) {
      try {
        setUser(JSON.parse(u));
      } catch (e) {
        console.error("Invalid user data");
      }
    }

    // Global Socket for Notifications
    const socket = io(SOCKET_URL);
    socket.on('delay_broadcast', (data) => {
      setNotification(data);
      setTimeout(() => setNotification(null), 10000);
    });

    return () => socket.disconnect();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-primary font-sans text-text-main flex flex-col">
      <nav className="bg-primary border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="shrink-0 flex items-center">
                <Link to="/" className="text-2xl font-bold tracking-tight text-accent">
                  LuxeTicket
                </Link>
              </div>
              <div className="hidden space-x-8 sm:-my-px sm:ml-10 sm:flex">
                <Link to="/" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium leading-5 text-gray-500 hover:text-gray-700 hover:border-gray-300 transition duration-150 ease-in-out">
                  Home
                </Link>
                <Link to="/catalog" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium leading-5 text-gray-500 hover:text-gray-700 hover:border-gray-300 transition duration-150 ease-in-out">
                  Catalog
                </Link>
              </div>
            </div>

            {/* Desktop Menu */}
            <div className="hidden sm:flex sm:items-center sm:ml-6 space-x-6">
              {user ? (
                <>
                  {user.role === 'admin' ? (
                    <Link to="/admin/operations" className="text-sm font-black uppercase tracking-widest text-accent hover:text-black">
                      Ops Center
                    </Link>
                  ) : (
                    <>
                      <Link to="/bookings" className="text-sm font-black uppercase tracking-widest text-gray-500 hover:text-black">
                        Bookings
                      </Link>
                      <Link to="/profile" className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-gray-500 hover:text-black">
                        <User size={16} /> Profile
                      </Link>
                    </>
                  )}
                  <div className="h-4 w-px bg-gray-200"></div>
                  <button onClick={handleLogout} className="text-xs font-black uppercase tracking-tighter text-red-500 hover:text-red-700">
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-sm font-black uppercase tracking-widest text-gray-500 hover:text-gray-900 px-4 py-1.5">
                    Login
                  </Link>
                  <Link to="/register" className="text-sm font-black uppercase tracking-widest text-white bg-black px-6 py-2 rounded-xl shadow-xl hover:bg-gray-800">
                    Join
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center sm:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <Menu size={24} />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="sm:hidden bg-white border-t border-gray-100 animate-in slide-in-from-top duration-200">
            <div className="px-4 py-4 space-y-3">
              <Link to="/" className="block px-3 py-2 text-sm font-bold text-gray-700 rounded-lg hover:bg-gray-50" onClick={() => setMobileMenuOpen(false)}>
                Home
              </Link>
              <Link to="/catalog" className="block px-3 py-2 text-sm font-bold text-gray-700 rounded-lg hover:bg-gray-50" onClick={() => setMobileMenuOpen(false)}>
                Catalog
              </Link>
              {user ? (
                <>
                  {user.role === 'admin' ? (
                    <Link to="/admin/operations" className="block px-3 py-2 text-sm font-bold text-accent rounded-lg hover:bg-gray-50" onClick={() => setMobileMenuOpen(false)}>
                      Ops Center
                    </Link>
                  ) : (
                    <>
                      <Link to="/bookings" className="block px-3 py-2 text-sm font-bold text-gray-700 rounded-lg hover:bg-gray-50" onClick={() => setMobileMenuOpen(false)}>
                        My Bookings
                      </Link>
                      <Link to="/profile" className="block px-3 py-2 text-sm font-bold text-gray-700 rounded-lg hover:bg-gray-50" onClick={() => setMobileMenuOpen(false)}>
                        Profile
                      </Link>
                    </>
                  )}
                  <hr className="my-2 border-gray-100" />
                  <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm font-bold text-red-500 rounded-lg hover:bg-red-50">
                    Log out
                  </button>
                </>
              ) : (
                <div className="flex gap-2 pt-2">
                  <Link to="/login" className="flex-1 text-center px-4 py-2 text-sm font-bold text-gray-700 border border-gray-200 rounded-xl" onClick={() => setMobileMenuOpen(false)}>
                    Login
                  </Link>
                  <Link to="/register" className="flex-1 text-center px-4 py-2 text-sm font-bold text-white bg-black rounded-xl" onClick={() => setMobileMenuOpen(false)}>
                    Join
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Global Notification Banner */}
        {notification && (
          <div className="bg-orange-500 text-white animate-in slide-in-from-top duration-300 relative overflow-hidden">
            <div className="max-w-7xl mx-auto py-2 px-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertTriangle size={18} className="animate-pulse" />
                <p className="text-[11px] font-black uppercase tracking-widest">
                  Operational Delay: <span className="opacity-80 italic">{notification.message}</span>
                </p>
              </div>
              <button onClick={() => setNotification(null)} className="hover:bg-black/10 p-1 rounded-full">
                <X size={14} />
              </button>
            </div>
          </div>
        )}
      </nav>

      <main className="flex-grow">
        {children}
      </main>

      <footer className="bg-gray-50 border-t border-gray-200 mt-auto print:hidden">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 md:flex md:items-center md:justify-between lg:px-8">
          <div className="mt-8 md:mt-0 md:order-1">
            <p className="text-center text-base text-gray-400">
              &copy; 2025 LuxeTicket. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
