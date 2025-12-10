import React, { useState, useEffect } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout';

export default function Home({ events }) {
  const { auth } = usePage().props;
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);

  // Form handling for booking
  const { data, setData, post, processing, errors, reset, wasSuccessful } = useForm({
    armada_id: '',
    date: '',
    seats: 1,
  });

  useEffect(() => {
    if (selectedEvent) {
      setData('armada_id', selectedEvent.id);
    }
  }, [selectedEvent]);

  const openDrawer = (event) => {
    if (!auth.user) {
      // Redirect to login or show modal hinting to login
      // For now, let's just alert or simple redirect
      if (confirm("You must be logged in to book. Go to Login?")) {
        window.location.href = route('login');
      }
      return;
    }
    setSelectedEvent(event);
    setData('armada_id', event.id);
  };

  const closeDrawer = () => {
    setSelectedEvent(null);
    reset();
  };

  const submitBooking = (e) => {
    e.preventDefault();
    post(route('bookings.store'), {
      onSuccess: () => {
        closeDrawer();
        // Success toast is handled by Layout/Flash
        alert("Booking Successful!"); // Temporary immediate feedback
      },
    });
  };

  // Calculate total price dynamically
  const totalPrice = selectedEvent ? (selectedEvent.price_per_km * data.seats) : 0;

  return (
    <GuestLayout>
      <Head title="Home" />

      {/* --- HERO SECTION --- */}
      <div className="relative bg-white overflow-hidden mb-12">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <svg className="hidden lg:block absolute right-0 inset-y-0 h-full w-48 text-white transform translate-x-1/2" fill="currentColor" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <polygon points="50,0 100,0 50,100 0,100" />
            </svg>

            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                  <span className="block xl:inline">Find your next</span>{' '}
                  <span className="block text-accent-blue xl:inline">experience</span>
                </h1>
                <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  Book premium bus travel with zero hassle. No complicated routes, just pick your event and go.
                </p>
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

      {/* --- CATALOG SECTION --- */}
      <div className="bg-primary-bg py-12" id="catalog">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base font-semibold text-accent tracking-wide uppercase">Key Properties</h2>
            <p className="mt-1 text-4xl font-extrabold text-text-main sm:text-5xl sm:tracking-tight lg:text-6xl">
              Available Experiences
            </p>
          </div>

          <div className="mt-12 grid gap-8 mx-auto md:grid-cols-2 lg:grid-cols-3 lg:max-w-none">
            {events.map((event) => (
              <div
                key={event.id}
                className="group flex flex-col rounded-card overflow-hidden bg-white shadow-soft transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl cursor-pointer h-full border border-gray-100"
                onClick={() => openDrawer(event)}
              >
                <div className="flex-shrink-0 relative overflow-hidden h-56">
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors z-10" />
                  <img
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    src={`https://images.unsplash.com/photo-${1500000000000 + event.id}?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80`}
                    onError={(e) => e.target.src = "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"}
                    alt={event.name}
                  />
                </div>
                <div className="flex-1 p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-bold px-2 py-1 bg-blue-50 text-accent-blue rounded-full uppercase tracking-wide">
                        Available
                      </p>
                      <div className="flex items-center text-gray-400 text-xs">
                        <span className="mr-1">★</span> 4.8
                      </div>
                    </div>

                    <div className="block mt-4">
                      <h3 className="text-xl font-bold text-text-main group-hover:text-accent-blue transition-colors">
                        {event.name}
                      </h3>
                      <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                        Experience premium travel with our {event.name} package. Includes {event.capacity} seats and luxury amenities.
                      </p>
                    </div>
                  </div>
                  <div className="mt-6 flex items-center justify-between border-t border-gray-50 pt-4">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-400 uppercase font-semibold">Price per ticket</span>
                      <span className="text-lg font-extrabold text-text-main">
                        IDR {parseInt(event.price_per_km).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <button className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-accent hover:bg-accent-blue transition-all duration-200 shadow-md hover:shadow-lg transform active:scale-95">
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- SIDE DRAWER (CHECKOUT) --- */}
      {selectedEvent && (
        <div className="fixed inset-0 overflow-hidden z-50">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={closeDrawer}></div>
            <section className="absolute inset-y-0 right-0 pl-10 max-w-full flex">
              <div className="w-screen max-w-md animate-slide-in-right">
                <div className="h-full flex flex-col bg-white shadow-xl overflow-y-scroll">
                  <div className="py-6 px-4 sm:px-6 bg-accent">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-medium text-white">Checkout</h2>
                      <button onClick={closeDrawer} className="text-gray-200 hover:text-white">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <p className="mt-1 text-sm text-gray-300">Booking: {selectedEvent.name}</p>
                  </div>
                  <div className="relative flex-1 py-6 px-4 sm:px-6">
                    <form onSubmit={submitBooking} className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Date</label>
                        <input
                          type="date"
                          required
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-accent focus:border-accent sm:text-sm"
                          value={data.date}
                          onChange={e => setData('date', e.target.value)}
                        />
                        {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Seats</label>
                        <input
                          type="number"
                          min="1"
                          max={selectedEvent.capacity}
                          required
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-accent focus:border-accent sm:text-sm"
                          value={data.seats}
                          onChange={e => setData('seats', e.target.value)}
                        />
                        {errors.seats && <p className="text-red-500 text-xs mt-1">{errors.seats}</p>}
                      </div>

                      <div className="border-t border-gray-200 pt-4">
                        <div className="flex justify-between text-base font-medium text-gray-900">
                          <p>One Ticket</p>
                          <p>IDR {parseInt(selectedEvent.price_per_km).toLocaleString('id-ID')}</p>
                        </div>
                        <div className="flex justify-between text-lg font-bold text-accent mt-2">
                          <p>Total</p>
                          <p>IDR {totalPrice.toLocaleString('id-ID')}</p>
                        </div>
                      </div>

                      <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 gap-y-3 sm:gap-y-0">
                        <button
                          type="button"
                          onClick={closeDrawer}
                          className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mt-3 sm:mt-0"
                        >
                          Back
                        </button>
                        <button
                          type="submit"
                          disabled={processing}
                          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-accent hover:bg-accent-blue transition duration-150 ease-in-out disabled:opacity-50"
                        >
                          {processing ? 'Processing...' : 'Confirm Payment'}
                        </button>
                      </div>
                    </form>
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
