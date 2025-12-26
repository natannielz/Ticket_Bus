const axios = require('axios');

async function verifyDetailedSchedule() {
  console.log("--- Verifying Detailed Schedule Endpoint ---");
  try {
    // 1. Get all schedules first to find an ID
    const res = await axios.get('http://localhost:3000/api/schedules');
    const schedules = res.data.data;
    if (schedules.length === 0) {
      console.log("No schedules found to test.");
      return;
    }

    const testId = schedules[0].id;
    console.log(`Testing with Schedule ID: ${testId}`);

    // 2. Fetch detailed schedule
    const detailRes = await axios.get(`http://localhost:3000/api/schedules/${testId}`);
    const detail = detailRes.data.data;

    console.log("Check Route Name:", detail.route_name);
    console.log("Check Armada Level:", detail.armada_level);
    console.log("Check Coordinates:", Array.isArray(detail.coordinates) ? `Yes (${detail.coordinates.length} points)` : "No");
    console.log("Check Stops:", Array.isArray(detail.stops) ? `Yes (${detail.stops.length} stops)` : "No");

    if (detail.route_name && detail.armada_level && Array.isArray(detail.coordinates)) {
      console.log("✅ Detailed Schedule Endpoint Verification PASSED");
    } else {
      console.log("❌ Detailed Schedule Endpoint Verification FAILED (Missing Data)");
    }

  } catch (error) {
    console.error("❌ Verification Failed:", error.response ? error.response.data : error.message);
  }
}

verifyDetailedSchedule();
