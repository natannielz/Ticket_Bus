import React from 'react';
import { Link } from '@inertiajs/react';

import { usePage } from '@inertiajs/react';

export default function GuestLayout({ children }) {
  const { auth } = usePage().props;
  return (
    <div className="min-h-screen bg-primary font-sans text-text-main flex flex-col">
      <nav className="bg-primary border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="shrink-0 flex items-center">
                <Link href="/" className="text-2xl font-bold tracking-tight text-accent">
                  LuxeTicket
                </Link>
              </div>
              <div className="hidden space-x-8 sm:-my-px sm:ml-10 sm:flex">
                <Link href="/" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium leading-5 text-gray-500 hover:text-gray-700 hover:border-gray-300 focus:outline-none focus:text-gray-700 focus:border-gray-300 transition duration-150 ease-in-out">
                  Home
                </Link>
                <Link href="/catalog" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium leading-5 text-gray-500 hover:text-gray-700 hover:border-gray-300 focus:outline-none focus:text-gray-700 focus:border-gray-300 transition duration-150 ease-in-out">
                  Catalog
                </Link>
              </div>
            </div>
            <div className="hidden sm:flex sm:items-center sm:ml-6 space-x-4">
              {auth.user ? (
                <>
                  {auth.user.role === 'admin' ? (
                    <Link href={route('admin.dashboard')} className="text-sm font-medium text-accent hover:text-accent-blue">
                      Admin Dashboard
                    </Link>
                  ) : (
                    <Link href={route('bookings.index')} className="text-sm font-medium text-accent hover:text-accent-blue">
                      My Bookings
                    </Link>
                  )}
                  <span className="text-sm text-gray-500">
                    Hi, {auth.user.name}
                  </span>
                  <Link
                    href={route('logout')}
                    method="post"
                    as="button"
                    className="text-sm font-medium text-red-500 hover:text-red-700"
                  >
                    Log out
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-sm font-medium text-gray-500 hover:text-gray-900">
                    Log in
                  </Link>
                  <Link href="/register" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-accent hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
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
