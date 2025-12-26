import React, { useState, useEffect } from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import { useNavigate } from 'react-router-dom';

export default function Catalog() {
  const [events, setEvents] = useState([]);
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

          <div className="grid gap-8 mx-auto md:grid-cols-2 lg:grid-cols-3 lg:max-w-none">
            {events.map((event) => (
              <div
                key={event.id}
                className="group flex flex-col rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-2xl transition-all duration-300 border border-gray-100 cursor-pointer transform hover:-translate-y-1"
                onClick={() => openDrawer(event)}
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
                        // Create a text node or sibling for "No Image" if desired, 
                        // but strictly hiding it and showing background is cleaner.
                      }}
                    />
                  ) : (
                    <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400 font-bold text-xs uppercase">No Image</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                    <p className="p-6 text-white font-medium">Lihat Detail &rarr;</p>
                  </div>
                </div>

                <div className="flex-1 p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium text-accent bg-accent/10 px-2 py-1 rounded-md">
                        Tersedia
                      </span>
                      <span className="text-xs text-gray-400">★ 4.9</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-accent transition-colors">
                      {event.title}
                    </h3>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Harga / KM</p>
                      <p className="text-lg font-bold text-gray-900">
                        IDR {event.price ? event.price.toLocaleString('id-ID') : 0}
                      </p>
                    </div>
                    <button className="h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-accent group-hover:text-white transition-all">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Booking Drawer */}
      {selectedEvent && (
        <div className="fixed inset-0 overflow-hidden z-50">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" onClick={closeDrawer}></div>
            <section className="absolute inset-y-0 right-0 pl-10 max-w-full flex">
              <div className="w-screen max-w-md animate-slide-in-right">
                <div className="h-full flex flex-col bg-white shadow-2xl overflow-y-scroll">

                  {/* Drawer Header */}
                  <div className="relative h-64 bg-gray-900">
                    <img src={selectedEvent.image} className="w-full h-full object-cover opacity-60" alt="" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="absolute bottom-0 left-0 p-6">
                      <span className="inline-block px-2 py-1 rounded-md bg-accent text-white text-xs font-bold tracking-wider mb-2">{selectedEvent.level}</span>
                      <h2 className="text-2xl font-bold text-white leading-tight">{selectedEvent.title}</h2>
                      <p className="text-gray-300 text-sm mt-1">{selectedEvent.route}</p>
                    </div>
                    <button onClick={closeDrawer} className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 rounded-full p-2 text-white transition-colors">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>

                  <div className="flex-1 py-8 px-6 space-y-8">
                    {/* Details */}
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2 mb-4">Fasilitas & Layanan</h3>
                      <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{selectedEvent.amenities}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2 mb-4">Konfigurasi Kursi</h3>
                      <p className="text-sm text-gray-600">{selectedEvent.seat_config}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2 mb-4">Sejarah Armada</h3>
                      <div className="bg-gray-50 border-l-4 border-accent p-4 rounded-r-lg">
                        <p className="text-sm text-gray-600 italic">"{selectedEvent.history}"</p>
                      </div>
                    </div>

                    {/* Booking Form */}
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">Reservasi Sekarang</h3>
                      <form onSubmit={submitBooking} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Keberangkatan</label>
                          <input
                            type="date"
                            required
                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-accent focus:ring-accent"
                            value={formData.date}
                            onChange={(e) => setData('date', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Kursi</label>
                          <input
                            type="number"
                            min="1"
                            max={selectedEvent.capacity}
                            required
                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-accent focus:ring-accent"
                            value={formData.seats}
                            onChange={(e) => setData('seats', e.target.value)}
                          />
                        </div>

                        <div className="pt-4 border-t border-gray-200 mt-4">
                          <div className="flex justify-between items-center mb-4">
                            <span className="text-sm text-gray-500">Total Biaya</span>
                            <span className="text-2xl font-bold text-accent">
                              IDR {totalPrice.toLocaleString('id-ID')}
                            </span>
                          </div>
                          <button
                            type="submit"
                            disabled={processing}
                            className="w-full py-3 px-4 bg-accent hover:bg-accent-blue text-white font-bold rounded-lg shadow-lg shadow-accent/20 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {processing ? 'Memproses...' : 'Konfirmasi Pemesanan'}
                          </button>
                        </div>
                      </form>
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
