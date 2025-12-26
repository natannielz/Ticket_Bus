import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents, Tooltip as LeafletTooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { MapPin, Plus, Save, Flag, DollarSign, Calculator, Trash2, ArrowRight, AlertTriangle } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';
import ResourceSidebar from './ResourceSidebar';

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

const createCustomIcon = (iconComponent, color = 'blue') => {
  const iconHtml = renderToStaticMarkup(
    <div className={`p-1.5 rounded-full border-2 border-white shadow-lg ${color === 'red' ? 'bg-red-500' : color === 'green' ? 'bg-green-500' : color === 'blue' ? 'bg-blue-500' : 'bg-gray-800'} flex items-center justify-center`}>
      {iconComponent}
    </div>
  );
  return L.divIcon({
    html: iconHtml,
    className: 'custom-leaflet-icon bg-transparent border-none',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

const startIcon = createCustomIcon(<Flag size={16} className="text-white" fill="white" />, 'green');
const endIcon = createCustomIcon(<Flag size={16} className="text-white" fill="white" />, 'red');
const stopIcon = createCustomIcon(<MapPin size={16} className="text-white" />, 'blue');

function LocationMarker({ points, setPoints, stops, setStops, activeMode, routePath }) {
  useMapEvents({
    click(e) {
      if (activeMode === 'route') {
        if (points.length < 2) {
          setPoints([...points, e.latlng]);
        } else if (confirm("Reset Start/End points?")) {
          setPoints([e.latlng]);
        }
      } else if (activeMode === 'stop') {
        const newStop = {
          id: `temp-${Date.now()}`,
          name: 'New Stop',
          type: 'rest',
          latitude: e.latlng.lat,
          longitude: e.latlng.lng,
          time_spent: '15 mins',
          fee: 'Free'
        };
        setStops([...stops, newStop]);
      }
    },
  });

  return (
    <>
      {points.map((pos, idx) => (
        <Marker key={`point-${idx}`} position={pos} icon={idx === 0 ? startIcon : endIcon}>
          <Popup>{idx === 0 ? "Start" : "End"}</Popup>
          <LeafletTooltip direction="top" offset={[0, -20]} opacity={1} permanent className={`font-bold ${idx === 0 ? 'text-green-700 bg-green-50 border-green-200' : 'text-red-700 bg-red-50 border-red-200'}`}>
            {idx === 0 ? "START" : "END"}
          </LeafletTooltip>
        </Marker>
      ))}

      {stops.map((stop, idx) => (
        <Marker key={stop.id} position={[stop.latitude, stop.longitude]} icon={stopIcon} draggable={true}
          eventHandlers={{
            dragend: (e) => {
              const newLoc = e.target.getLatLng();
              setStops(prev => prev.map(s => s.id === stop.id ? { ...s, latitude: newLoc.lat, longitude: newLoc.lng } : s));
            }
          }}
        >
          <Popup><strong>{stop.name}</strong><br />{stop.type} | {stop.time_spent}</Popup>
          <LeafletTooltip direction="top" offset={[0, -20]} opacity={0.8}>{idx + 1}</LeafletTooltip>
        </Marker>
      ))}

      {routePath && routePath.length > 0 ? (
        <>
          <Polyline positions={routePath} color="#3b82f6" weight={8} opacity={0.6} />
          <Polyline positions={routePath} color="#60a5fa" weight={3} opacity={1} dashArray="10, 10" />
        </>
      ) : (points.length > 1 && <Polyline positions={points} color="#94a3b8" dashArray="5,5" weight={3} />)}
    </>
  );
}

export default function MapStrategyTab({ armadas, crews, schedules = [], onRefresh }) {
  const [points, setPoints] = useState([]);
  const [routePath, setRoutePath] = useState([]);
  const [stops, setStops] = useState([]);
  const [activeMode, setActiveMode] = useState('route');
  const [isCalculating, setIsCalculating] = useState(false);
  const [distanceKm, setDistanceKm] = useState(0);
  const [estimatedPrice, setEstimatedPrice] = useState(0);

  const [form, setForm] = useState({
    name: '',
    description: '',
    duration: '',
    color: '#3b82f6',
    days: [],
    armada_id: '',
    departure_time: '08:00',
    arrival_time: '12:00',
    driver_id: '',
    conductor_id: ''
  });

  const daysOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Smart Filters
  const availableArmadas = armadas.filter(a => a.status === 'available');
  const activeDrivers = crews.filter(c => c.status === 'Active' && c.role === 'Driver');
  const activeConductors = crews.filter(c => c.status === 'Active' && c.role === 'Conductor');

  // Conflict Detection Helper - checks if any days overlap
  const checkDayOverlap = (existingDays, newDays) => {
    if (!existingDays || !newDays || newDays.length === 0) return false;
    const existingDayList = existingDays.split(',').map(d => d.trim());
    return newDays.some(day => existingDayList.includes(day));
  };

  // Check conflicts for selected resources
  const driverConflict = form.driver_id && form.days.length > 0
    ? schedules.find(s => s.driver_id == form.driver_id && checkDayOverlap(s.days, form.days))
    : null;

  const conductorConflict = form.conductor_id && form.days.length > 0
    ? schedules.find(s => s.conductor_id == form.conductor_id && checkDayOverlap(s.days, form.days))
    : null;

  const armadaConflict = form.armada_id && form.days.length > 0
    ? schedules.find(s => s.armada_id == form.armada_id && checkDayOverlap(s.days, form.days))
    : null;

  // Dynamic Pricing Logic
  useEffect(() => {
    if (form.armada_id && distanceKm > 0) {
      const selectedArmada = armadas.find(a => a.id == form.armada_id);
      if (selectedArmada) {
        setEstimatedPrice(Math.round(distanceKm * selectedArmada.price_per_km));
      }
    }
  }, [form.armada_id, distanceKm, armadas]);

  const handleDayChange = (day) => {
    setForm(prev => ({
      ...prev,
      days: prev.days.includes(day) ? prev.days.filter(d => d !== day) : [...prev.days, day]
    }));
  };

  const calculateRoute = async () => {
    if (points.length < 2) return;
    setIsCalculating(true);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch('/api/admin/calculate-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          origin: points[0],
          destination: points[1],
          waypoints: stops.map(s => ({ lat: s.latitude, lng: s.longitude }))
        })
      });
      const data = await res.json();
      if (data.geometry) setRoutePath(data.geometry);
      if (data.summary) {
        const hours = Math.floor(data.summary.travelTimeInSeconds / 3600);
        const minutes = Math.floor((data.summary.travelTimeInSeconds % 3600) / 60);
        setForm(prev => ({ ...prev, duration: `${hours}h ${minutes}m` }));
        setDistanceKm(data.summary.lengthInMeters / 1000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (points.length < 2) return alert("Select Origin & Destination.");

    const routePayload = {
      name: form.name,
      description: form.description,
      duration: form.duration,
      color: form.color,
      origin: `${points[0].lat.toFixed(6)}, ${points[0].lng.toFixed(6)}`,
      destination: `${points[1].lat.toFixed(6)}, ${points[1].lng.toFixed(6)}`,
      coordinates: routePath.length > 0 ? routePath : points, // Structured array
      distanceKm: distanceKm,
      stops: stops
    };

    try {
      const routeRes = await fetch('/api/admin/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(routePayload)
      });
      const routeData = await routeRes.json();
      if (!routeRes.ok) throw new Error("Route creation failed");

      const scheduleRes = await fetch('/api/admin/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          route_id: routeData.id,
          armada_id: form.armada_id,
          days: form.days.join(','),
          departure_time: form.departure_time,
          arrival_time: form.arrival_time,
          price: estimatedPrice,
          driver_id: form.driver_id,
          conductor_id: form.conductor_id
        })
      });

      if (scheduleRes.ok) {
        alert("Strategy Saved Successfully!");
        onRefresh();
        setPoints([]); setStops([]); setRoutePath([]);
      }
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="flex h-[700px] bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">

      {/* Map Control Sidebar */}
      <div className="w-80 flex flex-col border-r border-gray-100 overflow-y-auto custom-scrollbar">
        <div className="p-6 space-y-8">

          <section>
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">1. Strategic Path</h3>
            <div className="space-y-4">
              <input
                className="w-full text-sm font-bold border-0 border-b-2 border-gray-100 focus:border-black focus:ring-0 px-0 placeholder-gray-300"
                placeholder="Route Mission Name"
                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              />
              <div className="flex gap-2">
                <button onClick={() => setActiveMode('route')} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeMode === 'route' ? 'bg-black text-white shadow-lg' : 'bg-gray-50 text-gray-400'}`}>Endpoints</button>
                <button onClick={() => setActiveMode('stop')} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeMode === 'stop' ? 'bg-black text-white shadow-lg' : 'bg-gray-50 text-gray-400'}`}>Add Stops</button>
              </div>
              <button onClick={calculateRoute} disabled={points.length < 2 || isCalculating} className="w-full py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all flex justify-center items-center gap-2">
                {isCalculating ? 'Calculating...' : <><Calculator size={14} /> Calculate Impact</>}
              </button>
            </div>
          </section>

          {/* Stop Management Panel */}
          {stops.length > 0 && (
            <section className="mt-4">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Waypoints ({stops.length})</h3>
              <DragDropContext onDragEnd={(result) => {
                if (!result.destination) return;
                const reordered = Array.from(stops);
                const [removed] = reordered.splice(result.source.index, 1);
                reordered.splice(result.destination.index, 0, removed);
                setStops(reordered);
              }}>
                <Droppable droppableId="stops-list">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                      {stops.map((stop, idx) => (
                        <Draggable key={stop.id} draggableId={stop.id.toString()} index={idx}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all ${snapshot.isDragging ? 'bg-indigo-50 border-indigo-300 shadow-lg' : 'bg-gray-50 border-gray-100'}`}
                            >
                              <div className="flex items-center gap-2 flex-1">
                                <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-[9px] font-black flex items-center justify-center">{idx + 1}</span>
                                <input
                                  type="text"
                                  className="flex-1 text-[10px] font-bold bg-transparent border-0 p-0 focus:ring-0"
                                  value={stop.name}
                                  onChange={(e) => setStops(prev => prev.map(s => s.id === stop.id ? { ...s, name: e.target.value } : s))}
                                />
                              </div>
                              <button onClick={() => setStops(prev => prev.filter(s => s.id !== stop.id))} className="text-gray-300 hover:text-red-500 transition-colors">
                                <Trash2 size={12} />
                              </button>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
              <p className="text-[8px] text-gray-400 mt-2 italic">Drag to reorder. Changes require recalculation.</p>
            </section>
          )}

          <hr className="border-gray-50" />

          <section>
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">2. Resource Assignment</h3>
            <div className="space-y-4 text-xs">
              <div>
                <label className="text-gray-400 font-bold mb-1 block uppercase text-[9px]">Select Fleet</label>
                <select className="w-full rounded-xl border-gray-100 text-xs font-bold py-2.5" value={form.armada_id} onChange={e => setForm({ ...form, armada_id: e.target.value })}>
                  <option value="">-- Choose Available --</option>
                  {availableArmadas.map(a => <option key={a.id} value={a.id}>{a.name} ({a.capacity}s)</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 font-bold mb-1 block uppercase text-[9px]">Driver</label>
                  <select className={`w-full rounded-xl text-[10px] font-bold py-2 ${driverConflict ? 'border-orange-400 bg-orange-50' : 'border-gray-100'}`} value={form.driver_id} onChange={e => setForm({ ...form, driver_id: e.target.value })}>
                    <option value="">-- Select --</option>
                    {activeDrivers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 font-bold mb-1 block uppercase text-[9px]">Conductor</label>
                  <select className={`w-full rounded-xl text-[10px] font-bold py-2 ${conductorConflict ? 'border-orange-400 bg-orange-50' : 'border-gray-100'}`} value={form.conductor_id} onChange={e => setForm({ ...form, conductor_id: e.target.value })}>
                    <option value="">-- Select --</option>
                    {activeConductors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Conflict Alerts */}
              {(armadaConflict || driverConflict || conductorConflict) && (
                <div className="mt-3 space-y-2">
                  {armadaConflict && (
                    <div className="p-2.5 rounded-xl bg-orange-50 border border-orange-200 flex items-start gap-2">
                      <AlertTriangle size={14} className="text-orange-600 mt-0.5 flex-shrink-0" />
                      <div className="text-[10px]">
                        <p className="font-black text-orange-700 uppercase tracking-widest">Fleet Conflict</p>
                        <p className="text-orange-600">This bus is already assigned to <span className="font-bold">"{armadaConflict.route_name}"</span> on overlapping days.</p>
                      </div>
                    </div>
                  )}
                  {driverConflict && (
                    <div className="p-2.5 rounded-xl bg-orange-50 border border-orange-200 flex items-start gap-2">
                      <AlertTriangle size={14} className="text-orange-600 mt-0.5 flex-shrink-0" />
                      <div className="text-[10px]">
                        <p className="font-black text-orange-700 uppercase tracking-widest">Driver Conflict</p>
                        <p className="text-orange-600">This driver is assigned to <span className="font-bold">"{driverConflict.route_name}"</span> on overlapping days.</p>
                      </div>
                    </div>
                  )}
                  {conductorConflict && (
                    <div className="p-2.5 rounded-xl bg-orange-50 border border-orange-200 flex items-start gap-2">
                      <AlertTriangle size={14} className="text-orange-600 mt-0.5 flex-shrink-0" />
                      <div className="text-[10px]">
                        <p className="font-black text-orange-700 uppercase tracking-widest">Conductor Conflict</p>
                        <p className="text-orange-600">This conductor is assigned to <span className="font-bold">"{conductorConflict.route_name}"</span> on overlapping days.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {estimatedPrice > 0 && (
                <div className="mt-4 p-4 rounded-2xl bg-green-50 border border-green-100 animate-fade-in">
                  <p className="text-[9px] font-black text-green-700 uppercase tracking-widest mb-1">Suggested Base Price</p>
                  <p className="text-xl font-black text-green-900 leading-none">IDR {estimatedPrice.toLocaleString()}</p>
                  <p className="text-[9px] text-green-600 mt-2 font-bold italic">Based on {distanceKm.toFixed(1)} km trajectory.</p>
                </div>
              )}
            </div>
          </section>

          <hr className="border-gray-50" />

          <section>
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">3. Operational Window</h3>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-1.5">
                {daysOptions.map(d => (
                  <button key={d} onClick={() => handleDayChange(d)} className={`w-7 h-7 rounded-lg text-[9px] font-black flex items-center justify-center border transition-all ${form.days.includes(d) ? 'bg-black text-white border-black shadow-md scale-110' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-300'}`}>
                    {d.substring(0, 1)}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="time" className="rounded-xl border-gray-100 text-[10px] font-bold py-2" value={form.departure_time} onChange={e => setForm({ ...form, departure_time: e.target.value })} />
                <input type="time" className="rounded-xl border-gray-100 text-[10px] font-bold py-2" value={form.arrival_time} onChange={e => setForm({ ...form, arrival_time: e.target.value })} />
              </div>
            </div>
          </section>

          <div className="pt-4">
            {(armadaConflict || driverConflict || conductorConflict) && (
              <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-200 text-center">
                <p className="text-[10px] font-black text-red-700 uppercase tracking-widest">⚠ Deployment Blocked</p>
                <p className="text-[9px] text-red-600 mt-1">Resolve resource conflicts before deploying.</p>
              </div>
            )}
            <button
              onClick={handleSubmit}
              disabled={armadaConflict || driverConflict || conductorConflict || points.length < 2}
              className={`w-full py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 transition-all
                ${(armadaConflict || driverConflict || conductorConflict || points.length < 2)
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-gray-900 to-black text-white hover:scale-[1.02] active:scale-95'}`}
            >
              <Save size={16} /> Deploy Strategy
            </button>
          </div>
        </div>
      </div>

      {/* Map Content */}
      <div className="flex-1 relative group">
        <MapContainer center={[-6.2088, 106.8456]} zoom={9} style={{ height: '100%', width: '100%' }}>
          <TileLayer attribution='&copy; TomTom' url="https://api.tomtom.com/map/1/tile/basic/main/{z}/{x}/{y}.png?key=p9GYmqIrndxj3DzOZKMkI6TWYt0RGBmD" />
          <LocationMarker points={points} setPoints={setPoints} stops={stops} setStops={setStops} activeMode={activeMode} routePath={routePath} />
        </MapContainer>

        {/* Floating Indicator */}
        <div className="absolute top-6 left-6 z-[1000] p-4 bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/50 pointer-events-none transition-all">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-indigo-500 animate-ping"></div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Intelligence</p>
              <p className="text-xs font-bold text-gray-900">{activeMode === 'route' ? 'Defining Logistics Path' : 'Auditing Strategic Stops'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Resource Sidebar */}
      <ResourceSidebar armadas={armadas} crews={crews} />
    </div>
  );
}
