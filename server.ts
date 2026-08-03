import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { addDays, endOfWeek, isAfter, isBefore, parseISO, startOfWeek, subDays, addHours, differenceInHours, startOfDay, addMinutes, format } from 'date-fns';
import db, { initDb } from './src/db.js';
import path from 'path';
import { createServer as createViteServer } from 'vite';

initDb();

// Mock-Service für Erinnerungen
function mockScheduleReminder(userId: number, endTime: string, type: string) {
  const time = new Date(endTime).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  console.log(`[Mock-Service] Erinnerung geplant für User ${userId}: Bitte Wäsche entnehmen um ${time} Uhr (Typ: ${type})`);
}


async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cors());

  const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-laundry-key-123';

  // Helper to authenticate
  const auth = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).json({ error: 'Invalid token' });
    }
  };

  const requireAdmin = (req: any, res: any, next: any) => {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    next();
  };

  // --- API ROUTES ---

  // 1. Auth
  app.post('/api/login', (req, res) => {
    const { lastName, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE lastName = ?').get(lastName) as any;
    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      return res.status(401).json({ error: 'Ungültiger Name oder Passwort' });
    }
    const token = jwt.sign({ id: user.id, lastName: user.lastName, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, lastName: user.lastName, role: user.role } });
  });

  app.get('/api/me', auth, (req: any, res) => {
    const user = db.prepare('SELECT id, lastName, role FROM users WHERE id = ?').get(req.user.id);
    res.json({ user });
  });

  // 2. Booking Logic
  const ALLOWED_START_TIMES = ['08:00', '10:00', '11:45', '13:00', '14:00'];
  const WASH_DURATION_HOURS = 2;

  app.get('/api/remaining-bookings', auth, (req: any, res) => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const weekBookings = db.prepare(`SELECT COUNT(*) as c FROM bookings WHERE userId = ? AND status = 'active' AND startTime >= ? AND startTime <= ?`).get(req.user.id, weekStart.toISOString(), weekEnd.toISOString()) as any;
    const remaining = Math.max(0, 2 - weekBookings.c);
    res.json({ remaining, total: 2 });
  });

  app.get('/api/slots', auth, (req, res) => {
    const dateStr = req.query.date as string;
    if (!dateStr) return res.status(400).json({ error: 'Date required' });
    
    const targetDate = startOfDay(parseISO(dateStr));
    const now = new Date();

    const nextDay = addDays(targetDate, 1);
    const bookings = db.prepare(`SELECT b.*, u.lastName FROM bookings b JOIN users u ON b.userId = u.id WHERE status = 'active' AND startTime >= ? AND startTime < ?`).all(targetDate.toISOString(), nextDay.toISOString()) as any[];
    const blocks = db.prepare(`SELECT * FROM blocks WHERE startTime >= ? AND startTime < ?`).all(targetDate.toISOString(), nextDay.toISOString()) as any[];

    const chunks = [];
    const WASH_DURATION_HOURS = 2;

    for (let hour = 8; hour < 16; hour++) {
      for (const min of [0, 30]) {
        const time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
        const start = new Date(targetDate);
        start.setHours(hour, min, 0, 0);
        const end = addMinutes(start, 30);
        
        const isOverlapping = (machineId, sTime, eTime) => {
          return bookings.find(b => {
            if (b.machineId !== machineId) return false;
            return sTime < new Date(b.endTime) && eTime > new Date(b.startTime);
          });
        };
        const isBlocked = (machineId, sTime, eTime) => {
          return blocks.find(b => {
            if (b.machineId !== null && b.machineId !== machineId) return false;
            return sTime < new Date(b.endTime) && eTime > new Date(b.startTime);
          });
        };

        const over1 = isOverlapping(1, start, end);
        const over2 = isOverlapping(2, start, end);

        const m1Free = !over1 && !isBlocked(1, start, end);
        const m2Free = !over2 && !isBlocked(2, start, end);

        const checkCanStart = (machineId) => {
          if (isBefore(start, addHours(now, 2))) return false;
          const twoHourEnd = addHours(start, WASH_DURATION_HOURS);
          if (twoHourEnd.getHours() > 16 || (twoHourEnd.getHours() === 16 && twoHourEnd.getMinutes() > 0)) return false;
          
          const conflictBooking = bookings.some(b => {
            if (b.machineId !== machineId) return false;
            return start < new Date(b.endTime) && twoHourEnd > new Date(b.startTime);
          });
          const conflictBlock = blocks.some(b => {
            if (b.machineId !== null && b.machineId !== machineId) return false;
            return start < new Date(b.endTime) && twoHourEnd > new Date(b.startTime);
          });
          return !conflictBooking && !conflictBlock;
        };

        chunks.push({
          time,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          machine1Free: m1Free,
          machine2Free: m2Free,
          m1Booking: over1 ? (over1.userId === req.user.id ? 'Du' : 'Belegt') : null,
          m2Booking: over2 ? (over2.userId === req.user.id ? 'Du' : 'Belegt') : null,
          canStartM1: checkCanStart(1),
          canStartM2: checkCanStart(2),
          canHaveDryer: (hour + WASH_DURATION_HOURS) <= 15
        });
      }
    }

    res.json({ chunks });
  });

  app.post('/api/bookings', auth, (req: any, res) => {
    const { startTime, machineId, withDryer } = req.body;
    const start = new Date(startTime);
    
    // Validation constraints
    const now = new Date();
    if (isBefore(start, addHours(now, 2))) return res.status(400).json({ error: 'Muss mindestens 2 Stunden vorher gebucht werden.' });
    if (isAfter(start, addDays(now, 5))) return res.status(400).json({ error: 'Maximal 5 Tage im Voraus.' });

    // Limit check (max 2 per calendar week)
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const weekBookings = db.prepare(`SELECT COUNT(*) as c FROM bookings WHERE userId = ? AND status = 'active' AND startTime >= ? AND startTime <= ?`).get(req.user.id, weekStart.toISOString(), weekEnd.toISOString()) as any;
    if (weekBookings.c >= 2) return res.status(400).json({ error: 'Limit von 2 Buchungen pro Woche erreicht.' });

    const end = addHours(start, withDryer ? 3 : 2);
    
    // Check overlaps
    const overlap = db.prepare(`SELECT * FROM bookings WHERE machineId = ? AND status = 'active' AND startTime < ? AND endTime > ?`).get(machineId, end.toISOString(), start.toISOString());
    if (overlap) return res.status(400).json({ error: 'Diese Zeit ist bereits belegt.' });
    const block = db.prepare(`SELECT * FROM blocks WHERE (machineId = ? OR machineId IS NULL) AND startTime < ? AND endTime > ?`).get(machineId, end.toISOString(), start.toISOString());
    if (block) return res.status(400).json({ error: 'Diese Zeit ist blockiert.' });

    
    const type = withDryer ? 'wash_and_dry' : 'wash';

    // Insert
    db.prepare('INSERT INTO bookings (userId, machineId, type, startTime, endTime) VALUES (?, ?, ?, ?, ?)')
      .run(req.user.id, machineId, type, start.toISOString(), end.toISOString());
    
    // Simuliere die Erinnerung
    mockScheduleReminder(req.user.id, end.toISOString(), type);

      
    res.json({ success: true });
  });

  app.get('/api/my-bookings', auth, (req: any, res) => {
    const bookings = db.prepare(`SELECT * FROM bookings WHERE userId = ? AND status != 'cancelled' ORDER BY startTime ASC`).all(req.user.id);
    res.json({ bookings });
  });

  app.delete('/api/bookings/:id', auth, (req: any, res) => {
    db.prepare(`UPDATE bookings SET status = 'cancelled' WHERE id = ? AND userId = ?`).run(req.params.id, req.user.id);
    res.json({ success: true });
  });

  // Exchanges
  app.post('/api/bookings/:id/exchange', auth, (req: any, res) => {
    db.prepare(`UPDATE bookings SET status = 'exchange_offered' WHERE id = ? AND userId = ?`).run(req.params.id, req.user.id);
    res.json({ success: true });
  });

  app.get('/api/exchanges', auth, (req: any, res) => {
    // Only future active exchanges
    const now = new Date().toISOString();
    const exchanges = db.prepare(`SELECT id, type, startTime, endTime FROM bookings WHERE status = 'exchange_offered' AND startTime > ? AND userId != ? ORDER BY startTime ASC`).all(now, req.user.id);
    res.json({ exchanges });
  });

  app.post('/api/exchanges/:id/accept', auth, (req: any, res) => {
    // Limit check for the acceptor
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const weekBookings = db.prepare(`SELECT COUNT(*) as c FROM bookings WHERE userId = ? AND status = 'active' AND startTime >= ? AND startTime <= ?`).get(req.user.id, weekStart.toISOString(), weekEnd.toISOString()) as any;
    if (weekBookings.c >= 2) return res.status(400).json({ error: 'Du hast bereits 2 Buchungen in dieser Woche.' });

    // Update booking owner to the new user and set status to active
    const info = db.prepare(`UPDATE bookings SET userId = ?, status = 'active' WHERE id = ? AND status = 'exchange_offered'`).run(req.user.id, req.params.id);
    if (info.changes === 0) return res.status(400).json({ error: 'Tausch nicht mehr verfügbar.' });
    res.json({ success: true });
  });

  // Admin
  app.get('/api/admin/users', auth, requireAdmin, (req, res) => {
    const users = db.prepare('SELECT id, lastName, role FROM users').all();
    res.json({ users });
  });
  app.post('/api/admin/users', auth, requireAdmin, (req, res) => {
    const { lastName, password, role } = req.body;
    try {
      const hash = bcrypt.hashSync(password, 10);
      db.prepare('INSERT INTO users (lastName, passwordHash, role) VALUES (?, ?, ?)').run(lastName, hash, role || 'resident');
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });
  app.post('/api/admin/users/:id/reset', auth, requireAdmin, (req, res) => {
    const { password } = req.body;
    const hash = bcrypt.hashSync(password, 10);
    db.prepare('UPDATE users SET passwordHash = ? WHERE id = ?').run(hash, req.params.id);
    res.json({ success: true });
  });
  app.get('/api/admin/bookings', auth, requireAdmin, (req, res) => {
    const bookings = db.prepare('SELECT b.*, u.lastName FROM bookings b JOIN users u ON b.userId = u.id ORDER BY startTime DESC').all();
    res.json({ bookings });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
