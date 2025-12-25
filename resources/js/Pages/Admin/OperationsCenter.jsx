import React, { useState, useEffect } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import FleetTab from '@/Components/Admin/FleetTab';
import CrewTab from '@/Components/Admin/CrewTab';
import MapStrategyTab from '@/Components/Admin/MapStrategyTab';
import SchedulePanel from '@/Components/Admin/SchedulePanel';
import { LayoutDashboard, Bus, Users, Map as MapIcon, Calendar, RefreshCw } from 'lucide-react';

export default function OperationsCenter() {
  const [activeTab, setActiveTab] = useState('fleet');
  const [data, setData] = useState({
    armadas: [],
    crews: [],
    routes: [],
    schedules: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchMasterData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);

    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/admin/operations/master-data', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
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
    { id: 'fleet', label: 'Fleet Management', icon: <Bus size={18} /> },
    { id: 'crew', label: 'Crew Manifest', icon: <Users size={18} /> },
    { id: 'strategy', label: 'Map Strategy', icon: <MapIcon size={18} /> },
    { id: 'schedules', label: 'Operations Sync', icon: <Calendar size={18} /> },
  ];

  return (
    <AdminLayout>
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
            {activeTab === 'strategy' && (
              <MapStrategyTab
                armadas={data.armadas}
                crews={data.crews}
                onRefresh={() => fetchMasterData(true)}
              />
            )}
            {activeTab === 'schedules' && (
              <SchedulePanel
                schedules={data.schedules}
                onRefresh={() => fetchMasterData(true)}
              />
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
