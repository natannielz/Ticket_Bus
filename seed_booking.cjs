const axios = require('axios');

async function seed() {
  try {
    // 1. Login
    const loginRes = await axios.post('http://localhost:3000/api/login', {
      email: 'client@example.com',
      password: 'client123'
    });
    const token = loginRes.data.token;
    console.log("Logged in, token:", token);

    // 2. Get Armadas to find an ID
    const armadasRes = await axios.get('http://localhost:3000/api/armadas');
    const armadaId = armadasRes.data.data[0].id;
    console.log("Using Armada ID:", armadaId);

    // 3. Create Booking
    await axios.post('http://localhost:3000/api/bookings', {
      armada_id: armadaId,
      date: '2025-12-25',
      seats: 2,
      total_price: 150000
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log("Booking seeded successfully!");

  } catch (e) {
    console.error("Error seeding:", e.response ? e.response.data : e.message);
  }
}

seed();
