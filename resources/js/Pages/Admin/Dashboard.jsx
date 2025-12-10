import React, { useState, useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function Dashboard({ bookings, totalArmadas, totalBookings, totalUsers, totalRevenue }) {
  const [toast, setToast] = useState(null);
  const { post } = useForm();
  const [loadingReceipt, setLoadingReceipt] = useState(null);

  useEffect(() => {
    // Listen to Reverb/Pusher channel
    window.Echo.channel('admin-channel')
      .listen('NewOrderReceived', (e) => {
        console.log('Order received:', e);
        showToast(`New booking from ID: ${e.booking.user_id} - IDR ${e.booking.total_price}`);
      });
  }, []);

  const showToast = (message) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast(null), 5000);
  };

  const sendReceipt = (bookingId) => {
    setLoadingReceipt(bookingId);
    post(route('admin.bookings.sendReceipt', bookingId), {
      onFinish: () => {
        setLoadingReceipt(null);
        // In a real app, you'd trigger a success toast here
        showToast('Receipt Sent Successfully!');
      }
    });
  };

  return (
    <AdminLayout>
      <Head title="Admin Dashboard" />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-card p-6 shadow-soft border-l-4 border-indigo-500">
          <div className="text-sm font-medium text-gray-500 uppercase">Total Revenue</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">IDR {parseInt(totalRevenue).toLocaleString('id-ID')}</div>
        </div>
        <div className="bg-white rounded-card p-6 shadow-soft border-l-4 border-emerald-500">
          <div className="text-sm font-medium text-gray-500 uppercase">Total Bookings</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">{totalBookings}</div>
        </div>
        <div className="bg-white rounded-card p-6 shadow-soft border-l-4 border-blue-500">
          <div className="text-sm font-medium text-gray-500 uppercase">Total Fleet</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">{totalArmadas}</div>
        </div>
        <div className="bg-white rounded-card p-6 shadow-soft border-l-4 border-orange-500">
          <div className="text-sm font-medium text-gray-500 uppercase">Total Users</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">{totalUsers}</div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-white rounded-card shadow-soft overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900">Recent Transactions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 uppercase text-xs tracking-wider">
                <th className="px-6 py-4 font-semibold">ID</th>
                <th className="px-6 py-4 font-semibold">User</th>
                <th className="px-6 py-4 font-semibold">Bus</th>
                <th className="px-6 py-4 font-semibold">Total</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">#{booking.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{booking.user?.name || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{booking.armada?.name || '-'}</td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">IDR {parseInt(booking.total_price).toLocaleString('id-ID')}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                                            ${booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-right">
                    <button
                      onClick={() => sendReceipt(booking.id)}
                      disabled={loadingReceipt === booking.id}
                      className="text-accent-blue hover:text-accent font-medium text-xs uppercase tracking-wide disabled:opacity-50"
                    >
                      {loadingReceipt === booking.id ? 'Sending...' : 'Send Receipt'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Real-time Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-slide-in-right">
          <div className="bg-white/80 backdrop-blur-md border-l-4 border-green-500 rounded-lg shadow-2xl p-4 flex items-start w-80">
            <div className="flex-shrink-0 pt-0.5">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-bold text-gray-900">New Order Received</p>
              <p className="text-sm text-gray-600 mt-1">{toast.message}</p>
              <p className="text-xs text-gray-400 mt-1">Just now</p>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
