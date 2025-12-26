import React, { useState } from 'react';
import { Bus, Settings, Trash2, CheckCircle, AlertTriangle, PenTool, Plus } from 'lucide-react';

export default function FleetTab({ armadas, onArmadaChange, onStatusChange }) {
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const [form, setForm] = useState({
    name: '',
    capacity: 40,
    price_per_km: 500,
    level: 'Economy',
    license_plate: '',
    status: 'available',
    image_path: ''
  });

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this armada?")) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/admin/armadas/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.status === 409) {
      const data = await res.json();
      alert(data.message || "Cannot delete: This armada is linked to an active schedule.");
    } else {
      onArmadaChange();
    }
  };

  const handleEdit = (armada) => {
    setForm({
      name: armada.name,
      capacity: armada.capacity,
      price_per_km: armada.price_per_km,
      level: armada.level,
      license_plate: armada.license_plate,
      status: armada.status,
      image_path: armada.image_path || ''
    });
    setEditingId(armada.id);
    setIsEditing(true);
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
      onStatusChange();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const url = isEditing ? `/api/admin/armadas/${editingId}` : '/api/admin/armadas';
    const method = isEditing ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(form)
    });

    if (res.ok) {
      setIsCreating(false);
      setIsEditing(false);
      setEditingId(null);
      setForm({
        name: '',
        capacity: 40,
        price_per_km: 500,
        level: 'Economy',
        license_plate: '',
        status: 'available',
        image_path: ''
      });
      onArmadaChange();
    }
  };

  const filteredArmadas = armadas.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.license_plate && a.license_plate.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || a.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Fleet Management</h2>
          <p className="text-sm text-gray-500">Manage buses, maintenance schedules, and assignments.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <input
              type="text"
              placeholder="Search fleet..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border-gray-200 text-sm focus:ring-black focus:border-black"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <Settings className="absolute left-3 top-2.5 text-gray-400" size={16} />
          </div>
          <button
            onClick={() => {
              setIsEditing(false);
              setForm({ name: '', capacity: 40, price_per_km: 500, level: 'Economy', license_plate: '', status: 'available', image_path: '' });
              setIsCreating(true);
            }}
            className="px-4 py-2 bg-black text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition-all flex items-center gap-2 shrink-0"
          >
            <Plus size={18} /> Add New
          </button>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 custom-scrollbar">
        {['all', 'available', 'on_duty', 'maintenance'].map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all
              ${filterStatus === status ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'}
            `}
          >
            {status.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {(isCreating || isEditing) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-fade-in-up">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Bus size={20} className="text-indigo-600" /> {isEditing ? 'Update Armada' : 'Add New Armada'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-widest">Bus Name</label>
                <input
                  required
                  className="w-full rounded-xl border-gray-200 focus:ring-black focus:border-black"
                  placeholder="e.g., Harapan Jaya Express"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-widest">Capacity</label>
                  <input
                    type="number"
                    required
                    min="1"
                    className="w-full rounded-xl border-gray-200 focus:ring-black focus:border-black"
                    value={form.capacity}
                    onChange={e => setForm({ ...form, capacity: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-widest">Price/KM (IDR)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    className="w-full rounded-xl border-gray-200 focus:ring-black focus:border-black"
                    value={form.price_per_km}
                    onChange={e => setForm({ ...form, price_per_km: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-widest">Level/Class</label>
                  <select
                    className="w-full rounded-xl border-gray-200 focus:ring-black focus:border-black"
                    value={form.level}
                    onChange={e => setForm({ ...form, level: e.target.value })}
                  >
                    <option value="Economy">Economy</option>
                    <option value="Business">Business</option>
                    <option value="Executive">Executive</option>
                    <option value="VIP">VIP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-widest">License Plate</label>
                  <input
                    required
                    className="w-full rounded-xl border-gray-200 focus:ring-black focus:border-black font-mono"
                    placeholder="B 1234 XYZ"
                    value={form.license_plate}
                    onChange={e => setForm({ ...form, license_plate: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-widest">Status</label>
                  <select
                    className="w-full rounded-xl border-gray-200 focus:ring-black focus:border-black"
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value })}
                  >
                    <option value="available">Available</option>
                    <option value="on_duty">On Duty</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-widest">Image Filename</label>
                  <input
                    className="w-full rounded-xl border-gray-200 focus:ring-black focus:border-black text-sm"
                    placeholder="bus1.jpg (optional)"
                    value={form.image_path}
                    onChange={e => setForm({ ...form, image_path: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setIsCreating(false); setIsEditing(false); }}
                  className="flex-1 py-3 bg-gray-100 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 shadow-lg shadow-gray-200 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle size={16} /> {isEditing ? 'Save Changes' : 'Add Armada'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredArmadas.map(armada => {
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
                  src={armada.image_path ? `/images/armadas/${armada.image_path}` : 'https://placehold.co/600x400?text=No+Image'}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  alt={armada.name}
                />

                <div className="absolute bottom-3 left-3 text-white">
                  <span className="px-2 py-0.5 bg-black/50 backdrop-blur rounded text-[10px] font-bold uppercase tracking-wider border border-white/20">{armada.level}</span>
                  <h3 className="text-md font-bold leading-tight mt-1 drop-shadow-md">{armada.name}</h3>
                </div>

                <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(armada)}
                    className="p-2 bg-white/90 backdrop-blur rounded-lg shadow-sm text-gray-700 hover:text-indigo-600 transition-colors"
                  >
                    <Settings size={18} />
                  </button>
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


