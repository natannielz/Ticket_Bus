import React from 'react';
import { Calendar, Clock, MapPin, Bus, Users, ShieldCheck, ShieldAlert, Zap, ZapOff, Trash2 } from 'lucide-react';

export default function SchedulePanel({ schedules, onToggleLive, onRefresh }) {
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Operational Schedules</h2>
          <p className="text-sm text-gray-500">The "Glue" that links routes, armadas, and crews.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {schedules.length === 0 && (
          <div className="bg-white p-12 rounded-2xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-gray-400">
            <Calendar size={48} className="mb-4 opacity-20" />
            <p className="font-bold">No active schedules found.</p>
            <p className="text-sm">Create a new strategy in the Map Strategy tab.</p>
          </div>
        )}

        {schedules.map(schedule => {
          const isFlagged = schedule.needs_reassignment === 1;
          const isLive = schedule.is_live === 1;

          return (
            <div key={schedule.id} className={`bg-white rounded-2xl border-2 transition-all overflow-hidden ${isFlagged ? 'border-red-100 shadow-lg shadow-red-50' : 'border-gray-50 hover:border-gray-200'}`}>
              <div className="flex flex-col md:flex-row">

                {/* Status Indicator Bar */}
                <div className={`w-2 ${isLive ? 'bg-green-500' : 'bg-gray-300'} ${isFlagged && 'animate-pulse bg-red-500'}`}></div>

                {/* Main Info */}
                <div className="flex-1 p-6">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <h3 className="text-lg font-bold text-gray-900">{schedule.route_name}</h3>
                    <span className="px-2 py-0.5 bg-gray-100 rounded text-[10px] font-black text-gray-500 uppercase tracking-widest">ID: SCH-{schedule.id.toString().padStart(4, '0')}</span>
                    {isFlagged && (
                      <span className="px-3 py-1 bg-red-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 animate-bounce">
                        <ShieldAlert size={12} /> Resource Reassignment Required
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <MapPin size={16} className="text-gray-400" />
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Route Path</p>
                          <p className="font-medium">{schedule.route_name || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <Bus size={16} className="text-gray-400" />
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Assigned Armada</p>
                          <p className={`font-medium ${isFlagged ? 'text-red-600 font-bold' : ''}`}>{schedule.armada_name}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <Users size={16} className="text-gray-400" />
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Crew</p>
                          <p className="font-medium">{schedule.driver_name} (D) / {schedule.conductor_name} (C)</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 text-right">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Suggested Price</p>
                      <p className="text-xl font-black text-gray-900">IDR {schedule.price?.toLocaleString('id-ID')}</p>
                      <p className="text-[10px] text-gray-500 font-bold italic">{schedule.days}</p>
                    </div>
                  </div>
                </div>

                {/* Control Panel */}
                <div className="bg-gray-50/50 p-6 flex flex-row md:flex-col items-center justify-center gap-4 border-l border-gray-100">
                  <button
                    onClick={() => handleToggle(schedule.id)}
                    className={`p-4 rounded-2xl transition-all shadow-lg flex items-center gap-2 font-black text-xs uppercase tracking-widest
                      ${isLive ? 'bg-green-500 text-white hover:bg-green-600 shadow-green-100' : 'bg-white text-gray-400 border border-gray-200 hover:bg-gray-50 shadow-none'}
                    `}
                  >
                    {isLive ? <Zap size={18} fill="white" /> : <ZapOff size={18} />}
                    {isLive ? 'Live' : 'Draft'}
                  </button>

                  <button
                    onClick={() => handleDelete(schedule.id)}
                    className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-1"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>

              {/* Footer Status */}
              <div className={`px-6 py-2 text-[10px] font-black uppercase tracking-[0.2em] flex justify-between items-center ${isLive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                <div className="flex items-center gap-2">
                  <Clock size={12} /> Departure: {schedule.departure_time} — Arrival: {schedule.arrival_time}
                </div>
                <div>{isLive ? 'VISIBLE TO CUSTOMERS' : 'INTERNAL ONLY'}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
