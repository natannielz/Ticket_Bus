import React, { useState, useEffect } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ArrowUp, ArrowDown, Activity, Users, Bus, CreditCard, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalBookings: 0,
    totalArmadas: 0,
    totalUsers: 0,
    bookings: [],
    revenueData: [],
    occupancyData: [],
    upcomingDepartures: [],
    revenueTrend: 0,
    bookingsTrend: 0
  });
  const [filter, setFilter] = useState('Today'); // Today, Week, Month
  const COLORS = ['#3b82f6', '#e5e7eb'];

  useEffect(() => {
    // Fetch dashboard data
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    fetch('/api/admin/dashboard', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (res.status === 401 || res.status === 403) {
          window.location.href = '/login';
          throw new Error("Unauthorized");
        }
        return res.json();
      })
      .then(data => {
        if (data) {
          setStats({
            ...data,
            // Safe fallbacks to prevent crashes
            occupancyData: data.occupancyData || [],
            revenueData: data.revenueData || [],
            bookings: data.bookings || [],
            upcomingDepartures: data.upcomingDepartures || [],
            revenueTrend: 12.5, // Mock for now
            bookingsTrend: -2.4 // Mock for now
          });
        }
      })
      .catch(err => console.error(err));
  }, [filter]);

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Pusat Komando (Command Center)</h1>
          <p className="text-gray-500 text-sm mt-1">Real-time operational overview and performance analytics.</p>
        </div>
        <div className="flex bg-white rounded-lg p-1 shadow-sm border border-gray-200">
          {['Today', 'This Week', 'This Month'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-xs font-semibold rounded-md transition-all ${filter === f ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Revenue */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 group hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <CreditCard size={24} />
            </div>
          </div>
          <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Total Revenue</div>
          <div className="text-2xl font-black text-gray-900 mt-1">IDR {parseInt(stats.totalRevenue).toLocaleString('id-ID')}</div>
          <div className="text-[10px] text-gray-400 mt-2 uppercase font-bold tracking-widest">Lifetime Earnings</div>
        </div>

        {/* Active Buses */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 group hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
              <Bus size={24} />
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-green-50 text-green-600 uppercase">
              Operational
            </div>
          </div>
          <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Active Buses</div>
          <div className="text-2xl font-black text-gray-900 mt-1">{stats.activeBuses || 0} <span className="text-sm font-normal text-gray-400">/ {stats.totalArmadas}</span></div>
          <div className="text-[10px] text-gray-400 mt-2 uppercase font-bold tracking-widest">Available & On-Trip</div>
        </div>

        {/* On-Duty Crews */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 group hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
              <Users size={24} />
            </div>
          </div>
          <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider">On-Duty Crews</div>
          <div className="text-2xl font-black text-gray-900 mt-1">{stats.onDutyCrews || 0}</div>
          <div className="text-[10px] text-gray-400 mt-2 uppercase font-bold tracking-widest">Active Personnel</div>
        </div>

        {/* Today's Schedules */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 group hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
              <Clock size={24} />
            </div>
          </div>
          <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Today's Schedules</div>
          <div className="text-2xl font-black text-gray-900 mt-1">{stats.todaySchedules || 0}</div>
          <div className="text-[10px] text-gray-400 mt-2 uppercase font-bold tracking-widest">Live Deployments</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100 min-w-0">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Activity size={20} className="text-gray-400" /> Revenue Trend
          </h3>
          <div className="w-full h-[300px] min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <LineChart data={stats.revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Occupancy Pie Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 min-w-0">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Fleet Occupancy</h3>
          <div className="w-full relative h-[300px] min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <PieChart>
                <Pie
                  data={stats.occupancyData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.occupancyData?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-gray-900">57%</span>
              <span className="text-xs text-gray-400 uppercase">Occupied</span>
            </div>
          </div>
          <div className="flex justify-center gap-4 mt-4">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span> Occupied
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="w-2 h-2 rounded-full bg-gray-200"></span> Empty
            </div>
          </div>
        </div>
      </div>

      {/* Two Columns: Operational & Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Operational Widget */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Clock size={20} className="text-orange-500" /> Operational Today
            </h3>
            <span className="text-xs font-bold bg-orange-100 text-orange-700 px-2 py-1 rounded">Next 1 Hour</span>
          </div>
          <div className="p-4 space-y-3">
            {stats.upcomingDepartures.map(d => (
              <div key={d.id} className="flex justify-between items-center p-3 border border-gray-100 rounded-lg hover:border-gray-200 transition-all bg-white shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                    <Bus size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">{d.bus} <span className="font-normal text-gray-400 text-xs">({d.plate})</span></h4>
                    <p className="text-xs text-gray-500">{d.route}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">{d.time}</div>
                  <div className={`text-xs font-bold ${d.driver_status === 'Ready' ? 'text-green-600' : 'text-yellow-600'}`}>
                    Driver: {d.driver_status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900">Recent Transactions</h3>
            <button className="text-sm text-accent font-bold hover:underline">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <tbody>
                {stats.bookings.slice(0, 5).map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-xs">
                          {booking.user?.name ? booking.user.name.charAt(0) : 'G'}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900">{booking.user?.name || 'Guest'}</div>
                          <div className="text-xs text-gray-400">#{booking.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-bold text-gray-500 uppercase">Total</div>
                      <div className="text-sm font-bold text-gray-900">IDR {parseInt(booking.total_price).toLocaleString('id-ID')}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                                                ${booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {stats.bookings.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-400 italic">No recent transactions.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
