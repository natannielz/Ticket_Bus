import React from 'react';
import { Bus, Settings, Trash2, CheckCircle, AlertTriangle, PenTool } from 'lucide-react';

export default function FleetTab({ armadas, onArmadaChange, onStatusChange }) {
  const handleDelete = async (id) => {
    if (!confirm("Yakin ingin menghapus armada ini?")) return;
    const token = localStorage.getItem('token');
    await fetch(`/api/admin/armadas/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    onArmadaChange();
  };

  const handleUpdateStatus = async (id, newStatus) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/admin/armadas/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: newStatus })
    });
    if (res.ok) {
      onStatusChange(); // This triggers parent refresh to catch schedule flagging
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Fleet Management</h2>
          <p className="text-sm text-gray-500">Manage buses, maintenance schedules, and assignments.</p>
        </div>
        <button className="px-4 py-2 bg-black text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition-all flex items-center gap-2">
          <Bus size={18} /> Add New Armada
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
            <div key={armada.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-md transition-all flex flex-col">
              {/* Image Section */}
              <div className="h-48 overflow-hidden relative border-b border-gray-100">
                <div className={`absolute top-3 right-3 z-10 px-3 py-1 rounded-full text-[10px] font-bold border flex items-center gap-2 ${statusColor} shadow-sm backdrop-blur-sm bg-opacity-90`}>
                  <span className={`w-2 h-2 rounded-full ${statusDot}`}></span>
                  {armada.status ? armada.status.replace('_', ' ').toUpperCase() : 'AVAILABLE'}
                </div>

                <img
                  src={armada.image_path ? `/images/armadas/${armada.image_path}` : 'https://via.placeholder.com/600x400'}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  alt={armada.name}
                />

                <div className="absolute bottom-3 left-3 text-white">
                  <span className="px-2 py-0.5 bg-black/50 backdrop-blur rounded text-[10px] font-bold uppercase tracking-wider border border-white/20">{armada.level}</span>
                  <h3 className="text-md font-bold leading-tight mt-1 drop-shadow-md">{armada.name}</h3>
                </div>
              </div>

              {/* Details */}
              <div className="p-4 flex-1 flex flex-col">
                <div className="space-y-2 mb-4 flex-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">License Plate</span>
                    <span className="font-mono text-gray-700">{armada.license_plate || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Capacity</span>
                    <span className="font-bold text-gray-900">{armada.capacity} Seats</span>
                  </div>

                  {/* Service Status */}
                  <div className={`mt-3 p-2 rounded-lg text-[10px] ${hasServiceDue ? 'bg-red-50 border border-red-100' : 'bg-gray-50 border border-gray-100'}`}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold uppercase text-gray-400">Next Service</span>
                      <span className={hasServiceDue ? 'text-red-600 font-bold' : 'text-gray-600'}>{armada.next_service_date || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-50">
                  <select
                    className="col-span-2 text-[10px] font-bold rounded-lg border-gray-200 bg-gray-50 py-1.5"
                    value={armada.status}
                    onChange={(e) => handleUpdateStatus(armada.id, e.target.value)}
                  >
                    <option value="available">SET AVAILABLE</option>
                    <option value="on_duty">SET ON DUTY</option>
                    <option value="maintenance">SET MAINTENANCE</option>
                  </select>
                  <button onClick={() => handleDelete(armada.id)} className="flex items-center justify-center p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
