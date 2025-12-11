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
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-accent">{booking.armada_name || `Armada #${booking.armada_id}`}</h3>
                        <p className="text-sm text-gray-500">Date: {booking.date}</p>
                        <p className="text-sm text-gray-500">Seats: {booking.seats}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-gray-900">IDR {parseInt(booking.total_price).toLocaleString('id-ID')}</p>
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full mt-1
                                            ${booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {booking.status}
                        </span>
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
