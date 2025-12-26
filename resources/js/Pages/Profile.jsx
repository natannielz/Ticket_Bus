import React, { useState, useEffect } from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import { User, Mail, Shield, MapPin, Bus, Calendar, LogOut, Edit2, Save, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || {});
  const [stats, setStats] = useState({ totalBookings: 0, distance: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: user.name || '', email: user.email || '' });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }

    // Fetch personal stats
    fetch('/api/bookings', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        if (data.data) {
          setStats({
            totalBookings: data.data.length,
            distance: data.data.reduce((acc, curr) => acc + (curr.distanceKm || 0), 0)
          });
        }
      });
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
    window.location.reload();
  };

  return (
    <GuestLayout>
      <div className="bg-gray-50 min-h-screen py-12 px-4">
        <div className="max-w-4xl mx-auto">

          <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden border border-gray-100">
            {/* Cover / Profile Header */}
            <div className="h-48 bg-black relative">
              <div className="absolute -bottom-16 left-12 w-32 h-32 rounded-[32px] bg-white p-2 shadow-2xl border border-gray-100 flex items-center justify-center">
                <div className="w-full h-full rounded-[24px] bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <User size={48} />
                </div>
              </div>
            </div>

            <div className="pt-20 px-12 pb-12">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <h1 className="text-3xl font-black text-gray-900 tracking-tight">{user.name}</h1>
                  <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-1 flex items-center gap-2">
                    <Shield size={12} className="text-indigo-500" /> Authorized {user.role || 'Passenger'} Agent
                  </p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setIsEditing(!isEditing)} className="px-6 py-3 border-2 border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-black transition-all">
                    {isEditing ? 'Cancel Edit' : 'Modify Credentials'}
                  </button>
                  <button onClick={handleLogout} className="px-6 py-3 bg-red-50 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center gap-2">
                    <LogOut size={14} /> Exit System
                  </button>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-2"><Bus size={14} /> Missions Completed</p>
                  <p className="text-3xl font-black text-gray-900">{stats.totalBookings}</p>
                </div>
                <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-2"><MapPin size={14} /> Trajectories Traversed</p>
                  <p className="text-3xl font-black text-gray-900">{stats.distance.toFixed(0)} <span className="text-sm">KM</span></p>
                </div>
                <div className="p-6 bg-black rounded-3xl text-white shadow-xl shadow-gray-200">
                  <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1 flex items-center gap-2"><Calendar size={14} /> Deployment Status</p>
                  <p className="text-3xl font-black">ACTIVE</p>
                </div>
              </div>

              {/* Profile Form / Info */}
              <div className="mt-12 space-y-8 max-w-2xl">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Mail size={12} /> Communication Endpoint</label>
                  {isEditing ? (
                    <input className="w-full bg-gray-50 border-gray-100 rounded-xl font-bold p-3" value={formData.email} disabled />
                  ) : (
                    <p className="text-gray-900 font-bold px-1">{user.email}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><User size={12} /> Identifiable Alias</label>
                  {isEditing ? (
                    <input className="w-full bg-gray-50 border-gray-100 rounded-xl font-bold p-3" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                  ) : (
                    <p className="text-gray-900 font-bold px-1">{user.name}</p>
                  )}
                </div>

                {isEditing && (
                  <button className="w-full py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                    <Save size={16} /> Synchronize Data
                  </button>
                )}
              </div>
            </div>
          </div>

          <p className="text-center mt-12 text-gray-400 text-[10px] font-black uppercase tracking-widest italic leading-relaxed">
            Secure Operational environment - Antigravity Systems v1.0 <br />
            Access restricted to authorized personnel only.
          </p>

        </div>
      </div>
    </GuestLayout>
  );
}
