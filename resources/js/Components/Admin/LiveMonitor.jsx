import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { Radio, Users, Clock, AlertTriangle, Navigation, Zap } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom Bus Icon
import icon from 'leaflet/dist/images/marker-icon.png';
const BusIcon = L.divIcon({
  html: `<div class="w-8 h-8 bg-black rounded-full border-2 border-white shadow-xl flex items-center justify-center text-white"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/></svg></div>`,
  className: 'bg-transparent border-0',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -20]
});

export default function LiveMonitor({ schedules, routes }) {
  const [activeVehicles, setActiveVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  // Simulation Logic
  useEffect(() => {
    const liveSchedules = schedules.filter(s => s.is_live === 1);

    // Initialize Mock Positions
    const initialVehicles = liveSchedules.map(sched => {
      const route = routes.find(r => r.id === sched.route_id);
      let path = [];
      try {
        path = JSON.parse(route?.coordinates || '[]');
      } catch (e) { console.error("Parse Error", e); }

      // Default fallback path if empty
      if (path.length < 2) path = [{ lat: -6.2, lng: 106.8 }, { lat: -6.3, lng: 106.9 }];

      return {
        id: sched.id,
        schedule: sched,
        routePath: path,
        progress: Math.random(), // Start at random random progress
        direction: 1, // 1 forward, -1 backward
        lat: path[0].lat,
        lng: path[0].lng
      };
    });

    setActiveVehicles(initialVehicles);

    // Animation Loop
    const interval = setInterval(() => {
      setActiveVehicles(prev => prev.map(v => {
        if (!v.routePath || v.routePath.length < 2) return v;

        // Move progress
        let newProgress = v.progress + 0.005 * v.direction; // Move 0.5% per tick

        // Bounce at ends
        if (newProgress >= 1) { newProgress = 1; v.direction = -1; }
        if (newProgress <= 0) { newProgress = 0; v.direction = 1; }

        // Interpolate Position
        const totalIdx = v.routePath.length - 1;
        const preciseIdx = newProgress * totalIdx;
        const idxA = Math.floor(preciseIdx);
        const idxB = Math.min(idxA + 1, totalIdx);
        const ratio = preciseIdx - idxA;

        const posA = v.routePath[idxA];
        const posB = v.routePath[idxB];

        const newLat = posA.lat + (posB.lat - posA.lat) * ratio;
        const newLng = posA.lng + (posB.lng - posA.lng) * ratio;

        return { ...v, progress: newProgress, lat: newLat, lng: newLng };
      }));
    }, 100); // 10fps for smooth-ish motion

    return () => clearInterval(interval);
  }, [schedules, routes]);

  return (
    <div className="flex flex-col md:flex-row h-[700px] bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">

      {/* Sidebar Info */}
      <div className="w-full md:w-80 flex flex-col border-r border-gray-100 bg-gray-900 text-white z-10">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <div>
              <h2 className="text-lg font-black tracking-tighter">LIVE MONITOR</h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Global Fleet Tracking</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-gray-800 border border-gray-700">
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Active Fleet</p>
              <p className="text-3xl font-black">{activeVehicles.length}</p>
            </div>

            <div className="p-4 rounded-2xl bg-gray-800 border border-gray-700">
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">System Status</p>
              <div className="flex items-center gap-2 text-green-400 text-xs font-bold">
                <Zap size={14} /> OPTIMAL
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2 mb-2">Deployed Units</p>
          {activeVehicles.map(v => (
            <div
              key={v.id}
              onClick={() => setSelectedVehicle(v)}
              className={`p-3 rounded-xl border border-gray-800 cursor-pointer transition-all hover:bg-gray-800
                 ${selectedVehicle?.id === v.id ? 'bg-gray-800 border-indigo-500 shadow-lg shadow-indigo-500/20' : 'bg-transparent'}
               `}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs">{v.schedule.armada_name}</span>
                <span className="text-[9px] font-black bg-indigo-500 px-1.5 py-0.5 rounded text-white">{Math.round(v.progress * 100)}%</span>
              </div>
              <div className="text-[10px] text-gray-400 truncate">{v.schedule.route_name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer center={[-6.2088, 106.8456]} zoom={11} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />

          {/* Render all routes faintly */}
          {routes.map(r => {
            let path = [];
            try { path = JSON.parse(r.coordinates || '[]'); } catch (e) { }
            return path.length > 1 && <Polyline key={r.id} positions={path} color="#334155" weight={2} opacity={0.3} />;
          })}

          {/* Render Active Vehicles */}
          {activeVehicles.map(v => (
            <Marker key={v.id} position={[v.lat, v.lng]} icon={BusIcon} zIndexOffset={selectedVehicle?.id === v.id ? 1000 : 0}>
              <Popup className="custom-popup">
                <div className="p-1">
                  <div className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Unit {v.id}</div>
                  <div className="font-bold text-gray-900 text-sm mb-1">{v.schedule.armada_name}</div>
                  <div className="text-xs text-indigo-600 font-bold">{v.schedule.route_name}</div>
                  <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-2 text-[10px]">
                    <Users size={12} /> {v.schedule.driver_name}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Overlay for selected */}
        {selectedVehicle && (
          <div className="absolute bottom-6 left-6 right-6 p-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl text-white flex items-center justify-between animate-fade-in-up z-[1000]">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center font-black shadow-lg shadow-indigo-500/50">
                <Navigation size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Tracking Target</p>
                <p className="text-lg font-bold">{selectedVehicle.schedule.armada_name}</p>
                <p className="text-xs opacity-80">{selectedVehicle.schedule.route_name}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black font-mono">{Math.round(selectedVehicle.progress * 100)}<span className="text-sm">%</span></p>
              <p className="text-[10px] uppercase tracking-widest opacity-60">Completion</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
