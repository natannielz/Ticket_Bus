import React, { useState, useEffect } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Users, UserPlus, Phone, Bus, Trash2 } from 'lucide-react';

export default function Crews() {
  const [crews, setCrews] = useState([]);
  const [armadas, setArmadas] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState({
    name: '',
    role: 'Driver',
    phone: '',
    assigned_bus_id: ''
  });

  useEffect(() => {
    fetchCrews();
    fetchArmadas();
  }, []);

  const fetchCrews = () => {
    const token = localStorage.getItem('token');
    fetch('/api/admin/crews', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.data) setCrews(data.data);
      });
  };

  const fetchArmadas = () => {
    const token = localStorage.getItem('token');
    fetch('/api/armadas', { headers: { 'Authorization': `Bearer ${token}` } }) // Use public or admin endpoint
      .then(res => res.json())
      .then(data => {
        if (data.data) setArmadas(data.data);
      });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/admin/crews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setIsCreating(false);
        setForm({ name: '', role: 'Driver', phone: '', assigned_bus_id: '' });
        fetchCrews();
      } else {
        alert("Failed to create crew");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure?")) return;
    const token = localStorage.getItem('token');
    await fetch(`/api/admin/crews/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchCrews();
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Crew Management</h1>
          <p className="text-gray-500 text-sm mt-1">Manage drivers and conductors.</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="bg-black text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-gray-800 transition-all flex items-center gap-2"
        >
          <UserPlus size={16} /> Add Crew
        </button>
      </div>

      {isCreating && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in-up">
            <h2 className="text-lg font-bold mb-4">Add New Crew Member</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label>
                <input required className="w-full rounded-lg border-gray-200" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Role</label>
                <select className="w-full rounded-lg border-gray-200" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                  <option value="Driver">Driver</option>
                  <option value="Conductor">Conductor</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone</label>
                <input required className="w-full rounded-lg border-gray-200" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Assigned Bus (Optional)</label>
                <select className="w-full rounded-lg border-gray-200" value={form.assigned_bus_id} onChange={e => setForm({ ...form, assigned_bus_id: e.target.value })}>
                  <option value="">-- No Assignment --</option>
                  {armadas.map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.license_plate})</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-4">
                <button type="button" onClick={() => setIsCreating(false)} className="flex-1 py-2 bg-gray-100 rounded-lg font-bold text-gray-600 hover:bg-gray-200">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-black text-white rounded-lg font-bold hover:bg-gray-800">Save Crew</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {crews.map(crew => (
          <div key={crew.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all group relative">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${crew.role === 'Driver' ? 'bg-indigo-100 text-indigo-600' : 'bg-orange-100 text-orange-600'}`}>
                {crew.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{crew.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${crew.role === 'Driver' ? 'bg-indigo-50 text-indigo-700' : 'bg-orange-50 text-orange-700'}`}>
                    {crew.role}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${crew.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {crew.status}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500 mt-3">
                  <Phone size={12} /> {crew.phone}
                </div>
                {crew.bus_name && (
                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                    <Bus size={12} /> Assigned: <span className="font-semibold text-gray-700">{crew.bus_name}</span>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => handleDelete(crew.id)}
              className="absolute top-4 right-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
