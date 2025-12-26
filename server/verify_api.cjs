const axios = require('axios');
const assert = require('assert');
const db = require('./database.cjs');

const BASE_URL = 'http://localhost:3000/api';
let adminToken = '';
let userToken = '';
let armadaId = '';
let routeId = '';
let scheduleId = '';

async function run() {
  try {
    console.log('=== STARTING API VERIFICATION (Role-Aware) ===');

    // 1. Authentication Setup
    console.log('\n[1] Setting up Accounts...');

    // 1a. Create Admin
    const adminEmail = `admin_verif_${Date.now()}@test.com`;
    const adminPass = 'password';
    const adminReg = await axios.post(`${BASE_URL}/register`, { name: 'Admin Tester', email: adminEmail, password: adminPass });
    const adminId = adminReg.data.user.id;

    // Promote to Admin
    await new Promise((resolve, reject) => {
      db.run("UPDATE users SET role = 'admin' WHERE id = ?", [adminId], (err) => {
        if (err) reject(err); else resolve();
      });
    });

    // Login as Admin to get fresh token with role
    const adminLogin = await axios.post(`${BASE_URL}/login`, { email: adminEmail, password: adminPass });
    adminToken = adminLogin.data.token;
    console.log('    [Admin] Account created and promoted.');

    // 1b. Create User for Booking
    const userEmail = `user_verif_${Date.now()}@test.com`;
    const userPass = 'password';
    const userReg = await axios.post(`${BASE_URL}/register`, { name: 'User Tester', email: userEmail, password: userPass });
    userToken = userReg.data.token;
    console.log('    [User] Account created for booking.');

    const adminHeaders = { headers: { Authorization: `Bearer ${adminToken}` } };
    const userHeaders = { headers: { Authorization: `Bearer ${userToken}` } };

    // 2. Create Route (Admin)
    console.log('\n[2] Creating Route (Admin)...');
    const routeRes = await axios.post(`${BASE_URL}/admin/routes`, {
      name: 'Verification Route',
      origin: 'Alpha',
      destination: 'Beta',
      distanceKm: 150,
      description: 'Test Route'
    }, adminHeaders);
    routeId = routeRes.data.id;
    console.log('    Route Created:', routeId);

    // 3. Create Armada (Admin)
    console.log('\n[3] Creating Armada (Admin)...');
    const armadaRes = await axios.post(`${BASE_URL}/admin/armadas`, {
      name: 'VerifBus',
      plate_number: 'B 1234 TES',
      capacity: 40,
      level: 'Executive',
      price_per_km: 20
    }, adminHeaders);
    armadaId = armadaRes.data.id;
    console.log('    Armada Created:', armadaId);

    // 4. Create Schedule (Admin)
    console.log('\n[4] Creating Schedule (Admin)...');
    const days = ['Monday', 'Friday', 'Saturday'];
    const schedRes = await axios.post(`${BASE_URL}/admin/schedules`, {
      route_id: routeId,
      armada_id: armadaId,
      days: days.join(','),
      departure_time: '10:00',
      arrival_time: '14:00',
      price: 3000 // Fixed price for test
    }, adminHeaders);
    scheduleId = schedRes.data.id;
    console.log('    Schedule Created:', scheduleId);

    // 5. Conflict Check (Admin)
    console.log('\n[5] Testing Conflict Logic (Admin)...');
    try {
      await axios.post(`${BASE_URL}/admin/schedules`, {
        route_id: routeId,
        armada_id: armadaId, // Same bus
        days: 'Monday', // Overlapping day
        departure_time: '11:00',
        arrival_time: '15:00'
      }, adminHeaders);
      console.error('    FAILURE: Should have rejected overlapping schedule.');
    } catch (e) {
      if (e.response && e.response.status === 409) {
        console.log('    SUCCESS: Conflict 409 detected.');
      } else {
        console.error('    FAILURE: Unexpected error:', e.message);
      }
    }

    // 6. Maintenance Logic (Admin)
    console.log('\n[6] Testing Maintenance Logic (Admin)...');
    await axios.put(`${BASE_URL}/admin/armadas/${armadaId}/status`, { status: 'maintenance' }, adminHeaders);

    // Check schedule status
    const allScheds = await axios.get(`${BASE_URL}/admin/schedules`, adminHeaders);
    const mySched = allScheds.data.data.find(s => s.id === scheduleId);
    if (mySched.is_live === 0 && mySched.needs_reassignment === 1) {
      console.log('    SUCCESS: Schedule deactivated and flagged.');
    } else {
      console.error('    FAILURE: Schedule status check failed. is_live:', mySched.is_live);
    }

    // 7. Booking Flow (User)
    console.log('\n[7] Testing Booking Flow (User)...');

    // Reactivate schedule first (Admin)
    await axios.put(`${BASE_URL}/admin/schedules/${scheduleId}/toggle-live`, {}, adminHeaders);
    console.log('    Schedule manually reactivated.');

    // 7a. Try to book as Admin (Should Fail)
    try {
      await axios.post(`${BASE_URL}/bookings`, {
        schedule_id: scheduleId,
        date: '2025-01-01',
        seats: 1
      }, adminHeaders);
      console.error('    FAILURE: Admin was able to book (Should be forbidden).');
    } catch (e) {
      if (e.response && e.response.status === 403) {
        console.log('    SUCCESS: Admin booking blocked (403).');
      } else {
        console.error('    FAILURE: Admin booking failed with unexpected error:', e.message);
      }
    }

    // 7b. Book as User (Should Succeed)
    try {
      const bookRes = await axios.post(`${BASE_URL}/bookings`, {
        schedule_id: scheduleId,
        date: '2025-01-01',
        seats: 2
      }, userHeaders);

      console.log('    Booking ID:', bookRes.data.id, 'Total:', bookRes.data.totalPrice);
      if (bookRes.data.totalPrice === 6000) {
        console.log('    SUCCESS: User Booking successful and price correct.');
      } else {
        console.error('    FAILURE: Booking price incorrect.');
      }
    } catch (e) {
      console.error('    FAILURE: User Booking failed:', e.response ? e.response.data : e.message);
    }

    console.log('\n=== VERIFICATION COMPLETE ===');

  } catch (err) {
    console.error('FATAL ERROR:', err);
  }
}

run();
