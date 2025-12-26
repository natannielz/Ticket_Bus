import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import GuestLayout from '@/Layouts/GuestLayout';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Bus, MapPin, Clock, Calendar, Users, Shield, Zap, Coffee, Wind, Luggage, Star, ArrowLeft, Info, Armchair } from 'lucide-react';
import SeatMap from '@/Components/SeatMap';

// Fix Leaflet icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function MissionDetail() {
  const { scheduleId } = useParams();
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingData, setBookingData] = useState({ date: new Date().toISOString().split('T')[0], seats: 1, passenger_name: '' });
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetch(`/api/schedules/${scheduleId}`)
      .then(res => res.json())
      .then(result => {
        if (result.data) {
          setSchedule(result.data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [scheduleId]);

  const handleBooking = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      if (confirm("Please login to book. Go to login page?")) {
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
          schedule_id: schedule.id,
          date: bookingData.date,
          seats: selectedSeats.length > 0 ? selectedSeats : bookingData.seats,
          passenger_name: bookingData.passenger_name
        })
      });

      if (res.ok) {
        alert("Booking Successful!");
        navigate('/bookings');
      } else {
        const err = await res.json();
        alert("Failed to book: " + (err.error || err.message));
      }
    } catch (err) {
      alert("Network error occurred");
    } finally {
      setProcessing(false);
    }
  };

  const toggleSeat = (seatId) => {
    setSelectedSeats(prev =>
      prev.includes(seatId) ? prev.filter(s => s !== seatId) : [...prev, seatId]
    );
  };

  if (loading) return (
    <GuestLayout>
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-blue"></div>
      </div>
    </GuestLayout>
  );

  if (!schedule) return (
    <GuestLayout>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Schedule Not Found</h1>
        <button onClick={() => navigate('/catalog')} className="px-6 py-2 bg-accent-blue text-white rounded-lg">Back to Catalog</button>
      </div>
    </GuestLayout>
  );

  const totalPrice = schedule.price * bookingData.seats;
  const coordinates = schedule.coordinates || [];
  const mapCenter = coordinates.length > 0 ? coordinates[0] : [-6.2088, 106.8456];

  return (
    <GuestLayout>
      <div className="min-h-screen bg-gray-50 font-sans pb-20">
        {/* Hero / Header Section */}
        <div className="relative h-[400px] bg-black">
          {schedule.armada_image && (
            <img
              src={`/images/armadas/${schedule.armada_image}`}
              className="absolute inset-0 w-full h-full object-cover opacity-60"
              alt={schedule.armada_name}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full relative z-10 flex flex-col justify-end pb-12">
            <button
              onClick={() => navigate('/catalog')}
              className="absolute top-8 left-4 border border-white/20 bg-black/40 backdrop-blur-md text-white px-4 py-2 rounded-full hover:bg-black/60 transition-colors flex items-center gap-2 z-50 shadow-xl"
            >
              <ArrowLeft size={18} /> Back to Catalog
            </button>

            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-accent-blue text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">{schedule.armada_level}</span>
                  <div className="flex items-center gap-1 text-yellow-400">
                    <Star size={14} fill="currentColor" />
                    <Star size={14} fill="currentColor" />
                    <Star size={14} fill="currentColor" />
                    <Star size={14} fill="currentColor" />
                    <Star size={14} fill="currentColor" />
                  </div>
                </div>
                <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight uppercase leading-none mb-2">
                  {schedule.route_name}
                </h1>
                <p className="text-xl text-gray-300 font-medium">{schedule.origin} <ArrowLeft className="inline rotate-180 mx-2" size={20} /> {schedule.destination}</p>
              </div>

              <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-3xl min-w-[200px]">
                <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">Starting From</p>
                <p className="text-3xl font-black text-white">IDR {schedule.price.toLocaleString('id-ID')}</p>
                <div className="flex items-center gap-2 text-green-400 text-xs mt-2 font-bold">
                  <Zap size={14} /> Instant Confirmation
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

            {/* Left Column: Details & Map */}
            <div className="lg:col-span-2 space-y-12">

              {/* Strategy Description */}
              <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-6 text-gray-400">
                  <Info size={16} />
                  <h2 className="text-[10px] font-black uppercase tracking-widest">Route Strategy & Mission</h2>
                </div>
                <p className="text-lg text-gray-700 leading-relaxed font-medium mb-6">
                  {schedule.route_description || "Experience the most efficient and scenic route carefully planned by our logistics experts."}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                      <Clock size={20} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase">Duration</p>
                      <p className="text-sm font-bold text-gray-900">{schedule.duration}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase">Distance</p>
                      <p className="text-sm font-bold text-gray-900">{schedule.distanceKm} KM</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                      <Clock size={20} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase">Departure</p>
                      <p className="text-sm font-bold text-gray-900">{schedule.departure_time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                      <Calendar size={20} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase">Available Days</p>
                      <p className="text-sm font-bold text-gray-900">{schedule.days}</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Live Route Map */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-400">
                    <MapPin size={16} />
                    <h2 className="text-[10px] font-black uppercase tracking-widest">Tactical Logistics Path (Live)</h2>
                  </div>
                  <span className="flex items-center gap-1.5 text-green-500 text-[10px] font-black uppercase">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Live Status
                  </span>
                </div>
                <div className="h-[400px] rounded-3xl overflow-hidden shadow-xl border-4 border-white z-0">
                  <MapContainer center={mapCenter} zoom={10} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    {coordinates.length > 1 && (
                      <>
                        <Polyline positions={coordinates} color="#3b82f6" weight={6} opacity={0.6} />
                        <Marker position={coordinates[0]}><Popup>Origin: {schedule.origin}</Popup></Marker>
                        <Marker position={coordinates[coordinates.length - 1]}><Popup>Destination: {schedule.destination}</Popup></Marker>
                      </>
                    )}
                    {schedule.stops && schedule.stops.map(stop => (
                      <Marker key={stop.id} position={[stop.latitude, stop.longitude]}>
                        <Popup>
                          <div className="p-2">
                            <p className="font-black uppercase text-xs">{stop.name}</p>
                            <p className="text-gray-500 text-[10px]">{stop.type} | {stop.time_spent}</p>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>
              </section>

              {/* Fleet Specs */}
              <section className="bg-gray-900 rounded-3xl p-8 text-white">
                <div className="flex items-center gap-2 mb-8 text-white/40">
                  <Bus size={16} />
                  <h2 className="text-[10px] font-black uppercase tracking-widest">Assigned Armada Specifications</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div>
                    <h3 className="text-2xl font-black mb-4">{schedule.armada_name}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed mb-6 italic">
                      {schedule.history || "A legacy vessel optimized for reliability and comfort on long-distance missions."}
                    </p>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                        <span className="flex items-center gap-2 text-xs font-bold"><Users size={16} className="text-accent-blue" /> Capacity</span>
                        <span className="font-black">{schedule.capacity} Seats</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                        <span className="flex items-center gap-2 text-xs font-bold"><Zap size={16} className="text-accent-blue" /> Configuration</span>
                        <span className="font-black">{schedule.seat_config}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-black text-accent-blue uppercase tracking-widest mb-4">Premium Amenities</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-300">
                        <Wind size={16} /> Climate Control
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-300">
                        <Coffee size={16} /> Refreshments
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-300">
                        <Zap size={16} /> Entertainment
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-300">
                        <Luggage size={16} /> Extra Baggage
                      </div>
                    </div>
                    <div className="mt-6 p-4 rounded-2xl bg-white/5 border border-dashed border-white/20">
                      <p className="text-[9px] text-white/40 font-black uppercase mb-2">Fleet Mission Notes</p>
                      <p className="text-xs text-gray-400 whitespace-pre-line leading-relaxed">
                        {schedule.amenities || "Standard operational configuration for this vessel class."}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

            </div>

            {/* Right Column: Sticky Booking Widget */}
            <div className="lg:col-span-1">
              <div className="sticky top-8 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
                <div className="p-8 bg-black text-white">
                  <h3 className="text-xl font-black uppercase tracking-tight">Mission Reservation</h3>
                  <p className="text-gray-400 text-xs mt-1">Select your window for deployment.</p>
                </div>

                <form onSubmit={handleBooking} className="p-8 space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">1. Deployment Date</label>
                    <input
                      type="date"
                      required
                      className="w-full rounded-xl border-gray-100 font-bold text-gray-900 py-3 px-4 focus:ring-accent-blue focus:border-accent-blue"
                      value={bookingData.date}
                      onChange={e => setBookingData({ ...bookingData, date: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">2. Passenger Information</label>
                    <input
                      type="text"
                      placeholder="Full Name as per ID"
                      required
                      className="w-full rounded-xl border-gray-100 font-bold text-gray-900 py-3 px-4 focus:ring-accent-blue focus:border-accent-blue"
                      value={bookingData.passenger_name}
                      onChange={e => setBookingData({ ...bookingData, passenger_name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">3. Strategic Asset (SeatMap)</label>
                    <SeatMap
                      capacity={schedule.capacity}
                      config={schedule.seat_config}
                      selectedSeats={selectedSeats}
                      onSeatClick={toggleSeat}
                      price={schedule.price}
                    />
                  </div>

                  <div className="pt-6 border-t border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Transaction</span>
                      <span className="text-2xl font-black text-gray-900">IDR {(schedule.price * Math.max(1, selectedSeats.length)).toLocaleString('id-ID')}</span>
                    </div>

                    <button
                      type="submit"
                      disabled={processing || selectedSeats.length === 0}
                      className="w-full py-4 bg-accent-blue text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                    >
                      {processing ? 'Processing...' : (selectedSeats.length === 0 ? 'Select a Seat' : `Deploy ${selectedSeats.length} Seat Request`)}
                    </button>

                    <div className="mt-4 flex items-center justify-center gap-4 pt-6 border-t border-gray-50">
                      <div className="flex flex-col items-center">
                        <Shield size={16} className="text-green-500 mb-1" />
                        <span className="text-[8px] font-black text-gray-400 uppercase">Secure</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <Clock size={16} className="text-orange-500 mb-1" />
                        <span className="text-[8px] font-black text-gray-400 uppercase">Real-time</span>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>

          </div>
        </div>
      </div>
    </GuestLayout>
  );
}
