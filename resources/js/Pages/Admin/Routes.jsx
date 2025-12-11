import React, { useState, useEffect } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents, Tooltip as LeafletTooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { MapPin, Navigation, Plus, Save, RotateCcw, Truck, Flag, DollarSign, Fuel, Calculator, Trash2 } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';

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

// Custom Icons for different stop types
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

// Map Component to handle clicks
function LocationMarker({ points, setPoints, stops, setStops, activeMode, routePath }) {
  useMapEvents({
    click(e) {
      if (activeMode === 'route') {
        if (points.length < 2) {
          setPoints([...points, e.latlng]);
        } else {
          // Optional: confirm reset or just add another point if distinct? Logic kept simple.
          if (confirm("Reset Start/End points?")) {
            setPoints([e.latlng]);
          }
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
          <Popup>
            <strong>{stop.name}</strong><br />
            {stop.type} | {stop.time_spent}
          </Popup>
          <LeafletTooltip direction="top" offset={[0, -20]} opacity={0.8}>{idx + 1}</LeafletTooltip>
        </Marker>
      ))}

      {/* Render the full calculated path if available, otherwise straight line */}
      {(routePath && routePath.length > 0) ? (
        <>
          <Polyline positions={routePath} color="#3b82f6" weight={8} opacity={0.6} />
          <Polyline positions={routePath} color="#60a5fa" weight={3} opacity={1} dashArray="10, 10" />
        </>
      ) : (points.length > 1 && <Polyline positions={points} color="#94a3b8" dashArray="5,5" weight={3} />)}
    </>
  );
}

// ... imports
// (Make sure to import React, AdminLayout, etc)
// ...

export default function Routes() {
  const [points, setPoints] = useState([]);
  const [routePath, setRoutePath] = useState([]);
  const [stops, setStops] = useState([]);
  const [armadas, setArmadas] = useState([]);
  const [crews, setCrews] = useState([]);
  const [activeMode, setActiveMode] = useState('route');
  const [isCalculating, setIsCalculating] = useState(false);

  // New States for Estimates
  const [distanceKm, setDistanceKm] = useState(0);
  const [estimatedPrice, setEstimatedPrice] = useState(0);

  const [form, setForm] = useState({
    name: '',
    description: '',
    duration: '',
    color: '#3b82f6',
    days: [],
    armada_id: '',
    armada_id: '',
    departure_time: '',
    arrival_time: '',
    driver_id: '',
    conductor_id: ''
  });

  const daysOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // ... useEffect for armadas ...
  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/armadas')
      .then(res => res.json())
      .then(data => {
        if (data.data) setArmadas(data.data);
      });

    fetch('/api/admin/crews', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.data) setCrews(data.data);
      });
  }, []);

  // Pricing Calculator State
  const [fuelCostPerKm, setFuelCostPerKm] = useState(1500); // Default average
  const [suggestedPrice, setSuggestedPrice] = useState(0);
  const [baseCost, setBaseCost] = useState(0);
  const [profitMargin, setProfitMargin] = useState(0);

  // Recalculate Prices when inputs change
  useEffect(() => {
    if (distanceKm > 0) {
      // Base Cost (Fuel Only for simplicity)
      const cost = parseInt(fuelCostPerKm) * parseFloat(distanceKm);
      setBaseCost(cost);

      if (form.armada_id) {
        const armada = armadas.find(a => a.id == form.armada_id);
        if (armada && armada.price_per_km) {
          const suggested = parseFloat(distanceKm) * armada.price_per_km;
          setSuggestedPrice(suggested);

          // Only auto-update price if it's 0 or user hasn't manually edited (simplified for now to just auto-update)
          setForm(prev => ({ ...prev, price: suggested }));
        }
      }
    }
  }, [distanceKm, fuelCostPerKm, form.armada_id, armadas]);

  // Calculate Profit Margin
  useEffect(() => {
    if (suggestedPrice > 0 && baseCost > 0) {
      const margin = suggestedPrice - baseCost;
      const percentage = (margin / suggestedPrice) * 100;
      setProfitMargin(percentage.toFixed(1));
    }
  }, [suggestedPrice, baseCost]);

  const handleDayChange = (day) => {
    setForm(prev => {
      if (prev.days.includes(day)) {
        return { ...prev, days: prev.days.filter(d => d !== day) };
      } else {
        return { ...prev, days: [...prev.days, day] };
      }
    });
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(stops);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setStops(items);
  };

  const updateStop = (index, field, value) => {
    const newStops = [...stops];
    newStops[index][field] = value;
    setStops(newStops);
  };

  const removeStop = (index) => {
    const newStops = [...stops];
    newStops.splice(index, 1);
    setStops(newStops);
  };


  // REVERSE ROUTE Logic
  const reverseRoute = () => {
    if (points.length < 2) return;
    setPoints([points[1], points[0]]); // Swap start and end
    // Also reverse stops? Technically yes but they might be one-way. Let's keep stops for now or maybe just reverse the array.
    // For simplicity, let's just reverse endpoints. User can reorder stops.
    setRoutePath([]); // Reset path to force recalculate
    setDistanceKm(0);
  };

  const calculateRoute = async () => {
    if (points.length < 2) return;
    setIsCalculating(true);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch('/api/admin/calculate-route', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          origin: points[0],
          destination: points[1],
          waypoints: stops.map(s => ({ lat: s.latitude, lng: s.longitude }))
        })
      });
      const data = await res.json();

      if (data.geometry) {
        setRoutePath(data.geometry);
      }

      if (data.summary) {
        // Process Summary
        const seconds = data.summary.travelTimeInSeconds;
        const meters = data.summary.lengthInMeters;

        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const durationStr = `${hours}h ${minutes}m`;

        setForm(prev => ({ ...prev, duration: durationStr }));
        setDistanceKm(meters / 1000); // Store for pricing
      }

    } catch (e) {
      console.error(e);
      alert("Failed to calculate route path.");
    } finally {
      setIsCalculating(false);
    }
  };

  // Update Estimated Price when Armada or Distance changes
  useEffect(() => {
    if (form.armada_id && distanceKm > 0) {
      const selectedArmada = armadas.find(a => a.id == form.armada_id);
      if (selectedArmada) {
        // Basic logic: Distance * Price/KM
        // Add overhead? 
        const price = Math.round(distanceKm * selectedArmada.price_per_km);
        setEstimatedPrice(price);
      }
    }
  }, [form.armada_id, distanceKm, armadas]);


  const handleSubmit = async (e) => {
    // ... existing submit logic ...
    e.preventDefault();
    const token = localStorage.getItem('token');

    if (points.length < 2) {
      alert("Please select Origin and Destination on the map.");
      return;
    }

    const origin = `${points[0].lat.toFixed(6)}, ${points[0].lng.toFixed(6)}`;
    const destination = `${points[1].lat.toFixed(6)}, ${points[1].lng.toFixed(6)}`;
    const finalCoordinates = routePath.length > 0 ? routePath : points;

    const routePayload = {
      name: form.name,
      description: form.description,
      duration: form.duration,
      color: form.color,
      origin: origin,
      destination: destination,
      coordinates: finalCoordinates,
      stops: stops
    };

    try {
      const routeRes = await fetch('/api/admin/routes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(routePayload)
      });
      const routeData = await routeRes.json();

      if (!routeRes.ok) throw new Error(routeData.error || "Failed to create route");

      const scheduleRes = await fetch('/api/admin/schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          route_id: routeData.id,
          armada_id: form.armada_id,
          days: form.days.join(','),
          departure_time: form.departure_time,
          arrival_time: form.arrival_time,
          arrival_time: form.arrival_time,
          price: estimatedPrice,
          driver_id: form.driver_id,
          conductor_id: form.conductor_id
          // We need to pass price to schedule. Let's assume we want to save this calculated price.
        })
      });

      if (!scheduleRes.ok) throw new Error("Failed to create schedule");

      alert("Route and Schedule Created Successfully!");
      setPoints([]);
      setStops([]);
      setRoutePath([]);
      setForm({ name: '', description: '', duration: '', color: '#3b82f6', days: [], armada_id: '', departure_time: '', arrival_time: '' });

    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Route Strategy</h1>
          <p className="text-sm text-gray-500 mt-1">Design optimized travel paths and manage fleet assignment.</p>
        </div>

        <div className="flex space-x-3 bg-white p-2 rounded-xl shadow-sm border border-gray-100">
          <button
            onClick={() => setActiveMode('route')}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeMode === 'route' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            1. Origin/Dest
          </button>
          <button
            onClick={() => setActiveMode('stop')}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeMode === 'stop' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            2. Add Stops
          </button>
          <div className="w-px bg-gray-200 my-1"></div>
          <button
            onClick={reverseRoute}
            disabled={points.length < 2}
            className="px-4 py-2 rounded-lg font-bold text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all flex items-center gap-1"
            title="Reverse Direction"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>
          </button>
          <button
            onClick={calculateRoute}
            disabled={isCalculating || points.length < 2}
            className={`px-6 py-2 rounded-lg font-bold text-sm shadow-md transition-all flex items-center gap-2
                 ${isCalculating ? 'bg-gray-100 text-gray-400' : 'bg-gradient-to-r from-accent to-accent-blue text-white hover:shadow-lg hover:shadow-accent/20'}`}
          >
            {isCalculating ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <span>Calculating...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                <span>Calculate Path</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[750px] overflow-hidden">
        {/* Map Section - Takes up more space now (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden relative group">
          <MapContainer center={[-6.2088, 106.8456]} zoom={9} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.tomtom.com">TomTom</a> map data'
              url="https://api.tomtom.com/map/1/tile/basic/main/{z}/{x}/{y}.png?key=p9GYmqIrndxj3DzOZKMkI6TWYt0RGBmD"
            />
            <LocationMarker
              points={points}
              setPoints={setPoints}
              stops={stops}
              setStops={setStops}
              activeMode={activeMode}
              routePath={routePath}
            />
          </MapContainer>

          {/* Floating Status Card */}
          <div className="absolute top-6 left-6 z-[1000] space-y-2 pointer-events-none">
            <div className="bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-lg border border-white/50 max-w-xs">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-1">Current Mode</h3>
              {activeMode === 'route' && (
                <div className="flex items-center gap-2 text-gray-800">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  <span className="font-bold text-sm">Setting Endpoints</span>
                </div>
              )}
              {activeMode === 'stop' && (
                <div className="flex items-center gap-2 text-gray-800">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                  <span className="font-bold text-sm">Adding Stops</span>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                {activeMode === 'route' ? "Click map to set Origin, then Destination." : "Click anywhere along the route to add a stop."}
              </p>
            </div>

            {/* Route Summary Floating Card */}
            {distanceKm > 0 && (
              <div className="bg-gray-900/90 backdrop-blur-md p-4 rounded-xl shadow-xl border border-gray-700 text-white max-w-xs animate-fade-in-up">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs text-gray-400 uppercase">Total Distance</p>
                    <p className="text-lg font-bold font-mono">{distanceKm.toFixed(1)} km</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400 uppercase">Est. Time</p>
                    <p className="text-lg font-bold text-accent">{form.duration}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Controls - 4 Cols, Scrollable */}
        <div className="lg:col-span-4 flex flex-col h-full bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <h2 className="font-bold text-gray-800">Route Configuration</h2>
            <span className="text-xs font-medium px-2 py-1 bg-gray-200 rounded-lg text-gray-600">Draft</span>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">

            {/* Section 1 */}
            <section>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">1</span>
                Basic Info
              </h3>
              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    className="peer block w-full border-0 border-b-2 border-gray-200 bg-transparent py-2 px-0 placeholder-transparent focus:border-black focus:ring-0 sm:text-sm transition-all"
                    placeholder="Route Name"
                    id="routeName"
                    value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  />
                  <label htmlFor="routeName" className="absolute left-0 -top-3.5 text-xs text-gray-500 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-2 peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-xs">
                    Route Name
                  </label>
                </div>
                <div className="relative">
                  <textarea
                    className="peer block w-full border-0 border-b-2 border-gray-200 bg-transparent py-2 px-0 placeholder-transparent focus:border-black focus:ring-0 sm:text-sm transition-all resize-none h-20"
                    placeholder="Description"
                    id="routeDesc"
                    value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  ></textarea>
                  <label htmlFor="routeDesc" className="absolute left-0 -top-3.5 text-xs text-gray-500 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-2 peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-xs">
                    Description
                  </label>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 mb-1 block">Traffic Color</label>
                    <div className="flex items-center gap-2">
                      <input type="color" className="h-8 w-8 rounded cursor-pointer border-0 p-0" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} />
                      <span className="text-xs font-mono text-gray-400">{form.color}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 mb-1 block">Duration (Calc)</label>
                    <input disabled value={form.duration} className="w-full text-sm bg-gray-50 border-none rounded text-gray-500 font-bold" placeholder="Auto-filled" />
                  </div>
                </div>
              </div>
            </section>

            <hr className="border-gray-100" />

            {/* Section 2 */}
            <section>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">2</span>
                  Stops
                </h3>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{stops.length} stops</span>
              </div>

              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="stops-list">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3 min-h-[50px]">
                      {stops.length === 0 && <p className="text-gray-300 text-xs text-center py-4 border-2 border-dashed border-gray-100 rounded-lg">Drag & Drop Zone</p>}
                      {stops.map((stop, index) => (
                        <Draggable key={stop.id} draggableId={stop.id} index={index}>
                          {(provided, snapshot) => (
                            <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                              className={`p-3 rounded-lg border transition-all group ${snapshot.isDragging ? 'bg-white shadow-xl ring-2 ring-accent border-transparent' : 'bg-gray-50 border-gray-100 hover:border-gray-300'}`}>
                              <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-2">
                                  <div className="cursor-move text-gray-300 group-hover:text-gray-500">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
                                  </div>
                                  <span className="font-bold text-xs text-gray-500 uppercase tracking-wider">Stop #{index + 1}</span>
                                </div>
                                <button onClick={() => removeStop(index)} className="text-gray-300 hover:text-red-500 transition-colors">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                              </div>
                              <div className="space-y-2">
                                <input
                                  className="w-full text-sm font-bold bg-transparent border-0 border-b border-transparent focus:border-accent p-0 focus:ring-0 transition-all placeholder-gray-400"
                                  placeholder="Stop Name"
                                  value={stop.name} onChange={e => updateStop(index, 'name', e.target.value)}
                                />
                                <div className="flex gap-2">
                                  <select
                                    className="block w-2/3 rounded-md bg-white border-gray-200 text-xs py-1 pl-2 pr-6 focus:ring-accent focus:border-accent"
                                    value={stop.type} onChange={e => updateStop(index, 'type', e.target.value)}
                                  >
                                    <option value="pickup">Pick-up Point</option>
                                    <option value="rest">Rest Area</option>
                                    <option value="attraction">Tourist Spot</option>
                                  </select>
                                  <input className="block w-1/3 rounded-md bg-white border-gray-200 text-xs py-1 px-2 focus:ring-accent focus:border-accent" value={stop.time_spent} onChange={e => updateStop(index, 'time_spent', e.target.value)} />
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </section>

            <hr className="border-gray-100" />

            {/* Section 3 */}
            <section>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">3</span>
                Logistics
              </h3>

              <div className="space-y-5">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">Fleet Assignment</label>
                  <select
                    required
                    className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-black focus:ring-black py-3 px-4 text-sm"
                    value={form.armada_id} onChange={e => setForm({ ...form, armada_id: e.target.value })}
                  >
                    <option value="">-- Select Available Bus --</option>
                    {armadas.map(a => (
                      <option key={a.id} value={a.id}>{a.name} — {a.level} (IDR {a.price_per_km.toLocaleString()}/km)</option>
                    ))}
                  </select>
                  {estimatedPrice > 0 && (
                    <div className="mt-2 bg-green-50 text-green-700 px-3 py-2 rounded-lg text-xs font-medium flex justify-between items-center border border-green-100 animate-fade-in">
                      <span>Suggested Base Price:</span>
                      <span className="text-sm font-bold">IDR {estimatedPrice.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">Assign Driver</label>
                    <select
                      className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-black focus:ring-black py-3 px-4 text-sm"
                      value={form.driver_id} onChange={e => setForm({ ...form, driver_id: e.target.value })}
                    >
                      <option value="">-- Select Driver --</option>
                      {crews.filter(c => c.role === 'Driver').map(c => (
                        <option key={c.id} value={c.id}>{c.name} {c.assigned_bus_id ? '(Assigned)' : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">Assign Conductor</label>
                    <select
                      className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-black focus:ring-black py-3 px-4 text-sm"
                      value={form.conductor_id} onChange={e => setForm({ ...form, conductor_id: e.target.value })}
                    >
                      <option value="">-- Select Conductor --</option>
                      {crews.filter(c => c.role === 'Conductor').map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">Operating Days</label>
                  <div className="flex flex-wrap gap-2">
                    {daysOptions.map(day => (
                      <label key={day} className={`
                                    w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer transition-all select-none
                                    ${form.days.includes(day)
                          ? 'bg-black text-white shadow-lg transform scale-110'
                          : 'bg-white border border-gray-200 text-gray-400 hover:border-gray-400 hover:text-gray-600'}
                                `}>
                        <input type="checkbox" className="hidden" checked={form.days.includes(day)} onChange={() => handleDayChange(day)} />
                        {day.substring(0, 1)}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Departure</label>
                    <input type="time" required className="w-full rounded-lg border-gray-200 text-sm focus:ring-black focus:border-black" value={form.departure_time} onChange={e => setForm({ ...form, departure_time: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Arrival</label>
                    <input type="time" required className="w-full rounded-lg border-gray-200 text-sm focus:ring-black focus:border-black" value={form.arrival_time} onChange={e => setForm({ ...form, arrival_time: e.target.value })} />
                  </div>
                </div>
              </div>
            </section>

          </div>

          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <button onClick={handleSubmit} className="w-full py-3.5 bg-gradient-to-r from-gray-900 to-black text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-sm uppercase tracking-wider flex justify-center items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
              Save Strategy
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
