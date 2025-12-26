import React, { useState, useEffect } from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import { useNavigate } from 'react-router-dom';

export default function Catalog() {
  const [events, setEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('ALL');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const navigate = useNavigate();

  // Booking Form State
  const [formData, setFormData] = useState({
    schedule_id: '',
    date: '',
    seats: 1
  });
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetch('/api/schedules')
      .then(res => res.json())
      .then(result => {
        if (result.data) {
          const transformed = result.data.map(d => ({
            ...d,
            title: d.armada_name,
            level: d.armada_level,
            price: d.price,
            image: d.armada_image ? `/images/armadas/${d.armada_image}` : null,
            route: d.route_name,
            date: `Keberangkatan: ${d.departure_time}`,
            seat_config: d.seat_config,
            capacity: d.capacity
          }));
          setEvents(transformed);
        }
      })
      .catch(err => console.error(err));
  }, []);

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.route.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = filterLevel === 'ALL' || event.level === filterLevel;
    return matchesSearch && matchesLevel;
  });

  const setData = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));

  const openDrawer = (event) => {
    setSelectedEvent(event);
    setFormData(prev => ({ ...prev, schedule_id: event.id }));
  };

  const closeDrawer = () => {
    setSelectedEvent(null);
    setFormData({ schedule_id: '', date: '', seats: 1 });
  };

  const submitBooking = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      if (confirm("Silakan login untuk memesan. Ke Halaman Login?")) {
        navigate('/login');
      }
      return;
    }

    setProcessing(true);
    try {
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
        alert("Pemesanan Berhasil!");
        closeDrawer();
        navigate('/bookings');
      } else {
        const err = await res.json();
        alert("Gagal Memesan: " + (err.error || err.message));
      }
    } catch (error) {
      alert("Terjadi Kesalahan Jaringan");
    } finally {
      setProcessing(false);
    }
  };

  const totalPrice = selectedEvent ? (selectedEvent.price * formData.seats) : 0;

  return (
    <GuestLayout>
      <div className="bg-primary-bg min-h-screen py-12 font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-sm font-bold text-accent tracking-widest uppercase mb-2">Pilihan Armada</h2>
            <p className="text-4xl font-extrabold text-gray-900 sm:text-5xl lg:text-6xl tracking-tight">
              Katalog Perjalanan
            </p>
            <p className="max-w-2xl mt-4 mx-auto text-xl text-gray-500">
              Pilih pengalaman perjalanan premium Anda. Kenyamanan tanpa kompromi.
            </p>
          </div>

          {/* Search & Filters */}
          <div className="mb-12 flex flex-col md:flex-row gap-6 items-center justify-between bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <div className="relative w-full md:w-96">
              <input
                type="text"
                placeholder="Seach armada or route..."
                className="w-full bg-gray-50 border-0 rounded-2xl py-3 px-12 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-black transition-all"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>

            <div className="flex gap-2 p-1.5 bg-gray-100 rounded-2xl overflow-x-auto">
              {['ALL', 'Executive', 'Super Executive', 'Sleeper'].map(lvl => (
                <button
                  key={lvl}
                  onClick={() => setFilterLevel(lvl)}
                  className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterLevel === lvl ? 'bg-black text-white shadow-lg' : 'text-gray-400 hover:text-gray-900'}`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-8 mx-auto md:grid-cols-2 lg:grid-cols-3 lg:max-w-none">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className="group flex flex-col rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-2xl transition-all duration-300 border border-gray-100 cursor-pointer transform hover:-translate-y-1"
                onClick={() => navigate(`/catalog/${event.id}`)}
              >
                <div className="relative h-64 overflow-hidden">
                  <div className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-gray-900 shadow-sm uppercase tracking-wide">
                    {event.level}
                  </div>
                  {event.image ? (
                    <img
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      src={event.image}
                      alt={event.title}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = 'none';
                        e.target.parentNode.classList.add('bg-gray-200');
                      }}
                    />
                  ) : (
                    <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400 font-bold text-xs uppercase">No Image</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                    <p className="p-6 text-white font-medium italic uppercase tracking-widest text-[10px] font-black">Open Operational Mission &rarr;</p>
                  </div>
                </div>

                <div className="flex-1 p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-black text-accent bg-accent/10 px-2 py-0.5 rounded uppercase tracking-wider">
                        Strategic Deployment
                      </span>
                      <span className="text-xs text-gray-400">★ 4.9</span>
                    </div>
                    <h3 className="text-xl font-black text-gray-900 mb-1 group-hover:text-accent transition-colors uppercase tracking-tight">
                      {event.title}
                    </h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{event.route}</p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <p className="text-[9px] text-gray-400 uppercase tracking-widest font-black">Mission Cost</p>
                      <p className="text-lg font-black text-gray-900">
                        IDR {event.price ? event.price.toLocaleString('id-ID') : 0}
                      </p>
                    </div>
                    <button className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-accent group-hover:text-white transition-all shadow-sm">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                    </button>
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

