import React, { useEffect, useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Plus, X, Edit2, Trash2, Bus, AlertTriangle, Wrench } from 'lucide-react';

export default function Fleet() {
  const [armadas, setArmadas] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingArmada, setEditingArmada] = useState(null);
  const [formData, setFormData] = useState({
    name: '', level: 'Executive', capacity: 40, seat_config: '2-2',
    price_per_km: 1500, amenities: '', license_plate: '',
    last_service_date: '', next_service_date: ''
  });
  const [saving, setSaving] = useState(false);

  const fetchArmadas = () => {
    fetch('/api/armadas')
      .then(res => res.json())
      .then(data => { if (data.data) setArmadas(data.data); });
  };

  useEffect(() => { fetchArmadas(); }, []);

  const openCreateModal = () => {
    setEditingArmada(null);
    setFormData({
      name: '', level: 'Executive', capacity: 40, seat_config: '2-2',
      price_per_km: 1500, amenities: '', license_plate: '',
      last_service_date: '', next_service_date: ''
    });
    setShowModal(true);
  };

  const openEditModal = (armada) => {
    setEditingArmada(armada);
    setFormData({
      name: armada.name || '',
      level: armada.level || 'Executive',
      capacity: armada.capacity || 40,
      seat_config: armada.seat_config || '2-2',
      price_per_km: armada.price_per_km || 1500,
      amenities: armada.amenities || '',
      license_plate: armada.license_plate || '',
      last_service_date: armada.last_service_date || '',
      next_service_date: armada.next_service_date || ''
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const token = localStorage.getItem('token');
    const url = editingArmada
      ? `/api/admin/armadas/${editingArmada.id}`
      : '/api/admin/armadas';
    const method = editingArmada ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowModal(false);
        fetchArmadas();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save');
      }
    } catch (e) {
      alert('Network error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this armada? This action cannot be undone.")) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/admin/armadas/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      fetchArmadas();
    } else {
      const err = await res.json();
      alert(err.error || 'Cannot delete: May be linked to schedules.');
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Fleet Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage buses, maintenance schedules, and assignments.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-5 py-2.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-black shadow-lg shadow-gray-200 transition-all flex items-center gap-2"
        >
          <Plus size={20} />
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
              <div className="h-48 overflow-hidden relative border-b border-gray-100">
                <div className={`absolute top-3 right-3 z-10 px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-2 ${statusColor} shadow-sm backdrop-blur-sm bg-opacity-90`}>
                  <span className={`w-2 h-2 rounded-full ${statusDot}`}></span>
                  {armada.status ? armada.status.replace('_', ' ').toUpperCase() : 'AVAILABLE'}
                </div>
                <img
                  src={armada.image_path ? `/images/armadas/${armada.image_path}` : 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600'}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  alt={armada.name}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
                <div className="absolute bottom-3 left-3 text-white">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-white/20 backdrop-blur rounded text-[10px] font-bold uppercase tracking-wider border border-white/30">{armada.level}</span>
                    <span className="text-xs font-mono opacity-90">{armada.license_plate || 'N/A'}</span>
                  </div>
                  <h3 className="text-lg font-bold leading-tight drop-shadow-md">{armada.name}</h3>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col">
                <div className="space-y-3 mb-4 flex-1">
                  <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                    <span className="text-gray-500">Capacity</span>
                    <span className="font-bold text-gray-900">{armada.capacity} Seats</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                    <span className="text-gray-500">Rate /km</span>
                    <span className="font-bold text-gray-900">IDR {armada.price_per_km?.toLocaleString('id-ID')}</span>
                  </div>
                  <div className={`text-xs rounded-lg p-3 ${hasServiceDue ? 'bg-red-50 border border-red-100' : 'bg-gray-50 border border-gray-100'}`}>
                    <p className={`font-bold mb-1 flex items-center gap-1 ${hasServiceDue ? 'text-red-700' : 'text-gray-700'}`}>
                      {hasServiceDue ? <AlertTriangle size={12} /> : <Wrench size={12} />} Service Status
                    </p>
                    <div className="flex justify-between text-gray-500">
                      <span>Last: {armada.last_service_date || '-'}</span>
                      <span className={hasServiceDue ? 'text-red-600 font-bold' : ''}>Next: {armada.next_service_date || '-'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button onClick={() => openEditModal(armada)} className="flex-1 py-2 text-sm font-bold text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 border border-gray-200 transition-colors flex items-center justify-center gap-1">
                    <Edit2 size={14} /> Edit
                  </button>
                  <button onClick={() => handleDelete(armada.id)} className="flex-1 py-2 text-sm font-bold text-red-600 bg-white rounded-lg hover:bg-red-50 border border-red-100 transition-colors flex items-center justify-center gap-1">
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white rounded-t-3xl z-10">
              <h2 className="text-xl font-black text-gray-900">{editingArmada ? 'Edit Armada' : 'Add New Armada'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Name *</label>
                <input type="text" className="w-full border border-gray-200 rounded-xl p-3 font-medium" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Level</label>
                  <select className="w-full border border-gray-200 rounded-xl p-3 font-medium" value={formData.level} onChange={e => setFormData({ ...formData, level: e.target.value })}>
                    <option value="Executive">Executive</option>
                    <option value="Super Executive">Super Executive</option>
                    <option value="Sleeper">Sleeper</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Capacity</label>
                  <input type="number" className="w-full border border-gray-200 rounded-xl p-3 font-medium" value={formData.capacity} onChange={e => setFormData({ ...formData, capacity: parseInt(e.target.value) })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Seat Config</label>
                  <select className="w-full border border-gray-200 rounded-xl p-3 font-medium" value={formData.seat_config} onChange={e => setFormData({ ...formData, seat_config: e.target.value })}>
                    <option value="2-2">2-2 (Standard)</option>
                    <option value="2-1">2-1 (First Class)</option>
                    <option value="1-1">1-1 (Sleeper)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Rate/km (IDR)</label>
                  <input type="number" className="w-full border border-gray-200 rounded-xl p-3 font-medium" value={formData.price_per_km} onChange={e => setFormData({ ...formData, price_per_km: parseInt(e.target.value) })} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">License Plate</label>
                <input type="text" className="w-full border border-gray-200 rounded-xl p-3 font-medium" value={formData.license_plate} onChange={e => setFormData({ ...formData, license_plate: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Amenities</label>
                <textarea className="w-full border border-gray-200 rounded-xl p-3 font-medium h-20" value={formData.amenities} onChange={e => setFormData({ ...formData, amenities: e.target.value })} placeholder="WiFi, AC, Reclining Seats..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Last Service</label>
                  <input type="date" className="w-full border border-gray-200 rounded-xl p-3 font-medium" value={formData.last_service_date} onChange={e => setFormData({ ...formData, last_service_date: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Next Service</label>
                  <input type="date" className="w-full border border-gray-200 rounded-xl p-3 font-medium" value={formData.next_service_date} onChange={e => setFormData({ ...formData, next_service_date: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3 sticky bottom-0 bg-white rounded-b-3xl">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 text-sm font-bold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving || !formData.name} className="flex-1 py-3 text-sm font-bold text-white bg-black rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? 'Saving...' : (editingArmada ? 'Update Armada' : 'Create Armada')}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
