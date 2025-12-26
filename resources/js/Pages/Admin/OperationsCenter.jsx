import React, { useState, useEffect } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import FleetTab from '@/Components/Admin/FleetTab';
import CrewTab from '@/Components/Admin/CrewTab';
import MapStrategyTab from '@/Components/Admin/MapStrategyTab';
import SchedulePanel from '@/Components/Admin/SchedulePanel';
import RouteRegistry from '@/Components/Admin/RouteRegistry';
import LiveMonitor from '@/Components/Admin/LiveMonitor';
import { LayoutDashboard, Bus, Users, Map as MapIcon, Calendar, RefreshCw, Navigation, Radio, AlignJustify, AlertTriangle, X } from 'lucide-react';
import { io } from 'socket.io-client';

const socket = io(window.location.origin.replace('5173', '3005'));

export default function OperationsCenter() {
  const [activeTab, setActiveTab] = useState('fleet');
  const [data, setData] = useState({
    armadas: [],
    crews: [],
    routes: [],
    stops: [],
    schedules: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toast, setToast] = useState(null); // { message, type, time }

  useEffect(() => {
    socket.on('delay_alert', (data) => {
      // data: { schedule_id, route_name, delay_mins, reason }
      const msg = `${data.route_name} is delayed by ${data.delay_mins} mins. Reason: ${data.reason}`;
      setToast({ message: msg, type: 'warning', time: Date.now() });

      // Auto dismiss
      setTimeout(() => setToast(null), 8000);
    });

    return () => {
      socket.off('delay_alert');
    };
  }, []);

  const fetchMasterData = async (silent = false) => {
    // ... existing fetch function
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);

    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/admin/operations/master-data', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401 || res.status === 403) {
        window.location.href = '/login';
        return;
      }
      const result = await res.json();
      if (result.data) {
        setData(result.data);
      }
    } catch (e) {
      console.error("Failed to fetch master data", e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMasterData();
  }, []);

  const tabs = [
    { id: 'monitor', label: 'Live Monitor', icon: <Radio size={18} className="animate-pulse text-green-500" /> },
    { id: 'fleet', label: 'Fleet Management', icon: <Bus size={18} /> },
    { id: 'crew', label: 'Crew Manifest', icon: <Users size={18} /> },
    { id: 'routes', label: 'Route Registry', icon: <Navigation size={18} /> },
    { id: 'strategy', label: 'Map Strategy', icon: <MapIcon size={18} /> },
    { id: 'schedules', label: 'Operations Sync', icon: <Calendar size={18} /> },
  ];

  return (
    <AdminLayout>
      {toast && (
        <div className="fixed top-24 right-6 z-[2000] animate-fade-in-left">
          <div className="bg-white border-l-4 border-orange-500 shadow-2xl rounded-r-xl p-4 flex items-start gap-3 w-80">
            <div className="mt-0.5"><AlertTriangle size={20} className="text-orange-500" /></div>
            <div className="flex-1">
              <h4 className="text-xs font-black uppercase tracking-widest text-orange-600 mb-1">Operational Alert</h4>
              <p className="text-sm font-medium text-gray-800 leading-snug">{toast.message}</p>
              <p className="text-[10px] text-gray-400 mt-2 font-mono">BROADCAST ID: {toast.time}</p>
            </div>
            <button onClick={() => setToast(null)} className="text-gray-300 hover:text-gray-500"><X size={16} /></button>
          </div>
        </div>
      )}

      <div className="max-w-[1600px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter flex items-center gap-3">
              Operations <span className="text-indigo-600">Command Center</span>
            </h1>
            <p className="text-gray-500 font-medium mt-1">Unified tactical oversight for fleet, crew, and logistics.</p>
          </div>
          <div className="flex items-center gap-3">
            {isRefreshing && (
              <div className="flex items-center gap-2 text-indigo-600 animate-pulse">
                <RefreshCw size={16} className="animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-widest">Syncing Data...</span>
              </div>
            )}
            <div className="h-10 w-px bg-gray-200 mx-2 hidden md:block"></div>
            <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2
                    ${activeTab === tab.id ? 'bg-gray-900 text-white shadow-xl scale-105' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}
                  `}
                >
                  {tab.icon}
                  {tab.label.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="h-[600px] bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest animate-pulse">Initializing Command Systems...</p>
          </div>
        ) : (
          <div className="animate-fade-in">
            {activeTab === 'monitor' && (
              <LiveMonitor
                schedules={data.schedules}
                routes={data.routes}
              />
            )}
            {activeTab === 'fleet' && (
              <FleetTab
                armadas={data.armadas}
                onArmadaChange={() => fetchMasterData(true)}
                onStatusChange={() => fetchMasterData(true)}
              />
            )}
            {activeTab === 'crew' && (
              <CrewTab
                crews={data.crews}
                armadas={data.armadas}
                onCrewChange={() => fetchMasterData(true)}
              />
            )}
            {activeTab === 'routes' && (
              <RouteRegistry
                routes={data.routes}
                stops={data.stops}
                onRefresh={() => fetchMasterData(true)}
              />
            )}
            {activeTab === 'strategy' && (
              <MapStrategyTab
                armadas={data.armadas}
                crews={data.crews}
                schedules={data.schedules}
                onRefresh={() => fetchMasterData(true)}
              />
            )}
            {activeTab === 'schedules' && (
              <SchedulePanel
                schedules={data.schedules}
                armadas={data.armadas}
                crews={data.crews}
                onRefresh={() => fetchMasterData(true)}
              />
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
