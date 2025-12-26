import React, { useState, useEffect } from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import { useNavigate } from 'react-router-dom';

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    fetch('/api/bookings', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.data) setBookings(data.data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-20">Loading...</div>;

  return (
    <GuestLayout>
      <div className="bg-gray-50 min-h-screen py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-3xl font-extrabold text-gray-900">My Bookings</h1>
            <p className="mt-2 text-gray-600">Travel history and upcoming trips.</p>
          </div>

          <div className="bg-white rounded-card shadow-soft overflow-hidden">
            {bookings.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {bookings.map((booking) => (
                  <li key={booking.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold text-gray-900">{booking.armada_name || `Armada #${booking.armada_id}`}</h3>
                          <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded-full 
                                              ${booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                booking.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                            {booking.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                          <p>Date: <span className="font-medium text-gray-900">{booking.date}</span></p>
                          <p>Seats: <span className="font-medium text-gray-900">{booking.seats}</span></p>
                          <p>Route: <span className="font-medium text-gray-900">{booking.route_name || 'Strategic Deployment'}</span></p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <p className="text-xl font-black text-gray-900">IDR {parseInt(booking.total_price).toLocaleString('id-ID')}</p>
                        <div className="flex gap-2 mt-2">
                          {booking.status !== 'cancelled' && (
                            <>
                              <button
                                onClick={() => navigate(`/booking/${booking.id}/ticket`)}
                                className="px-4 py-2 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-gray-800 transition-all shadow-md"
                              >
                                View Ticket
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm("Are you sure you want to cancel this booking?")) {
                                    const token = localStorage.getItem('token');
                                    fetch(`/api/bookings/${booking.id}`, {
                                      method: 'DELETE',
                                      headers: { 'Authorization': `Bearer ${token}` }
                                    })
                                      .then(res => res.json())
                                      .then(data => {
                                        if (data.message) {
                                          alert("Booking cancelled.");
                                          window.location.reload();
                                        } else {
                                          alert(data.error || "Failed to cancel");
                                        }
                                      });
                                  }
                                }}
                                className="px-4 py-2 border-2 border-red-500 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-50 transition-all"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-10 text-center text-gray-500">
                You have no bookings yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </GuestLayout>
  );
}
