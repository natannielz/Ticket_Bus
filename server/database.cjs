const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    initDb();
  }
});

function initDb() {
  db.serialize(() => {
    const bcrypt = require('bcryptjs'); // Need bcrypt here for password

    // ...

    // Users Table
    db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'user',
            status TEXT DEFAULT 'Active', -- Active, Inactive
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
      if (!err) {
        // Check if empty, then seed users
        db.get("SELECT count(*) as count FROM users", (err, row) => {
          if (row.count === 0) {
            seedUsers();
          }
        });
      }
    });

    // ...

    function seedUsers() {
      const users = [
        {
          name: 'Administrator',
          email: 'admin@example.com',
          password: bcrypt.hashSync('admin123', 8),
          role: 'admin'
        },
        {
          name: 'Client User',
          email: 'client@example.com',
          password: bcrypt.hashSync('client123', 8),
          role: 'user'
        }
      ];

      const stmt = db.prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)");
      users.forEach(u => {
        stmt.run(u.name, u.email, u.password, u.role);
      });
      stmt.finalize();
      console.log("Seeded Users");
    }

    // Armadas Table
    db.run(`CREATE TABLE IF NOT EXISTS armadas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            level TEXT,
            price_per_km INTEGER,
            route TEXT,
            amenities TEXT,
            seat_config TEXT,
            history TEXT,
            image_path TEXT,
            capacity INTEGER,
            status TEXT DEFAULT 'available', -- available, on_duty, maintenance
            license_plate TEXT,
            last_service_date DATE,
            next_service_date DATE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
      if (!err) {
        // Check if empty, then seed
        db.get("SELECT count(*) as count FROM armadas", (err, row) => {
          if (row.count === 0) {
            seedArmadas();
          }
        });
      }
    });

    // Bookings Table
    db.run(`CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            armada_id INTEGER,
            schedule_id INTEGER, -- Link to specific schedule
            date TEXT,
            seats INTEGER,
            total_price INTEGER,
            status TEXT DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id),
            FOREIGN KEY(armada_id) REFERENCES armadas(id),
            FOREIGN KEY(schedule_id) REFERENCES schedules(id)
        )`);

    // Chat Messages Table
    db.run(`CREATE TABLE IF NOT EXISTS chat_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_id TEXT,
            sender_name TEXT,
            receiver_id TEXT,
            content TEXT,
            is_admin INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

    // Add Columns to Bookings if not exists (check_in_status, qr_code)
    // For SQLite, checking column existence is verbose, so we just try to add and ignore error or do it in create if new.
    // For SQLite, checking column existence is verbose, so we just try to add and ignore error or do it in create if new.
    // For this dev env, let's just DROP and recreate bookings or assume we can add columns.
    // Let's add columns via ALTER TABLE for existing DBs safely
    db.run("ALTER TABLE bookings ADD COLUMN check_in_status TEXT DEFAULT 'pending'", (err) => { });
    db.run("ALTER TABLE bookings ADD COLUMN qr_code TEXT", (err) => { });
    db.run("ALTER TABLE bookings ADD COLUMN passenger_name TEXT", (err) => { });
    db.run("ALTER TABLE bookings ADD COLUMN seat_numbers TEXT", (err) => { });
    db.run("ALTER TABLE bookings ADD COLUMN schedule_id INTEGER", (err) => { });

    // Migration for Users Table
    db.run("ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'Active'", (err) => { });

    // Crews Table
    db.run(`CREATE TABLE IF NOT EXISTS crews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            role TEXT DEFAULT 'Driver', -- Driver, Conductor
            phone TEXT,
            status TEXT DEFAULT 'Active', -- Active, Off-duty, On-trip
            assigned_bus_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(assigned_bus_id) REFERENCES armadas(id)
    )`, (err) => {
      if (!err) {
        db.get("SELECT count(*) as count FROM crews", (err, row) => {
          if (row.count === 0) seedCrews();
        });
      }
    });

    // Routes Table (Enhanced)
    db.run(`CREATE TABLE IF NOT EXISTS routes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            duration TEXT, -- e.g. "3 Days"
            color TEXT DEFAULT '#3b82f6',
            origin TEXT NOT NULL,
            destination TEXT NOT NULL,
            distanceKm REAL,
            coordinates TEXT, -- Actual path geometry (JSON)
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

    db.run("ALTER TABLE routes ADD COLUMN distanceKm REAL", (err) => { });

    // Stops Table (New)
    db.run(`CREATE TABLE IF NOT EXISTS stops (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            route_id INTEGER,
            name TEXT NOT NULL,
            type TEXT, -- "pickup", "rest", "attraction"
            latitude REAL,
            longitude REAL,
            stop_order INTEGER,
            time_spent TEXT, -- e.g. "45 mins"
            fee TEXT, -- e.g. "Free" or "IDR 50.000"
            image_path TEXT,
            FOREIGN KEY(route_id) REFERENCES routes(id) ON DELETE CASCADE
    )`);

    // Schedules Table
    db.run(`CREATE TABLE IF NOT EXISTS schedules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            route_id INTEGER,
            armada_id INTEGER,
            days TEXT, 
            departure_time TEXT,
            arrival_time TEXT,
            price INTEGER, 
            price_weekend INTEGER, -- Dynamic Pricing
            total_seats INTEGER,
            seats_booked INTEGER DEFAULT 0,
            dates_active TEXT, -- JSON array of specific dates e.g. ["2025-12-25"]
            driver_id INTEGER, -- Assigned Driver
            conductor_id INTEGER, -- Assigned Conductor
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(route_id) REFERENCES routes(id),
            FOREIGN KEY(armada_id) REFERENCES armadas(id),
            FOREIGN KEY(driver_id) REFERENCES crews(id),
            FOREIGN KEY(conductor_id) REFERENCES crews(id)
        )`);

    // Migration: Add columns if they don't exist (Simple check)
    db.all("PRAGMA table_info(schedules)", (err, rows) => {
      const columnNames = rows.map(r => r.name);
      if (!columnNames.includes('driver_id')) {
        db.run("ALTER TABLE schedules ADD COLUMN driver_id INTEGER REFERENCES crews(id)");
      }
      if (!columnNames.includes('conductor_id')) {
        db.run("ALTER TABLE schedules ADD COLUMN conductor_id INTEGER REFERENCES crews(id)");
      }
      if (!columnNames.includes('is_live')) {
        db.run("ALTER TABLE schedules ADD COLUMN is_live INTEGER DEFAULT 1");
      }
      if (!columnNames.includes('needs_reassignment')) {
        db.run("ALTER TABLE schedules ADD COLUMN needs_reassignment INTEGER DEFAULT 0");
      }
    });
  });
}

function seedArmadas() {
  const armadas = [
    {
      name: 'Bus Rakyat (Ekonomi Tanpa AC)',
      level: 'LEVEL 1',
      price_per_km: 35000,
      route: 'Antar Kota Jarak Dekat (misal: Terminal Pulogadung - Bekasi/Cikarang via jalur industri).',
      amenities: "Sirkulasi Udara Alami (Jendela selalu terbuka).\n\"Live Music\" (Pengamen jalanan naik turun).\nPemberhentian Fleksibel (Berhenti di mana saja Anda melambaikan tangan).\nBebas Merokok (Sopir biasanya merokok).",
      seat_config: 'Bangku 3-2 (Plastik Keras/Vinyl).',
      history: "Dibuat pada tahun 1998, sasis Hino AK ini telah melewati tiga pemilik berbeda dan lebih dari 2 juta kilometer. Awalnya adalah jemputan pabrik, dicat ulang (seadanya) pada tahun 2010. Mesinnya meraung lebih keras dari pesawat jet, tetapi tidak pernah mogok di tanjakan curam. Ini adalah tulang punggung kelas pekerja—tangguh, berpasir, dan menolak untuk mati.",
      image_path: 'rakyat.jpg',
      capacity: 50,
      status: 'available',
      license_plate: 'B 7123 XA',
      last_service_date: '2025-11-01',
      next_service_date: '2025-12-01'
    },
    {
      name: 'Ekspres Karyawan (Bisnis AC)',
      level: 'LEVEL 2',
      price_per_km: 130000,
      route: 'Jalan Raya Antar Provinsi (misal: Jakarta - Bandung via Tol).',
      amenities: "Sistem AC Split (Sejuk, tapi terkadang meneteskan air).\nKursi Reclining (Sudut terbatas).\nKompartemen Bagasi Atas.\n1x Air Mineral (600ml).",
      seat_config: 'Kursi Kain 2-2.',
      history: "Diakuisisi pada 2015 dari lelang armada, Mercedes-Benz OH 1526 ini adalah kuda beban perusahaan. Sebelumnya berfungsi sebagai bus staf untuk BUMN sebelum dipasang kembali untuk transportasi umum. Tidak mencolok, dan suspensinya agak kaku, tetapi mengikuti jadwal yang ketat dan mengantar Anda ke tujuan tepat waktu, setiap saat.",
      image_path: 'karyawan.png',
      capacity: 40,
      status: 'on_duty',
      license_plate: 'D 7788 AB',
      last_service_date: '2025-10-15',
      next_service_date: '2025-12-20'
    },
    {
      name: 'Bus Eksekutif (Trans-Java)',
      level: 'LEVEL 3',
      price_per_km: 450000,
      route: 'Jarak Jauh Trans-Jawa (misal: Jakarta - Surabaya/Malang via Tol Trans Jawa).',
      amenities: "Kontrol Iklim dengan Pemurnian Udara.\nSandaran Kaki & Sandaran Kaki disertakan.\nToilet di dalam (Bersih & Berfungsi).\n1x Servis Makan (Prasmanan di rest area) + Snack Box.\nPort Pengisian USB di setiap kursi.",
      seat_config: 'Kursi Jumbo Mewah 2-2 (Campuran Beludru/Kain).',
      history: "Unit ini adalah kebanggaan ekspansi armada 2021. Dipesan langsung dari Karoseri Adiputro di Malang, menampilkan bodi 'Jetbus 3+ Voyager'. Dirancang khusus untuk menaklukkan tol Trans-Jawa dengan kecepatan tinggi yang konsisten sambil menjaga penumpang tetap tertidur. Pengemudinya adalah kapten senior dengan pengalaman 20 tahun tanpa kecelakaan.",
      image_path: 'executive.jpg',
      capacity: 30,
      status: 'available',
      license_plate: 'L 9988 OO',
      last_service_date: '2025-11-20',
      next_service_date: '2025-12-30'
    },
    {
      name: 'Sultan Sleeper Class',
      level: 'LEVEL 4',
      price_per_km: 1000000,
      route: 'Rute Wisata Premium (misal: Jakarta - Bali atau Jakarta - Jogja).',
      amenities: "Pod Tidur Pribadi (tempat tidur datar 180°) dengan pintu geser.\nTV Android Pribadi 12 inci dengan Netflix/YouTube.\nFitur pijat di setiap kursi.\nSelimut Premium & Bantal Busa Memori.\nKopi/Teh Mengalir & Makanan Panas disajikan di dalam pod oleh petugas.",
      seat_config: 'Suite Tunggal 1-1 (Dek Atas/Bawah).',
      history: "Diluncurkan untuk bersaing dengan kereta api dan pesawat terbang, double-decker Scania K410 ini dikenal sebagai 'Silent Glider'. Suspensi udara dikontrol secara elektronik untuk menghilangkan guncangan jalan. Interiornya dirancang oleh arsitek yang berspesialisasi dalam apartemen mewah. Sejak diluncurkan, selalu penuh dipesan 2 bulan sebelumnya oleh influencer dan pelancong yang mencari pengalaman 'terapung'.",
      image_path: 'sultan.png',
      capacity: 18,
      status: 'maintenance',
      license_plate: 'B 1 SUL',
      last_service_date: '2024-12-01',
      next_service_date: '2024-12-10'  // Already overdue for demo
    },
    {
      name: 'The Emperor (Private Charter)',
      level: 'LEVEL 5',
      price_per_km: 25000000,
      route: 'Itinerary Khusus (Ke mana pun, sesuai perintah klien).',
      amenities: "Area Lounge Lengkap dengan Sofa Kulit Italia.\nKamar Tidur Utama di dalam dengan Kasur Ukuran King & Shower En-suite.\nTermasuk Koki Pribadi & Bartender.\nWiFi Satelit (Starlink) & Ruang Konferensi.\nAtap Kaca Panoramik (Opasitas yang dapat dialihkan).\nPanel Bodi Berlapis Baja & Kaca Tahan Peluru (Perlindungan Level B6).",
      seat_config: 'Tata Letak Charter Pribadi.',
      history: "Tidak ada 'armada' untuk Level 5—hanya ada The One. Awalnya ditugaskan oleh diplomat Eropa, sasis yang dibuat khusus ini diimpor secara diam-diam dan dilengkapi oleh firma desain interior kapal pesiar. Menampilkan lantai kayu jati langka dan perlengkapan berlapis emas. Tidak terdaftar di jadwal umum; hanya tersedia untuk klien yang memiliki kartu keanggotaan khusus. Ini tidak hanya berkendara di jalan; ini memilikinya.",
      image_path: 'emperor.jpg',
      capacity: 8,
      status: 'available',
      license_plate: 'CD 01 A',
      last_service_date: '2025-01-01',
      next_service_date: '2026-01-01'
    }
  ];

  const stmt = db.prepare(`INSERT INTO armadas (name, level, price_per_km, route, amenities, seat_config, history, image_path, capacity, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  armadas.forEach(a => {
    stmt.run(a.name, a.level, a.price_per_km, a.route, a.amenities, a.seat_config, a.history, a.image_path, a.capacity, a.status);
  });
  stmt.finalize();
  console.log("Seeded Armadas");
}

function seedCrews() {
  const crews = [
    { name: 'Budi Santoso', role: 'Driver', phone: '081234567890', status: 'Active', assigned_bus_id: 1 },
    { name: 'Agus "Ngebut" Kurniawan', role: 'Driver', phone: '081298765432', status: 'Active', assigned_bus_id: 2 },
    { name: 'Udin Sedunia', role: 'Conductor', phone: '085678901234', status: 'Active', assigned_bus_id: 1 },
    { name: 'Capt. Herman', role: 'Driver', phone: '081345678901', status: 'On-trip', assigned_bus_id: 3 }
  ];
  const stmt = db.prepare("INSERT INTO crews (name, role, phone, status, assigned_bus_id) VALUES (?, ?, ?, ?, ?)");
  crews.forEach(c => {
    stmt.run(c.name, c.role, c.phone, c.status, c.assigned_bus_id);
  });
  stmt.finalize();
  console.log("Seeded Crews");
}

module.exports = db;
