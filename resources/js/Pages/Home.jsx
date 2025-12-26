import React, { useState, useEffect } from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import { useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/schedules')
      .then(res => res.json())
      .then(data => {
        if (data.data) {
          // Transform schedules to match the display format
          setSchedules(data.data.map(s => ({
            ...s,
            name: s.armada_name,
            level: s.armada_level,
            image_path: s.armada_image,
            status: s.is_live ? 'active' : 'available'
          })));
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch schedules", err);
        setLoading(false);
      });
  }, []);

  const [formData, setFormData] = useState({
    schedule_id: '',
    date: new Date().toISOString().split('T')[0],
    seats: 1
  });

  const [processing, setProcessing] = useState(false);

  const openDrawer = (schedule) => {
    const token = localStorage.getItem('token');
    if (!token) {
      if (confirm("You must be logged in to book. Go to Login?")) {
        navigate('/login');
      }
      return;
    }
    setSelectedSchedule(schedule);
    setFormData(prev => ({ ...prev, schedule_id: schedule.id }));
  };

  const closeDrawer = () => {
    setSelectedSchedule(null);
    setFormData({ schedule_id: '', date: new Date().toISOString().split('T')[0], seats: 1 });
  };

  const submitBooking = async (e) => {
    e.preventDefault();
    setProcessing(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          schedule_id: formData.schedule_id,
          date: formData.date,
          seats: formData.seats
        })
      });

      if (res.ok) {
        alert("Booking Successful!");
        closeDrawer();
        navigate('/bookings');
      } else {
        const err = await res.json();
        alert("Booking failed: " + (err.error || err.message));
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred");
    } finally {
      setProcessing(false);
    }
  };

  // Calculate total price dynamically
  const totalPrice = selectedSchedule ? (selectedSchedule.price * formData.seats) : 0;

  return (
    <GuestLayout>
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

      {/* --- FLEET SHOWCASE SECTION --- */}
      <div className="bg-gray-50 py-24" id="fleet">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 gap-6">
            <div className="max-w-2xl">
              <h2 className="text-[10px] font-black text-accent-blue uppercase tracking-[0.2em] mb-4">Strategic Inventory</h2>
              <p className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight uppercase">
                Available Resource <span className="text-accent-blue">Showcase</span>
              </p>
              <p className="mt-4 text-gray-500 font-medium text-lg italic">
                Explore our tactical fleet configured for peak operational performance.
              </p>
            </div>
            <button
              onClick={() => navigate('/catalog')}
              className="px-8 py-4 bg-black text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/10"
            >
              Browse Operational Catalog
            </button>
          </div>

          <div className="grid gap-8 mx-auto md:grid-cols-2 lg:grid-cols-3 lg:max-w-none">
            {loading ? (
              <div className="col-span-3 text-center py-12 text-gray-400">Loading schedules...</div>
            ) : schedules.length === 0 ? (
              <div className="col-span-3 text-center py-12 text-gray-400">No schedules available</div>
            ) : schedules.map((schedule) => (
              <div
                key={schedule.id}
                onClick={() => navigate(`/catalog/${schedule.id}`)}
                className="group relative flex flex-col rounded-[2.5rem] overflow-hidden bg-white shadow-sm border border-gray-100 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 h-full cursor-pointer"
              >
                <div className="flex-shrink-0 relative h-64 overflow-hidden">
                  <div className="absolute top-6 left-6 z-20">
                    <span className="bg-black/40 backdrop-blur-md text-white text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest border border-white/10">
                      {schedule.level}
                    </span>
                  </div>
                  <img
                    className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    src={schedule.image_path ? `/images/armadas/${schedule.image_path}` : `https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800`}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800';
                    }}
                    alt={schedule.name}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                </div>

                <div className="flex-1 p-8 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${schedule.is_live ? 'bg-green-500 animate-pulse' : 'bg-orange-500'}`} />
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                          {schedule.route_name}
                        </span>
                      </div>
                      <div className="flex items-center text-gray-900 font-black text-xs">
                        <Star size={12} className="text-yellow-400 mr-1" fill="currentColor" /> 4.9
                      </div>
                    </div>

                    <h3 className="text-2xl font-black text-gray-900 group-hover:text-accent-blue transition-colors uppercase tracking-tight mb-2">
                      {schedule.name}
                    </h3>
                    <p className="text-sm text-gray-500 font-medium line-clamp-2 italic leading-relaxed">
                      {schedule.origin} → {schedule.destination} • Departs {schedule.departure_time}
                    </p>
                  </div>

                  <div className="mt-8 grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Price</p>
                      <p className="text-sm font-black text-gray-900">IDR {schedule.price?.toLocaleString('id-ID')}</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Capacity</p>
                      <p className="text-sm font-black text-gray-900">{schedule.capacity} Seats</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </GuestLayout>
  );
}
