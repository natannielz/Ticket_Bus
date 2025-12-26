import React, { useState } from 'react';
import { Users, UserPlus, Phone, Bus, Trash2, CheckCircle, Clock } from 'lucide-react';

export default function CrewTab({ crews, armadas, onCrewChange }) {
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [form, setForm] = useState({
    name: '',
    role: 'Driver',
    phone: '',
    assigned_bus_id: '',
    status: 'Active'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const url = isEditing ? `/api/admin/crews/${editingId}` : '/api/admin/crews';
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
      setForm({ name: '', role: 'Driver', phone: '', assigned_bus_id: '', status: 'Active' });
      onCrewChange();
    }
  };

  const handleEdit = (crew) => {
    setForm({
      name: crew.name,
      role: crew.role,
      phone: crew.phone,
      assigned_bus_id: crew.assigned_bus_id || '',
      status: crew.status || 'Active'
    });
    setEditingId(crew.id);
    setIsEditing(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this crew member?")) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/admin/crews/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.status === 409) {
      const data = await res.json();
      alert(data.message || "Cannot delete: This crew member is linked to an active schedule.");
    } else {
      onCrewChange();
    }
  };

  const filteredCrews = crews.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  );

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Crew Management</h2>
          <p className="text-sm text-gray-500">Manage drivers and conductors.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <input
              type="text"
              placeholder="Search crew..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border-gray-200 text-sm focus:ring-black focus:border-black"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <Users className="absolute left-3 top-2.5 text-gray-400" size={16} />
          </div>
          <button
            onClick={() => {
              setIsEditing(false);
              setForm({ name: '', role: 'Driver', phone: '', assigned_bus_id: '', status: 'Active' });
              setIsCreating(true);
            }}
            className="bg-black text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-gray-800 transition-all flex items-center gap-2 shrink-0"
          >
            <UserPlus size={18} /> Add Crew
          </button>
        </div>
      </div>

      {(isCreating || isEditing) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in-up">
            <h2 className="text-lg font-bold mb-4">{isEditing ? 'Edit Crew Member' : 'Add New Crew Member'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-widest">Full Name</label>
                <input required className="w-full rounded-xl border-gray-200 focus:ring-black focus:border-black" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-widest">Role</label>
                  <select className="w-full rounded-xl border-gray-200 focus:ring-black focus:border-black" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                    <option value="Driver">Driver</option>
                    <option value="Conductor">Conductor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-widest">Phone</label>
                  <input required className="w-full rounded-xl border-gray-200 focus:ring-black focus:border-black" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-widest">Assigned Bus</label>
                  <select className="w-full rounded-xl border-gray-200 focus:ring-black focus:border-black" value={form.assigned_bus_id} onChange={e => setForm({ ...form, assigned_bus_id: e.target.value })}>
                    <option value="">-- No Bus --</option>
                    {armadas.map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({a.license_plate})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-widest">Status</label>
                  <select className="w-full rounded-xl border-gray-200 focus:ring-black focus:border-black" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => { setIsCreating(false); setIsEditing(false); }} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition-all">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 shadow-lg shadow-gray-200 transition-all flex items-center justify-center gap-2">
                  <CheckCircle size={16} /> {isEditing ? 'Save Changes' : 'Save Crew'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredCrews.map(crew => (
          <div key={crew.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group relative">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-black ${crew.role === 'Driver' ? 'bg-indigo-100 text-indigo-600' : 'bg-orange-100 text-orange-600'}`}>
                {crew.name.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-gray-900 leading-tight">{crew.name}</h3>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest ${crew.role === 'Driver' ? 'bg-indigo-50 text-indigo-700' : 'bg-orange-50 text-orange-700'}`}>
                    {crew.role}
                  </span>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest flex items-center gap-1 ${crew.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${crew.status === 'Active' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                    {crew.status}
                  </span>
                </div>
                <div className="space-y-1.5 mt-4 text-[11px] text-gray-500">
                  <div className="flex items-center gap-2">
                    <Phone size={12} className="text-gray-400" /> {crew.phone}
                  </div>
                  {crew.bus_name && (
                    <div className="flex items-center gap-2">
                      <Bus size={12} className="text-gray-400" /> <span className="font-semibold text-gray-700">{crew.bus_name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
              <button
                onClick={() => handleEdit(crew)}
                className="text-gray-400 hover:text-indigo-600 p-1 bg-gray-50 rounded-lg"
              >
                <Users size={16} />
              </button>
              <button
                onClick={() => handleDelete(crew.id)}
                className="text-gray-400 hover:text-red-500 p-1 bg-gray-50 rounded-lg"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

