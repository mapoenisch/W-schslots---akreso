const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const endpointCode = `
  app.get('/api/remaining-bookings', auth, (req: any, res) => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const weekBookings = db.prepare(\\\`SELECT COUNT(*) as c FROM bookings WHERE userId = ? AND status = 'active' AND startTime >= ? AND startTime <= ?\\\`).get(req.user.id, weekStart.toISOString(), weekEnd.toISOString()) as any;
    const remaining = Math.max(0, 2 - weekBookings.c);
    res.json({ remaining, total: 2 });
  });
`;

if (!code.includes('/api/remaining-bookings')) {
  code = code.replace(/app\.get\('\/api\/slots'/g, endpointCode.trim() + "\n\n  app.get('/api/slots'");
  fs.writeFileSync('server.ts', code);
}
