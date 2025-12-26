import React, { useState } from 'react';
import { MapPin, Search, Navigation, Map as MapIcon, ChevronRight, Clock, Hash, Trash2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function RouteRegistry({ routes, stops, onRefresh }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoute, setSelectedRoute] = useState(null);

  const filteredRoutes = routes.filter(r =>
    r.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.origin?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.destination?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this route? This will also affect any schedules using it.")) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/admin/routes/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      onRefresh();
      if (selectedRoute?.id === id) setSelectedRoute(null);
    } else {
      const data = await res.json();
      alert(data.message || "Failed to delete route");
    }
  };

  const getRouteStops = (routeId) => {
    return (stops || []).filter(s => s.route_id === routeId).sort((a, b) => a.stop_order - b.stop_order);
  };

  const parseCoordinates = (coordString) => {
    try {
      return JSON.parse(coordString);
    } catch (e) {
      // If it's just "lat, lng" format
      if (typeof coordString === 'string' && coordString.includes(',')) {
        const [lat, lng] = coordString.split(',').map(Number);
        return [{ lat, lng }];
      }
      return [];
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-[700px] bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">

      {/* Route List Sidebar */}
      <div className="w-full md:w-96 flex flex-col border-r border-gray-100 bg-gray-50/30">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Route Registry</h2>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Master Logistics Database</p>

          <div className="relative mb-6">
            <input
              type="text"
              placeholder="Search route paths..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border-gray-200 text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-3 text-gray-400" size={16} />
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[480px] custom-scrollbar pr-2">
            {filteredRoutes.map(route => {
              const routeStops = getRouteStops(route.id);
              const isSelected = selectedRoute?.id === route.id;

              return (
                <div
                  key={route.id}
                  onClick={() => setSelectedRoute(route)}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all hover:scale-[1.02] active:scale-95 group
                    ${isSelected ? 'border-indigo-600 bg-white shadow-lg' : 'border-white bg-white/60 hover:bg-white'}
                  `}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-sm font-bold text-gray-900 line-clamp-1">{route.name}</h3>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(route.id); }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-red-500 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-gray-500 font-medium mb-3">
                    <Navigation size={12} className="text-indigo-500" />
                    <span>{route.origin.split(',')[0]}</span>
                    <ChevronRight size={10} />
                    <span>{route.destination.split(',')[0]}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex gap-1.5">
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                        <MapPin size={10} /> {routeStops.length} Stops
                      </span>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                        <Clock size={10} /> {route.duration}
                      </span>
                    </div>
                    <span className="text-[9px] font-black text-gray-300">#{route.id.toString().padStart(3, '0')}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Route Detail & Mini Map */}
      <div className="flex-1 relative flex flex-col">
        {selectedRoute ? (
          <>
            <div className="absolute top-6 left-6 right-6 z-[1000] flex flex-col md:flex-row gap-4 pointer-events-none">
              <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-white/50 flex-1 pointer-events-auto">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-black text-gray-900 leading-tight">{selectedRoute.name}</h2>
                    <p className="text-xs text-gray-500 mt-1">{selectedRoute.description || 'No description available for this strategic path.'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Total Distance</p>
                    <p className="text-xl font-black text-gray-900">{selectedRoute.distanceKm?.toFixed(1)} <span className="text-xs">KM</span></p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900/90 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-gray-700 w-full md:w-64 pointer-events-auto overflow-y-auto max-h-48 custom-scrollbar">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Hash size={10} /> Operational Waypoints
                </p>
                <div className="space-y-3">
                  {getRouteStops(selectedRoute.id).map((stop, idx) => (
                    <div key={stop.id} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-indigo-500 text-white text-[9px] font-black flex items-center justify-center shrink-0">{idx + 1}</div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-white truncate">{stop.name}</p>
                        <p className="text-[8px] text-gray-400 uppercase tracking-widest">{stop.type} • {stop.time_spent}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex-1 z-0">
              <MapContainer
                key={selectedRoute.id}
                center={parseCoordinates(selectedRoute.coordinates)[0] || [-6.2088, 106.8456]}
                zoom={10}
                className="h-full w-full"
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Polyline positions={parseCoordinates(selectedRoute.coordinates)} color="#4f46e5" weight={6} opacity={0.7} />
                <Polyline positions={parseCoordinates(selectedRoute.coordinates)} color="#818cf8" weight={2} opacity={1} dashArray="5, 10" />

                {getRouteStops(selectedRoute.id).map(stop => (
                  <Marker key={stop.id} position={[stop.latitude, stop.longitude]}>
                    <Popup>
                      <div className="text-xs font-bold text-gray-900">{stop.name}</div>
                      <div className="text-[10px] text-gray-500">{stop.type} | Fee: {stop.fee}</div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 text-gray-400 p-12 text-center">
            <div className="w-24 h-24 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-6">
              <MapIcon size={48} className="opacity-10" />
            </div>
            <h3 className="text-lg font-bold text-gray-600">No Route Selected</h3>
            <p className="text-sm max-w-xs mt-2">Select a strategic path from the registry to view logistics data and interactive waypoints.</p>
          </div>
        )}
      </div>
    </div>
  );
}
