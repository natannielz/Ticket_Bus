const { io } = require('socket.io-client');

const SERVER_URL = 'http://localhost:3005';

async function testChat() {
  console.log("🚀 Starting Socket.io Chat Verification...");

  const userSocket = io(SERVER_URL);
  const adminSocket = io(SERVER_URL);

  let userReceived = false;
  let adminReceived = false;

  // Wait for exchange
  setTimeout(() => {
    if (adminReceived && userReceived) {
      console.log("\n✨ Verification SUCCESS: Bi-directional chat is working!");
      process.exit(0);
    } else {
      console.error("\n❌ Verification FAILED: Timeout reached without full exchange.");
      console.log(`- Admin received message: ${adminReceived}`);
      console.log(`- User received reply: ${userReceived}`);
      process.exit(1);
    }
  }, 8000);

  // 1. Setup Admin
  adminSocket.on('connect', () => {
    console.log("✅ Admin connected");
    adminSocket.emit('join', { userId: 'admin-01', role: 'admin' });
  });

  adminSocket.on('receive_message', (msg) => {
    console.log("📩 Admin received from", msg.sender_id, ":", msg.content);
    if (msg.sender_id === 'user-123') {
      adminReceived = true;
      // 3. Admin replies after a short delay
      setTimeout(() => {
        console.log("📤 Admin replying...");
        adminSocket.emit('send_message', {
          sender_id: 'admin-01',
          sender_name: 'Support',
          receiver_id: 'user-123',
          content: 'Hello! How can we help?',
          is_admin: true
        });
      }, 1000);
    }
  });

  // 2. Setup User
  userSocket.on('connect', () => {
    console.log("✅ User connected");
    userSocket.emit('join', { userId: 'user-123', role: 'user' });

    // Wait for Admin to be ready
    setTimeout(() => {
      console.log("📤 User sending message...");
      userSocket.emit('send_message', {
        sender_id: 'user-123',
        sender_name: 'Test User',
        receiver_id: 'admin',
        content: 'Hello, I have a question about my booking.',
        is_admin: false
      });
    }, 2000);
  });

  userSocket.on('receive_message', (msg) => {
    console.log("📩 User received from", msg.sender_id, ":", msg.content);
    if (msg.sender_id === 'admin-01') {
      userReceived = true;
    }
  });
}

testChat();
