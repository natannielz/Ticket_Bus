import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Bus, Users, ShieldCheck, ShieldAlert, Zap, ZapOff, Trash2, Search, CheckCircle, Settings, AlertCircle, Radio } from 'lucide-react';
import { io } from 'socket.io-client';

const socket = io(window.location.origin.replace('5173', '3005')); // Adjust port for backend if needed

export default function SchedulePanel({ schedules, armadas, crews, onRefresh }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);

  const [form, setForm] = useState({
    days: '',
    departure_time: '',
    arrival_time: '',
    price: 0,
    price_weekend: 0,
    driver_id: '',
    conductor_id: '',
    armada_id: ''
  });

  const handleAnnounceDelay = (schedule) => {
    const mins = prompt("How many minutes delay?", "15");
    if (mins) {
      const reason = prompt("Reason for delay?", "Traffic Congestion");
      socket.emit('broadcast_delay', {
        schedule_id: schedule.id,
        route_name: schedule.route_name,
        delay_mins: mins,
        reason: reason
      });
      alert(`Delay of ${mins}m announced for ${schedule.route_name}`);
    }
  };

  const handleToggle = async (id) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/admin/schedules/${id}/toggle-live`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      onRefresh();
    }
  };

  const handleEdit = (schedule) => {
    setForm({
      days: schedule.days,
      departure_time: schedule.departure_time,
      arrival_time: schedule.arrival_time,
      price: schedule.price,
      price_weekend: schedule.price_weekend,
      driver_id: schedule.driver_id,
      conductor_id: schedule.conductor_id,
      armada_id: schedule.armada_id
    });
    setEditingId(schedule.id);
    setIsEditing(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/admin/schedules/${editingId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(form)
    });

    if (res.ok) {
      setIsEditing(false);
      setEditingId(null);
      onRefresh();
    } else {
      const err = await res.json();
      alert(err.error || "Failed to update schedule");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this schedule? This action cannot be undone.")) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/admin/schedules/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      onRefresh();
    }
  };

  const filteredSchedules = schedules.filter(s =>
    s.route_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.armada_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.driver_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const drivers = crews.filter(c => c.role === 'Driver');
  const conductors = crews.filter(c => c.role === 'Conductor');

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Operational Schedules</h2>
          <p className="text-sm text-gray-500">The "Glue" that links routes, armadas, and crews.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all
              ${isSimulating ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-gray-400 border border-gray-100 hover:border-gray-200'}
            `}
          >
            <Radio size={16} className={isSimulating ? 'animate-pulse' : ''} />
            {isSimulating ? 'Simulation Active' : 'Start Simulation'}
          </button>
          <div className="relative flex-1 md:w-64">
            <input
              type="text"
              placeholder="Search schedules..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border-gray-200 text-sm focus:ring-black focus:border-black"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
          </div>
        </div>
      </div>

      {isSimulating && (
        <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl animate-fade-in flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Radio size={20} className="text-indigo-600 animate-ping" />
            <div>
              <p className="text-[10px] font-black text-indigo-700 uppercase tracking-widest leading-none">Live Ops Intelligence</p>
              <p className="text-xs font-bold text-indigo-900 mt-1">Simulating real-time fleet movement across {schedules.filter(s => s.is_live).length} active routes.</p>
            </div>
          </div>
          <p className="text-[10px] bg-white px-3 py-1 rounded-full font-black text-indigo-600 border border-indigo-200">DEMO MODE</p>
        </div>
      )}

      {isEditing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-2xl animate-fade-in-up">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Calendar size={20} className="text-indigo-600" /> Edit Operational Strategy
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-widest">Operating Days</label>
                  <input required className="w-full rounded-xl border-gray-200 focus:ring-black focus:border-black text-sm" placeholder="e.g. Monday, Wednesday" value={form.days} onChange={e => setForm({ ...form, days: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-widest">Assigned Armada</label>
                  <select required className="w-full rounded-xl border-gray-200 focus:ring-black focus:border-black text-sm" value={form.armada_id} onChange={e => setForm({ ...form, armada_id: e.target.value })}>
                    {armadas.map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({a.license_plate})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-widest">Dep. Time</label>
                  <input type="time" required className="w-full rounded-xl border-gray-200 focus:ring-black focus:border-black text-sm" value={form.departure_time} onChange={e => setForm({ ...form, departure_time: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-widest">Arr. Time</label>
                  <input type="time" required className="w-full rounded-xl border-gray-200 focus:ring-black focus:border-black text-sm" value={form.arrival_time} onChange={e => setForm({ ...form, arrival_time: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-widest">Driver</label>
                  <select required className="w-full rounded-xl border-gray-200 focus:ring-black focus:border-black text-sm" value={form.driver_id} onChange={e => setForm({ ...form, driver_id: e.target.value })}>
                    <option value="">-- Select --</option>
                    {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-widest">Conductor</label>
                  <select required className="w-full rounded-xl border-gray-200 focus:ring-black focus:border-black text-sm" value={form.conductor_id} onChange={e => setForm({ ...form, conductor_id: e.target.value })}>
                    <option value="">-- Select --</option>
                    {conductors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition-all">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 shadow-lg shadow-gray-200 transition-all flex items-center justify-center gap-2">
                  <ShieldCheck size={16} /> Update Strategy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {filteredSchedules.map(schedule => {
          const isFlagged = schedule.needs_reassignment === 1;
          const isLive = schedule.is_live === 1;

          return (
            <div key={schedule.id} className={`bg-white rounded-2xl border-2 transition-all overflow-hidden ${isFlagged ? 'border-red-100 shadow-lg shadow-red-50' : 'border-gray-50 hover:border-gray-200'}`}>
              <div className="flex flex-col md:flex-row">
                <div className={`w-2 ${isLive ? 'bg-green-500' : 'bg-gray-300'} ${isFlagged && 'animate-pulse bg-red-500'}`}></div>
                <div className="flex-1 p-6">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <h3 className="text-lg font-bold text-gray-900">{schedule.route_name}</h3>
                    <span className="px-2 py-0.5 bg-gray-100 rounded text-[10px] font-black text-gray-500 uppercase tracking-widest">SCH-{schedule.id}</span>
                    {isFlagged && (
                      <span className="px-3 py-1 bg-red-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                        <ShieldAlert size={12} /> Reassignment Required
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <Bus size={16} className="text-indigo-500" />
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Armada</p>
                        <p className="font-medium">{schedule.armada_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <Users size={16} className="text-indigo-500" />
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Crew</p>
                        <p className="font-medium">{schedule.driver_name} & {schedule.conductor_name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Departure</p>
                      <p className="text-lg font-black text-gray-900">{schedule.departure_time}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50/50 p-6 flex flex-row md:flex-col items-center justify-center gap-4 border-l border-gray-100">
                  <button onClick={() => handleToggle(schedule.id)} className={`p-4 rounded-2xl transition-all ${isLive ? 'bg-green-500 text-white shadow-lg' : 'bg-white text-gray-400 border border-gray-100'}`}>
                    {isLive ? <Zap size={18} fill="white" /> : <ZapOff size={18} />}
                  </button>

                  <div className="flex flex-row md:flex-col gap-2">
                    {isLive && (
                      <button onClick={() => handleAnnounceDelay(schedule)} className="p-2 text-orange-400 hover:text-orange-600 transition-colors uppercase text-[9px] font-black tracking-widest">
                        <AlertCircle size={14} className="mx-auto" /> Delay
                      </button>
                    )}
                    <button onClick={() => handleEdit(schedule)} className="p-2 text-gray-400 hover:text-indigo-600 transition-colors">
                      <Settings size={14} />
                    </button>
                    <button onClick={() => handleDelete(schedule.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
              <div className={`px-6 py-2 text-[9px] font-black uppercase tracking-widest flex justify-between ${isLive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                <span>{schedule.days}</span>
                <span>{isLive ? 'LIVE ON PLATFORM' : 'INTERNAL STRATEGY'}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


