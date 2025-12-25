import React from 'react';
import { Bus, Users, MapPin, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

export default function ResourceSidebar({ armadas, crews }) {
  const availableBuses = armadas.filter(a => a.status === 'available');
  const activeCrews = crews.filter(c => c.status === 'Active');
  const inMaintenance = armadas.filter(a => a.status === 'maintenance');

  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-100 w-64 animate-fade-in-right overflow-hidden shadow-2xl">
      <div className="p-4 border-b border-gray-100 bg-gray-50/50">
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Resource Monitor</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        {/* Available Buses */}
        <section>
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <Bus size={12} className="text-green-500" /> Available Busses
            </h4>
            <span className="text-[10px] font-black bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full">{availableBuses.length}</span>
          </div>
          <div className="space-y-2">
            {availableBuses.length === 0 && <p className="text-[10px] text-gray-300 italic">No buses available.</p>}
            {availableBuses.map(bus => (
              <div key={bus.id} className="p-2.5 rounded-xl border border-gray-50 bg-gray-50/30 hover:bg-white hover:border-gray-200 hover:shadow-sm transition-all group">
                <div className="flex justify-between items-start">
                  <span className="text-[11px] font-bold text-gray-800 truncate pr-2">{bus.name}</span>
                  <span className="text-[9px] font-mono text-gray-400">{bus.license_plate}</span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-[9px] px-1.5 py-0.5 bg-white border border-gray-100 rounded-md text-gray-500 font-bold">{bus.level}</span>
                  <span className="text-[9px] text-gray-400 font-bold">{bus.capacity} Seats</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Active Crews */}
        <section>
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <Users size={12} className="text-blue-500" /> Ready Crews
            </h4>
            <span className="text-[10px] font-black bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full">{activeCrews.length}</span>
          </div>
          <div className="space-y-2">
            {activeCrews.length === 0 && <p className="text-[10px] text-gray-300 italic">No crews ready.</p>}
            {activeCrews.map(crew => (
              <div key={crew.id} className="p-2.5 rounded-xl border border-gray-50 bg-gray-50/30 hover:bg-white hover:border-gray-200 hover:shadow-sm transition-all">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${crew.role === 'Driver' ? 'bg-indigo-100 text-indigo-600' : 'bg-orange-100 text-orange-600'}`}>
                    {crew.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-gray-800 leading-none">{crew.name}</p>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{crew.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Maintenance Alert */}
        {inMaintenance.length > 0 && (
          <section className="pt-2">
            <div className="p-3 rounded-xl bg-red-50 border border-red-100">
              <h4 className="text-[10px] font-black text-red-700 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <AlertTriangle size={12} /> Under Maintenance
              </h4>
              <div className="space-y-1.5">
                {inMaintenance.map(bus => (
                  <div key={bus.id} className="flex justify-between items-center text-[10px]">
                    <span className="text-red-900 font-medium truncate pr-2">{bus.name}</span>
                    <Clock size={10} className="text-red-400" />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>

      <div className="p-4 bg-gray-900 text-white border-t border-gray-800">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Live Pulse</span>
        </div>
        <p className="text-[10px] text-gray-500 leading-relaxed italic">"Fleet status is updated in real-time based on operational triggers."</p>
      </div>
    </div>
  );
}
