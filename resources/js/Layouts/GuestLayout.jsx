import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function GuestLayout({ children }) {
  const [user, setUser] = useState(null);
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
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
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
                <Link to="/" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium leading-5 text-gray-500 hover:text-gray-700 hover:border-gray-300 focus:outline-none focus:text-gray-700 focus:border-gray-300 transition duration-150 ease-in-out">
                  Home
                </Link>
                <Link to="/catalog" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium leading-5 text-gray-500 hover:text-gray-700 hover:border-gray-300 focus:outline-none focus:text-gray-700 focus:border-gray-300 transition duration-150 ease-in-out">
                  Catalog
                </Link>
              </div>
            </div>
            <div className="hidden sm:flex sm:items-center sm:ml-6 space-x-4">
              {user ? (
                <>
                  {user.role === 'admin' ? (
                    <Link to="/admin/dashboard" className="text-sm font-medium text-accent hover:text-accent-blue">
                      Admin Dashboard
                    </Link>
                  ) : (
                    <Link to="/bookings" className="text-sm font-medium text-accent hover:text-accent-blue">
                      My Bookings
                    </Link>
                  )}
                  <span className="text-sm text-gray-500">
                    Hi, {user.name}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-sm font-medium text-red-500 hover:text-red-700"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-sm font-medium text-gray-500 hover:text-gray-900">
                    Log in
                  </Link>
                  <Link to="/register" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-accent hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow">
        {children}
      </main>

      <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
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
