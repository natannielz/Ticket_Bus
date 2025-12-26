import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import GuestLayout from '@/Layouts/GuestLayout';
import { Ticket, MapPin, Calendar, Clock, User, Armchair, ChevronLeft, Download, Printer } from 'lucide-react';

export default function ETicket() {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`/api/bookings/${bookingId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.data) setBooking(data.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [bookingId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading Ticket...</div>;
  if (!booking) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Ticket Not Found</div>;

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${booking.booking_code || booking.id}`;

  return (
    <GuestLayout>
      <div className="bg-gray-50 min-h-screen py-12 px-4 transition-all duration-500">
        <div className="max-w-3xl mx-auto">

          <button
            onClick={() => navigate('/bookings')}
            className="flex items-center gap-2 text-gray-500 hover:text-black mb-8 transition-colors group"
          >
            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-bold uppercase tracking-widest">Back to Bookings</span>
          </button>

          <div className="relative">
            {/* The Ticket Container */}
            <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden border border-gray-100 relative">

              {/* Header / Brand */}
              <div className="bg-black p-8 text-white flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-black italic tracking-tighter uppercase leading-none">TicketBus</h1>
                  <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] mt-1">Operational E-Ticket</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">Status</p>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${booking.status === 'confirmed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                    {booking.status}
                  </span>
                </div>
              </div>

              <div className="p-8 md:p-12">

                {/* Main Content Area */}
                <div className="flex flex-col md:flex-row gap-12">

                  {/* Left: Info */}
                  <div className="flex-1 space-y-10">

                    {/* Route Section */}
                    <div className="relative pb-6">
                      <div className="absolute left-3 top-6 bottom-0 w-0.5 bg-dashed border-l-2 border-dashed border-gray-200"></div>

                      <div className="flex items-start gap-6 relative">
                        <div className="w-6 h-6 rounded-full bg-white border-4 border-black flex-shrink-0 z-10"></div>
                        <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Departure Station</p>
                          <h2 className="text-xl font-black text-gray-900 leading-none">{booking.origin || 'Main Terminal'}</h2>
                        </div>
                      </div>

                      <div className="my-12 flex items-center gap-4 text-gray-300">
                        <MapPin size={16} />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] font-mono">MISSION TRAJECTORY</span>
                      </div>

                      <div className="flex items-start gap-6 relative">
                        <div className="w-6 h-6 rounded-full bg-black border-4 border-white shadow-md flex-shrink-0 z-10"></div>
                        <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Arrival Station</p>
                          <h2 className="text-xl font-black text-gray-900 leading-none">{booking.destination || 'Hub Destination'}</h2>
                        </div>
                      </div>
                    </div>

                    {/* Meta Grid */}
                    <div className="grid grid-cols-2 gap-y-8 gap-x-12 border-t border-gray-100 pt-10">
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Calendar size={12} /> Travel Date</p>
                        <p className="text-sm font-black text-gray-900 leading-none">{booking.date}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Clock size={12} /> Schedule</p>
                        <p className="text-sm font-black text-gray-900 leading-none">{booking.departure_time || '08:00'} - {booking.arrival_time || '12:00'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><User size={12} /> Passenger</p>
                        <p className="text-sm font-black text-gray-900 leading-none truncate max-w-[150px]">{booking.passenger_name || 'Anonymous Agent'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Armchair size={12} /> Assignment</p>
                        <p className="text-sm font-black text-gray-900 leading-none">{booking.seats} Seat(s)</p>
                      </div>
                    </div>
                  </div>

                  {/* Right: QR & Code */}
                  <div className="md:w-48 flex flex-col items-center justify-center border-l-0 md:border-l border-gray-100 md:pl-12">
                    <div className="p-4 bg-gray-50 rounded-3xl border border-gray-100 shadow-inner mb-6">
                      <img src={qrUrl} alt="QR Code" className="w-32 h-32 mix-multiply" />
                    </div>
                    <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">Booking Code</p>
                    <p className="text-xs font-mono font-black text-gray-900 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">{booking.booking_code?.substring(0, 8).toUpperCase() || booking.id}</p>
                  </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-12 flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 bg-gray-50 rounded-3xl border border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                      <Ticket size={24} className="text-gray-900" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Armada Deployed</p>
                      <p className="text-sm font-black text-gray-900 leading-none">{booking.armada_name}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => window.print()}
                      className="flex-1 md:flex-none px-6 py-3 bg-white text-gray-900 text-[10px] font-black uppercase tracking-widest rounded-xl border border-gray-200 hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm"
                    >
                      <Printer size={16} /> Print
                    </button>
                    <button
                      onClick={() => {
                        // Simple text-based download as a fallback
                        const ticketText = `
TICKETBUS E-TICKET
==================
Booking Code: ${booking.booking_code || booking.id}
Status: ${booking.status}

ROUTE:
From: ${booking.origin || 'Main Terminal'}
To: ${booking.destination || 'Hub Destination'}

DETAILS:
Date: ${booking.date}
Time: ${booking.departure_time || '08:00'} - ${booking.arrival_time || '12:00'}
Passenger: ${booking.passenger_name || 'Anonymous Agent'}
Seats: ${booking.seats}
Armada: ${booking.armada_name}
Total: IDR ${booking.total_price?.toLocaleString('id-ID')}

Please arrive 30 minutes before departure.
                        `;
                        const blob = new Blob([ticketText], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `ticket-${booking.booking_code?.substring(0, 8) || booking.id}.txt`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="flex-1 md:flex-none px-6 py-3 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-gray-800 transition-all flex items-center gap-2 shadow-xl"
                    >
                      <Download size={16} /> Download
                    </button>
                  </div>
                </div>
              </div>

              {/* Decorative Cutouts */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 bg-gray-50 rounded-full border border-gray-100"></div>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-10 h-10 bg-gray-50 rounded-full border border-gray-100 shadow-inner"></div>
            </div>

            {/* Warning / Intelligence Note */}
            <div className="mt-8 p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100 flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center flex-shrink-0 shadow-lg">!</div>
              <div className="text-xs text-indigo-900/70">
                <p className="font-black uppercase tracking-widest mb-1 text-indigo-900">Operator Note</p>
                <p className="leading-relaxed">This E-Ticket is valid for travel on the specified mission date and trajectory. Please arrive at the terminal 30 minutes before deployment for cargo check and strategic briefing.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </GuestLayout>
  );
}
