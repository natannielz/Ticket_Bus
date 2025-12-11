const sqlite3 = require('sqlite3').verbose();
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
        // Users Table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'user',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

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
            status TEXT DEFAULT 'available',
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
            date TEXT,
            seats INTEGER,
            total_price INTEGER,
            status TEXT DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id),
            FOREIGN KEY(armada_id) REFERENCES armadas(id)
        )`);
    });
}

function seedArmadas() {
    const armadas = [
        {
            name: 'The "Rakyat" Commuter',
            level: 'LEVEL 1',
            price_per_km: 35000,
            route: 'Inter-city Short Distance (e.g., Terminal Pulogadung - Bekasi/Cikarang industrial routes).',
            amenities: "Natural Air Circulation (Windows perpetually open).\n\"Live Music\" (Street buskers hopping on/off).\nFlexible stops (Stop anywhere you wave).\nSmoking friendly (Driver usually smoking).",
            seat_config: '3-2 Bench (Hard plastic/vinyl).',
            history: "Built in 1998, this Hino AK chassis has survived three different owners and over 2 million kilometers. Originally a factory shuttle, it was repainted (poorly) in 2010. The engine roars louder than a jet plane, but it has never broken down on a steep hill. It is the backbone of the working class—reliable, gritty, and refuses to die.",
            image_path: 'rakyat.jpg',
            capacity: 50,
            status: 'available'
        },
        {
            name: 'The "Karyawan" Express',
            level: 'LEVEL 2',
            price_per_km: 130000,
            route: 'Inter-Provincial Highway (e.g., Jakarta - Bandung via Toll).',
            amenities: "Split AC System (Cool, but sometimes drips water).\nReclining Seats (Limited angle).\nOverhead Baggage Compartment.\n1x Mineral Water (600ml).",
            seat_config: '2-2 Fabric Seats.',
            history: "Acquired in 2015 from a fleet auction, this Mercedes-Benz OH 1526 is the workhorse of the company. It previously served as a staff bus for a state-owned enterprise before being refitted for public transport. It’s not flashy, and the suspension is a bit stiff, but it follows a strict schedule and gets you to your destination on time, every time.",
            image_path: 'karyawan.png',
            capacity: 40,
            status: 'available'
        },
        {
            name: 'The "Executive" Liner',
            level: 'LEVEL 3',
            price_per_km: 450000,
            route: 'Trans-Java Long Haul (e.g., Jakarta - Surabaya/Malang via Trans Java Toll).',
            amenities: "Climate Control with Air Purification.\nLeg Rests & Foot Rests included.\nOn-board Toilet (Clean & Functional).\n1x Meal Service (Prasmanan at rest area) + Snack Box.\nUSB Charging Ports at every seat.",
            seat_config: '2-2 Plush Jumbo Seats (Velvet/Fabric mix).',
            history: "This unit is the pride of the 2021 fleet expansion. Ordered directly from the Adiputro Karoseri in Malang, it features the 'Jetbus 3+ Voyager' body. It was specifically designed to conquer the Trans-Java toll road at consistent high speeds while keeping passengers asleep. The driver is a senior captain with 20 years of accident-free experience.",
            image_path: 'executive.jpg',
            capacity: 30,
            status: 'available'
        },
        {
            name: 'The "Sultan" Sleeper',
            level: 'LEVEL 4',
            price_per_km: 1000000,
            route: 'Premium Tourist Routes (e.g., Jakarta - Bali or Jakarta - Jogja).',
            amenities: "Private Sleeper Pods (180° lie-flat beds) with sliding doors.\nPersonal 12-inch Android TV with Netflix/YouTube.\nMassage feature in every seat.\nPremium Blanket & Memory Foam Pillow.\nFlowing Coffee/Tea & Hot Meal served in-pod by an attendant.",
            seat_config: '1-1 Single Suites (Upper/Lower Deck).',
            history: "Launched to compete with trains and airplanes, this Scania K410 double-decker is known as the 'Silent Glider.' The air suspension is electronically controlled to eliminate road bumps. The interior was designed by an architect who specializes in luxury apartments. Since its launch, it has become fully booked 2 months in advance by influencers and travelers seeking the 'floating' experience.",
            image_path: 'sultan.png',
            capacity: 18,
            status: 'available'
        },
        {
            name: 'The "Emperor" Land Yacht',
            level: 'LEVEL 5',
            price_per_km: 25000000,
            route: 'Custom Itinerary (Anywhere the client commands).',
            amenities: "Full Lounge Area with Italian Leather Sofas.\nOn-board Master Bedroom with King Size Mattress & En-suite Shower.\nPrivate Chef & Bartender included.\nSatellite WiFi (Starlink) & Conference Room.\nPanoramic Glass Roof (Switchable opacity).\nArmored Body Panels & Bulletproof Glass (Level B6 Protection).",
            seat_config: 'Private Charter Layout.',
            history: "There is no 'fleet' for Level 5—there is only The One. Originally commissioned by a European diplomat, this custom-built chassis was imported secretly and outfitted by a yacht interior design firm. It features rare teak wood flooring and gold-plated fixtures. It is not listed on public schedules; it is only available to clients who have a specific membership card. It doesn't just drive on the road; it owns it.",
            image_path: 'emperor.jpg',
            capacity: 8,
            status: 'available'
        }
    ];

    const stmt = db.prepare(`INSERT INTO armadas (name, level, price_per_km, route, amenities, seat_config, history, image_path, capacity, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    armadas.forEach(a => {
        stmt.run(a.name, a.level, a.price_per_km, a.route, a.amenities, a.seat_config, a.history, a.image_path, a.capacity, a.status);
    });
    stmt.finalize();
    console.log("Seeded Armadas");
}

module.exports = db;
