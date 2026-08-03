const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /app\.get\('\/api\/slots', auth, \(req, res\) => \{[\s\S]*?res\.json\(\{ slots \}\);\n  \}\);/;

const replacement = `app.get('/api/slots', auth, (req, res) => {
    const dateStr = req.query.date as string;
    if (!dateStr) return res.status(400).json({ error: 'Date required' });
    
    const targetDate = startOfDay(parseISO(dateStr));
    const now = new Date();

    const nextDay = addDays(targetDate, 1);
    const bookings = db.prepare(\\\`SELECT b.*, u.lastName FROM bookings b JOIN users u ON b.userId = u.id WHERE status = 'active' AND startTime >= ? AND startTime < ?\\\`).all(targetDate.toISOString(), nextDay.toISOString()) as any[];
    const blocks = db.prepare(\\\`SELECT * FROM blocks WHERE startTime >= ? AND startTime < ?\\\`).all(targetDate.toISOString(), nextDay.toISOString()) as any[];

    const chunks = [];
    const WASH_DURATION_HOURS = 2;

    for (let hour = 8; hour < 16; hour++) {
      for (let min of [0, 30]) {
        const time = \\\`\${hour.toString().padStart(2, '0')}:\${min.toString().padStart(2, '0')}\\\`;
        let start = new Date(targetDate);
        start.setHours(hour, min, 0, 0);
        let end = addMinutes(start, 30);
        
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
          let twoHourEnd = addHours(start, WASH_DURATION_HOURS);
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
  });`;

code = code.replace(regex, replacement);
fs.writeFileSync('server.ts', code);
