import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout';

export default function Welcome() {
  const { data, setData, get, processing, errors } = useForm({
    search: '',
    date: '',
  });

  const submit = (e) => {
    e.preventDefault();
    get(route('catalog.index')); // Assuming a catalog route exists or will exist
  };

  return (
    <GuestLayout>
      <Head title="Welcome" />

      <div className="relative bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <svg className="hidden lg:block absolute right-0 inset-y-0 h-full w-48 text-white transform translate-x-1/2" fill="currentColor" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <polygon points="50,0 100,0 50,100 0,100" />
            </svg>

            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                  <span className="block xl:inline">Find your next</span>{' '}
                  <span className="block text-indigo-600 xl:inline">experience</span>
                </h1>
                <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  Book premium bus travel with zero hassle. No complicated routes, just pick your event and go.
                </p>

                {/* Search Bar */}
                <div className="mt-8 sm:mt-10 sm:justify-center lg:justify-start">
                  <form onSubmit={submit} className="bg-white shadow-soft rounded-full p-2 flex flex-col sm:flex-row items-center border border-gray-100 max-w-lg">
                    <div className="relative flex-grow w-full sm:w-auto mb-2 sm:mb-0">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border-none rounded-full leading-5 bg-transparent placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-0 sm:text-sm"
                        placeholder="Search Event/Name"
                        value={data.search}
                        onChange={e => setData('search', e.target.value)}
                      />
                    </div>
                    <div className="hidden sm:block w-px h-6 bg-gray-300 mx-2"></div>
                    <div className="relative w-full sm:w-auto mb-2 sm:mb-0">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <input
                        type="date"
                        className="block w-full pl-10 pr-3 py-2 border-none rounded-full leading-5 bg-transparent text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-0 sm:text-sm"
                        value={data.date}
                        onChange={e => setData('date', e.target.value)}
                      />
                    </div>
                    <button type="submit" className="w-full sm:w-auto px-6 py-2 bg-accent text-white font-medium rounded-full shadow-md hover:bg-opacity-90 transition duration-150 ease-in-out">
                      Search
                    </button>
                  </form>
                </div>
              </div>
            </main>
          </div>
        </div>
        <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
          <img
            className="h-56 w-full object-cover sm:h-72 md:h-96 lg:w-full lg:h-full"
            src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1949&q=80"
            alt="Bus Travel"
          />
        </div>
      </div>
    </GuestLayout>
  );
}
