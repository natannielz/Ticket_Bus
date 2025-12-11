import React, { useEffect, useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function Fleet() {
  const [armadas, setArmadas] = useState([]);

  // Simple state for refreshing
  const fetchArmadas = () => {
    fetch('/api/armadas')
      .then(res => res.json())
      .then(data => {
        if (data.data) setArmadas(data.data);
      });
  };

  useEffect(() => {
    fetchArmadas();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("Yakin ingin menghapus armada ini?")) return;

    const token = localStorage.getItem('token');
    await fetch(`/api/admin/armadas/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchArmadas();
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Manajemen Armada (Fleet)</h1>
          <p className="text-sm text-gray-500 mt-1">Manage buses, maintenance schedules, and assignments.</p>
        </div>
        <button className="px-5 py-2.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-black shadow-lg shadow-gray-200 transition-all flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
          New Armada
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {armadas.map(armada => {
          const hasServiceDue = armada.next_service_date && new Date(armada.next_service_date) < new Date();

          let statusColor = 'bg-green-100 text-green-700 border-green-200';
          let statusDot = 'bg-green-500';
          if (armada.status === 'on_duty') {
            statusColor = 'bg-blue-50 text-blue-700 border-blue-100';
            statusDot = 'bg-blue-500 animate-pulse';
          } else if (armada.status === 'maintenance') {
            statusColor = 'bg-red-50 text-red-700 border-red-100';
            statusDot = 'bg-red-500';
          }

          return (
            <div key={armada.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-md transition-all flex flex-col h-full">

              {/* Image Section */}
              <div className="h-56 overflow-hidden relative border-b border-gray-100">
                <div className={`absolute top-3 right-3 z-10 px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-2 ${statusColor} shadow-sm backdrop-blur-sm bg-opacity-90`}>
                  <span className={`w-2 h-2 rounded-full ${statusDot}`}></span>
                  {armada.status ? armada.status.replace('_', ' ').toUpperCase() : 'AVAILABLE'}
                </div>

                <img
                  src={armada.image_path ? `/images/armadas/${armada.image_path}` : 'https://via.placeholder.com/600x400'}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  alt={armada.name}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>

                <div className="absolute bottom-3 left-3 text-white">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-white/20 backdrop-blur rounded text-[10px] font-bold uppercase tracking-wider border border-white/30">{armada.level}</span>
                    <span className="text-xs font-mono opacity-90">{armada.license_plate || 'N/A'}</span>
                  </div>
                  <h3 className="text-lg font-bold leading-tight shadow-black drop-shadow-md">{armada.name}</h3>
                </div>
              </div>

              {/* Details Section */}
              <div className="p-5 flex-1 flex flex-col">
                <div className="space-y-3 mb-4 flex-1">
                  <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                    <span className="text-gray-500">Capacity</span>
                    <span className="font-bold text-gray-900">{armada.capacity} Seats</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                    <span className="text-gray-500">Rate /km</span>
                    <span className="font-bold text-gray-900">IDR {armada.price_per_km.toLocaleString('id-ID')}</span>
                  </div>

                  {/* Service Alert */}
                  <div className={`text-xs rounded-lg p-3 ${hasServiceDue ? 'bg-red-50 border border-red-100' : 'bg-gray-50 border border-gray-100'}`}>
                    <p className={`font-bold mb-1 ${hasServiceDue ? 'text-red-700' : 'text-gray-700'}`}>Service Status</p>
                    <div className="flex justify-between text-gray-500">
                      <span>Last: {armada.last_service_date || '-'}</span>
                      <span className={hasServiceDue ? 'text-red-600 font-bold' : ''}>Next: {armada.next_service_date || '-'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button className="flex-1 py-2 text-sm font-bold text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 border border-gray-200 transaction-colors">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(armada.id)} className="flex-1 py-2 text-sm font-bold text-red-600 bg-white rounded-lg hover:bg-red-50 border border-red-100 transition-colors">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AdminLayout>
  );
}
