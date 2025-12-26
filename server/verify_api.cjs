const axios = require('axios');
const assert = require('assert');
const db = require('./database.cjs'); // Direct DB access for admin promotion

const BASE_URL = 'http://localhost:3000/api';
let token = '';
let armadaId = '';
let routeId = '';
let scheduleId = '';

async function run() {
  try {
    console.log('=== STARTING API VERIFICATION ===');

    // 1. Authentication
    console.log('\n[1] Authenticating...');
    const email = `admin_verif_${Date.now()}_${Math.floor(Math.random() * 1000)}@test.com`;
    const password = 'password';

    try {
      console.log(`    Registering ${email}...`);
      const regRes = await axios.post(`${BASE_URL}/register`, { name: 'Admin Test', email, password });
      token = regRes.data.token;
      const userId = regRes.data.user.id;
      console.log('    Registered:', userId);

      // Promote
      await new Promise((resolve, reject) => {
        db.run("UPDATE users SET role = 'admin' WHERE id = ?", [userId], (err) => {
          if (err) reject(err); else resolve();
        });
      });
      console.log('    Promoted to Admin.');

      // Refresh Token
      const loginRes = await axios.post(`${BASE_URL}/login`, { email, password });
      token = loginRes.data.token;
      console.log('    Refreshed Token.');

    } catch (e) {
      console.error('    Auth failed:', e.message);
      if (e.response) console.error('    Status:', e.response.status, 'Data:', e.response.data);
      process.exit(1);
    }

    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

    // 2. Create Route
    console.log('\n[2] Creating Route...');
    const routeRes = await axios.post(`${BASE_URL}/admin/routes`, {
      name: 'Verification Route',
      origin: 'Alpha',
      destination: 'Beta',
      distanceKm: 150, // 150 km
      description: 'Test Route'
    }, authHeaders);
    routeId = routeRes.data.id;
    console.log('    Route Created:', routeId);

    // 3. Create Armada
    console.log('\n[3] Creating Armada...');
    const armadaRes = await axios.post(`${BASE_URL}/admin/armadas`, {
      name: 'Verification Bus',
      price_per_km: 20, // 150 * 20 = 3000
      capacity: 40,
      status: 'active',
      level: 'Executive'
    }, authHeaders);
    armadaId = armadaRes.data.id;
    console.log('    Armada Created:', armadaId);

    // 4. Create Schedule & Check Pricing 
    console.log('\n[4] Creating Schedule & Checking Pricing...');
    const schedRes = await axios.post(`${BASE_URL}/admin/schedules`, {
      route_id: routeId,
      armada_id: armadaId,
      days: 'Monday, Friday',
      departure_time: '08:00',
      arrival_time: '12:00'
      // Price auto-calc
    }, authHeaders);
    scheduleId = schedRes.data.id;
    const price = schedRes.data.price;
    console.log('    Schedule Created:', scheduleId, 'Price:', price);

    if (price === 3000) {
      console.log('    SUCCESS: Price calculated correctly (150 * 20 = 3000).');
    } else {
      console.error('    FAILURE: Price incorrect. Expected 3000, got', price);
    }

    // 5. Conflict Detection
    console.log('\n[5] Testing Conflict Detection...');
    try {
      await axios.post(`${BASE_URL}/admin/schedules`, {
        route_id: routeId,
        armada_id: armadaId, // Same bus
        days: 'Friday', // Overlap
        departure_time: '14:00',
        arrival_time: '18:00'
      }, authHeaders);
      console.error('    FAILURE: Should have rejected overlapping schedule.');
    } catch (e) {
      if (e.response && e.response.status === 409) {
        console.log('    SUCCESS: Conflict 409 detected.');
      } else {
        console.error('    FAILURE: Unexpected error:', e.message);
      }
    }

    // 6. Master Data
    console.log('\n[6] Fetching Master Data...');
    const masterRes = await axios.get(`${BASE_URL}/admin/operations/master-data`, authHeaders);
    const schedules = masterRes.data.data.schedules;
    if (schedules && schedules.some(s => s.id === scheduleId)) {
      console.log('    SUCCESS: Schedule found in Master Data.');
    } else {
      console.error('    FAILURE: Schedule not found in Master Data.');
    }

    // 7. Maintenance Logic
    console.log('\n[7] Testing Maintenance Logic...');
    await axios.put(`${BASE_URL}/admin/armadas/${armadaId}/status`, { status: 'maintenance' }, authHeaders);

    // Check schedule status
    const allScheds = await axios.get(`${BASE_URL}/admin/schedules`, authHeaders);
    const mySched = allScheds.data.data.find(s => s.id === scheduleId);
    if (mySched.is_live === 0 && mySched.needs_reassignment === 1) {
      console.log('    SUCCESS: Schedule deactivated and flagged for reassignment.');
    } else {
      console.error('    FAILURE: Schedule status check failed. is_live:', mySched.is_live);
    }

    // 8. Booking Flow
    console.log('\n[8] Testing Booking Flow...');
    // Reactivate schedule first
    await axios.put(`${BASE_URL}/admin/schedules/${scheduleId}/toggle-live`, {}, authHeaders);
    console.log('    Schedule manually reactivated.');

    // Make booking
    try {
      const bookRes = await axios.post(`${BASE_URL}/bookings`, {
        schedule_id: scheduleId,
        date: '2025-01-01', // Any date
        seats: 2,
        passenger_name: 'Verifier'
      }, authHeaders);
      console.log('    Booking ID:', bookRes.data.id, 'Total:', bookRes.data.totalPrice);

      if (bookRes.data.totalPrice === 6000) { // 2 seats * 3000
        console.log('    SUCCESS: Booking price correct.');
      } else {
        console.error('    FAILURE: Booking price incorrect.');
      }
    } catch (e) {
      console.error('    FAILURE: Booking failed:', e.response ? e.response.data : e.message);
    }

    console.log('\n=== VERIFICATION COMPLETE ===');

  } catch (err) {
    console.error('FATAL ERROR:', err);
  }
}

run();
