import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout';

export default function Catalog({ events }) {
  // State for side drawer (checkout)
  const [selectedEvent, setSelectedEvent] = useState(null);

  const openDrawer = (event) => setSelectedEvent(event);
  const closeDrawer = () => setSelectedEvent(null);

  return (
    <GuestLayout>
      <Head title="Catalog" />

      <div className="bg-primary-bg min-h-screen py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base font-semibold text-accent tracking-wide uppercase">Key Properties</h2>
            <p className="mt-1 text-4xl font-extrabold text-text-main sm:text-5xl sm:tracking-tight lg:text-6xl">
              Available Experiences
            </p>
            <p className="max-w-xl mt-5 mx-auto text-xl text-text-secondary">
              Select a premium pass for your next journey.
            </p>
          </div>

          <div className="mt-12 grid gap-8 mx-auto md:grid-cols-2 lg:grid-cols-3 lg:max-w-none">
            {events.map((event) => (
              <div
                key={event.id}
                className="group flex flex-col rounded-card overflow-hidden bg-white shadow-soft transition-transform duration-300 hover:-translate-y-2 hover:shadow-lg cursor-pointer"
                onClick={() => openDrawer(event)}
              >
                <div className="flex-shrink-0 relative overflow-hidden h-48 sm:h-64">
                  <img
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    src={event.image}
                    alt={event.title}
                  />
                </div>
                <div className="flex-1 p-6 flex flex-col justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-accent-blue">
                      {event.date}
                    </p>
                    <div className="block mt-2">
                      <p className="text-xl font-semibold text-text-main group-hover:text-accent transition-colors">
                        {event.title}
                      </p>
                    </div>
                  </div>
                  <div className="mt-6 flex items-center justify-between">
                    <div className="text-lg font-bold text-text-main">
                      IDR {event.price.toLocaleString('id-ID')}
                    </div>
                    <button className="text-sm font-medium text-accent hover:text-accent-blue transition-colors">
                      Book Now &rarr;
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Side Drawer (Checkout) */}
      {selectedEvent && (
        <div className="fixed inset-0 overflow-hidden z-50">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={closeDrawer}></div>
            <section className="absolute inset-y-0 right-0 pl-10 max-w-full flex">
              <div className="w-screen max-w-md">
                <div className="h-full flex flex-col bg-white shadow-xl overflow-y-scroll">
                  <div className="py-6 px-4 sm:px-6 bg-accent">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-medium text-white">Reference ID: {selectedEvent.level}</h2>
                      <div className="ml-3 h-7 flex items-center">
                        <button onClick={closeDrawer} className="bg-transparent rounded-md text-gray-200 hover:text-white focus:outline-none">
                          <span className="sr-only">Close panel</span>
                          <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="mt-1">
                      <p className="text-xl font-bold text-white mb-1">{selectedEvent.title}</p>
                      <p className="text-sm text-gray-200">{selectedEvent.route}</p>
                    </div>
                  </div>
                  <div className="relative flex-1 py-6 px-4 sm:px-6">
                    <div className="mb-6">
                      <img src={selectedEvent.image} alt={selectedEvent.title} className="w-full h-48 object-cover rounded-lg shadow-sm mb-4" />

                      <h3 className="text-md font-bold text-gray-900 mb-2">Service & Amenities</h3>
                      <p className="text-sm text-gray-600 mb-4 whitespace-pre-line">{selectedEvent.amenities}</p>

                      <h3 className="text-md font-bold text-gray-900 mb-2">Seat Configuration</h3>
                      <p className="text-sm text-gray-600 mb-4">{selectedEvent.seat_config}</p>

                      <h3 className="text-md font-bold text-gray-900 mb-2">Vehicle History</h3>
                      <p className="text-sm text-gray-600 italic border-l-4 border-accent pl-3 py-1 bg-gray-50 rounded-r-md">
                        "{selectedEvent.history}"
                      </p>
                    </div>

                    <div className="border-t border-gray-200 pt-6">
                      <div className="flex justify-between items-center mb-6 bg-gray-50 p-4 rounded-lg">
                        <span className="text-base font-medium text-gray-900">Total Price / Day</span>
                        <span className="text-xl font-bold text-accent">IDR {selectedEvent.price.toLocaleString('id-ID')}</span>
                      </div>
                      <button className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-accent hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent transition duration-150 ease-in-out">
                        Proceed to Booking
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      )}
    </GuestLayout>
  );
}
