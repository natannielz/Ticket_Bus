import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import AdminLayout from '@/Layouts/AdminLayout';
import { Search, Filter, Download, MessageCircle, MoreHorizontal, CheckSquare, Square, Trash2, Printer, QrCode, UserCheck, UserX, Ticket } from 'lucide-react';
import SeatMap from '@/Components/SeatMap';

export default function BookingList() {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  // State for Booking
  const [showManualBooking, setShowManualBooking] = useState(false);
  const [armadas, setArmadas] = useState([]);
  const [newBooking, setNewBooking] = useState({
    user_name: '',
    user_email: '',
    armada_id: '',
    date: new Date().toISOString().split('T')[0],
    seats: [], // Array of seat IDs
    total_price: 0
  });

  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedBookings, setSelectedBookings] = useState([]);


  useEffect(() => {
    fetchBookings();
    fetchArmadas();
  }, []);

  const fetchArmadas = () => {
    // Fetch armadas to populate dropdown
    fetch('/api/armadas').then(res => res.json()).then(data => setArmadas(data.data || []));
  };

  const fetchBookings = () => {
    const token = localStorage.getItem('token');
    fetch('/api/admin/bookings', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.data) {
          setBookings(data.data);
          setFilteredBookings(data.data);
        }
        setLoading(false);
      })
      .catch(err => setLoading(false));
  };

  useEffect(() => {
    if (filterStatus === 'All') {
      setFilteredBookings(bookings);
    } else {
      setFilteredBookings(bookings.filter(b => b.status.toLowerCase() === filterStatus.toLowerCase()));
    }
  }, [filterStatus, bookings]);

  const toggleSelectAll = () => {
    if (selectedBookings.length === filteredBookings.length) {
      setSelectedBookings([]);
    } else {
      setSelectedBookings(filteredBookings.map(b => b.id));
    }
  };

  const toggleSelect = (id) => {
    if (selectedBookings.includes(id)) {
      setSelectedBookings(selectedBookings.filter(sid => sid !== id));
    } else {
      setSelectedBookings([...selectedBookings, id]);
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Passenger Manifest", 14, 10);
    doc.autoTable({
      head: [['ID', 'Passenger Name', 'Route/Armada', 'Date', 'Status']],
      body: filteredBookings.map(b => [
        `#${b.id}`,
        b.user_name || 'Guest',
        b.armada_name,
        b.date,
        b.status
      ]),
      startY: 20
    });
    doc.save("passenger_manifest.pdf");
  };

  const sendWhatsApp = (booking) => {
    const message = `Hello ${booking.user_name || 'Customer'}, regarding your booking #${booking.id} with ${booking.armada_name} on ${booking.date}. Status: ${booking.status}.`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid': return 'bg-green-100 text-green-700 border-green-200';
      case 'confirmed': return 'bg-green-100 text-green-700 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  }


  const handleCheckIn = async (id) => {
    const token = localStorage.getItem('token');
    await fetch(`/api/admin/bookings/checkin/${id}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchBookings();
  };



  // Pricing Logic (Mock for now, normally would come from Schedule/Armada)
  const calculateTotal = (seats, armadaId) => {
    if (!armadaId) return 0;
    const armada = armadas.find(a => a.id == armadaId);
    // Simplify: Base price 200k for demo
    const basePrice = 200000;

    // Weekend Surge Logic
    const date = new Date(newBooking.date);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6 || date.getDay() === 5; // Fri, Sat, Sun
    const multiplier = isWeekend ? 1.2 : 1.0;

    return Math.round(basePrice * multiplier);
  };

  const handleSeatClick = (seatId) => {
    setNewBooking(prev => {
      const isSelected = prev.seats.includes(seatId);
      const newSeats = isSelected ? prev.seats.filter(s => s !== seatId) : [...prev.seats, seatId];
      const pricePerSeat = calculateTotal(newSeats, prev.armada_id);
      return { ...prev, seats: newSeats, total_price: pricePerSeat * newSeats.length };
    });
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    try {
      const res = await fetch('/api/admin/bookings/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newBooking)
      });

      if (!res.ok) throw new Error("Failed to create booking");

      alert("Booking Created Successfully!");
      setShowManualBooking(false);
      setNewBooking({ user_name: '', date: '', armada_id: '', seats: [], total_price: 0 }); // Reset
      fetchBookings(); // Refresh list
    } catch (err) {
      alert(err.message);
    }
  };

  const handleNoShow = async (id) => {
    const token = localStorage.getItem('token');
    await fetch(`/api/admin/bookings/noshow/${id}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchBookings();
  };

  const [showScanner, setShowScanner] = useState(false);
  const [scanInput, setScanInput] = useState('');

  const handleSimulatedScan = () => {
    // Find booking by ID (simulated QR payload is ID)
    const booking = bookings.find(b => b.id.toString() === scanInput);
    if (booking) {
      handleCheckIn(booking.id);
      alert(`Passenger ${booking.user_name || 'Guest'} Checked-In Successfully!`);
      setShowScanner(false);
      setScanInput('');
    } else {
      alert("Invalid QR Code / Booking ID not found today.");
    }
  };

  return (
    <AdminLayout>
      {/* Scanner Modal */}
      {showScanner && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden animate-fade-in-up">
            <div className="bg-gray-900 p-6 text-center">
              <QrCode size={48} className="text-white mx-auto mb-4" />
              <h3 className="text-white font-bold text-lg">Scan Boarding Pass</h3>
              <p className="text-gray-400 text-xs mt-1">Align QR code within the frame to check-in.</p>
            </div>
            <div className="p-6">
              <div className="aspect-video bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center mb-6 relative overflow-hidden">
                <div className="w-full h-0.5 bg-red-500 absolute top-1/2 animate-pulse shadow-[0_0_10px_red]"></div>
                <p className="text-xs text-gray-400">Camera Feed (Simulated)</p>
              </div>
              <div className="flex gap-2">
                <input
                  placeholder="Enter Booking ID (e.g. 1)"
                  className="flex-1 rounded-lg border-gray-200 text-sm focus:ring-black focus:border-black"
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                />
                <button onClick={handleSimulatedScan} className="bg-black text-white px-4 rounded-lg font-bold text-sm">Check-In</button>
              </div>
              <button onClick={() => setShowScanner(false)} className="w-full mt-4 text-center text-xs text-gray-500 hover:text-gray-900">Close Scanner</button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Booking Modal */}
      {showManualBooking && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl p-0 shadow-2xl animate-fade-in-up flex flex-col md:flex-row overflow-hidden max-h-[90vh]">
            {/* Left: Form */}
            <div className="p-8 w-full md:w-1/2 flex flex-col h-full overflow-y-auto">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Ticket className="text-blue-600" /> Create Reservation
              </h2>

              <form onSubmit={handleCreateBooking} className="space-y-4 flex-1">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Passanger Name</label>
                  <input required className="w-full rounded-lg border-gray-200" value={newBooking.user_name} onChange={e => setNewBooking({ ...newBooking, user_name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date</label>
                  <input type="date" required className="w-full rounded-lg border-gray-200" value={newBooking.date} onChange={e => setNewBooking({ ...newBooking, date: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Select Bus</label>
                  <select required className="w-full rounded-lg border-gray-200" value={newBooking.armada_id} onChange={e => setNewBooking({ ...newBooking, armada_id: e.target.value, seats: [] })}>
                    <option value="">-- Choose Bus --</option>
                    {armadas.map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({a.level})</option>
                    ))}
                  </select>
                </div>

                <div className="bg-blue-50 p-4 rounded-xl mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Price per Seat</span>
                    <span className="font-bold text-gray-900">
                      {newBooking.armada_id ? `Rp ${calculateTotal([], newBooking.armada_id).toLocaleString()}` : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-blue-100">
                    <span className="text-lg font-bold text-blue-800">Total</span>
                    <span className="text-2xl font-extrabold text-blue-600">Rp {newBooking.total_price.toLocaleString()}</span>
                  </div>
                  {newBooking.seats.length > 0 && <div className="text-xs text-blue-500 mt-2 font-medium">Selected: {newBooking.seats.join(', ')}</div>}
                </div>

                <div className="flex gap-2 pt-4 mt-auto">
                  <button type="button" onClick={() => setShowManualBooking(false)} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold text-gray-600 hover:bg-gray-200">Cancel</button>
                  <button type="submit" disabled={newBooking.seats.length === 0} className="flex-1 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed">Confirm Booking</button>
                </div>
              </form>
            </div>

            {/* Right: Seat Map */}
            <div className="p-8 bg-gray-50 w-full md:w-1/2 border-l border-gray-100 overflow-y-auto">
              {newBooking.armada_id ? (
                <SeatMap
                  capacity={armadas.find(a => a.id == newBooking.armada_id)?.capacity || 40}
                  config={armadas.find(a => a.id == newBooking.armada_id)?.seat_config?.includes('1-1') ? '1-1' : '2-2'}
                  bookedSeats={['1A', '2B', '3C']} // Mock booked seats for demo
                  selectedSeats={newBooking.seats}
                  onSeatClick={handleSeatClick}
                  price={calculateTotal([], newBooking.armada_id)}
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <Bus size={48} className="mb-2 opacity-20" />
                  <p>Select a bus to view seat map</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Booking Management & Manifest</h1>
          <p className="text-sm text-gray-500 mt-1">Monitor reservations, payments, and passenger check-ins.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowManualBooking(true)}
            className="bg-gray-100 text-gray-900 font-bold py-2 px-4 rounded-xl inline-flex items-center shadow-lg hover:bg-gray-200 transition-all mr-2"
          >
            + Manual
          </button>
          <button
            onClick={() => setShowScanner(true)}
            className="bg-black text-white font-bold py-2 px-4 rounded-xl inline-flex items-center shadow-lg hover:bg-gray-800 transition-all animate-pulse"
          >
            <QrCode size={18} className="mr-2" />
            Scan QR
          </button>
          <button
            onClick={exportPDF}
            className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold py-2 px-4 rounded-xl inline-flex items-center shadow-sm transition-all"
          >
            <Download size={18} className="mr-2" />
            Export PDF
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Filters and Search */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50">
          <div className="flex bg-gray-200/50 p-1 rounded-lg">
            {['All', 'Pending', 'Paid', 'Cancelled'].map(t => (
              <button
                key={t}
                onClick={() => setFilterStatus(t)}
                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${filterStatus === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {t}
              </button>
            ))}
          </div>
          {selectedBookings.length > 0 && (
            <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-200">
              <span className="text-xs font-bold text-gray-500">{selectedBookings.length} selected</span>
              <button className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><Trash2 size={16} /></button>
              <button className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"><Printer size={16} /></button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold tracking-wider">
              <tr>
                <th className="px-6 py-4 text-left w-10">
                  <button onClick={toggleSelectAll} className="flex items-center">
                    {selectedBookings.length > 0 && selectedBookings.length === filteredBookings.length ? <CheckSquare size={18} className="text-blue-600" /> : <Square size={18} className="text-gray-400" />}
                  </button>
                </th>
                <th className="px-6 py-4 text-left">ID & Customer</th>
                <th className="px-6 py-4 text-left">Route Info</th>
                <th className="px-6 py-4 text-left">Manifest</th>
                <th className="px-6 py-4 text-left">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50 text-sm">
              {loading ? (
                <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-400">Loading bookings...</td></tr>
              ) : filteredBookings.length === 0 ? (
                // Empty State
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <Search size={40} className="text-gray-300" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">No Bookings Found</h3>
                      <p className="text-gray-500 text-sm mt-1 mb-6 max-w-xs mx-auto">It seems quiet here. Try adjusting your filters or create a manual booking.</p>
                      <button className="px-5 py-2 bg-blue-50 text-blue-600 font-bold rounded-lg hover:bg-blue-100 transition-colors">
                        Create First Booking
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredBookings.map(booking => (
                  <tr key={booking.id} className={`hover:bg-blue-50/30 transition-colors group ${selectedBookings.includes(booking.id) ? 'bg-blue-50/50' : ''}`}>
                    <td className="px-6 py-4">
                      <button onClick={() => toggleSelect(booking.id)}>
                        {selectedBookings.includes(booking.id) ? <CheckSquare size={18} className="text-blue-600" /> : <Square size={18} className="text-gray-300 group-hover:text-gray-400" />}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-200 to-gray-100 flex items-center justify-center font-bold text-xs text-gray-600">
                          {booking.user_name ? booking.user_name.charAt(0) : '#'}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">{booking.user_name || 'Guest'}</div>
                          <div className="text-xs text-gray-400 font-mono">ID: #{booking.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{booking.armada_name}</div>
                      <div className="text-xs text-gray-500">Jakarta - Bandung</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-500 text-xs mb-1">{booking.date}</div>
                      {booking.check_in_status === 'checked_in' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                          <UserCheck size={12} /> Boarded
                        </span>
                      ) : booking.check_in_status === 'no_show' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                          <UserX size={12} /> No Show
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pending</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide rounded-full border ${getStatusColor(booking.status)}`}>
                        {booking.status || 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {(!booking.check_in_status || booking.check_in_status === 'pending') && (
                          <>
                            <button onClick={() => handleCheckIn(booking.id)} className="p-1.5 text-green-600 bg-green-50 hover:bg-green-100 rounded tooltip" title="Check-In"><UserCheck size={16} /></button>
                            <button onClick={() => handleNoShow(booking.id)} className="p-1.5 text-orange-600 bg-orange-50 hover:bg-orange-100 rounded tooltip" title="Mark No-Show"><UserX size={16} /></button>
                          </>
                        )}
                        <button
                          onClick={() => sendWhatsApp(booking)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg flex items-center gap-1 text-xs font-bold border border-transparent hover:border-green-100"
                          title="Send WhatsApp"
                        >
                          <MessageCircle size={16} /> Chat
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
                          <MoreHorizontal size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}

