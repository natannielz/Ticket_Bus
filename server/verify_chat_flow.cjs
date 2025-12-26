const io = require('socket.io-client');

const socket = io('http://localhost:3005');

const USER_ID = '999';
const ADMIN_ID = 'admin';

socket.on('connect', () => {
  console.log('Connected to server on 3005');

  // 1. Join
  console.log('Joining as User 999...');
  socket.emit('join', { userId: USER_ID, role: 'user' });

  // 2. Send Message after short delay
  setTimeout(() => {
    console.log('Sending message to Admin...');
    socket.emit('send_message', {
      sender_id: USER_ID,
      sender_name: 'Test User',
      receiver_id: ADMIN_ID,
      content: 'Hello via Bridge!',
      is_admin: false
    });
  }, 1000);
});

socket.on('receive_message', (msg) => {
  console.log('Received Message:', msg);
  if (msg.content === 'Hello via Bridge!' && msg.sender_id === USER_ID) {
    console.log('SUCCESS: Echo received (Bridge/Persistence works)');
    process.exit(0);
  }
});

socket.on('disconnect', () => {
  console.log('Disconnected');
});

// Timeout
setTimeout(() => {
  console.log('TIMEOUT: Did not receive echo in time.');
  process.exit(1);
}, 5000);
