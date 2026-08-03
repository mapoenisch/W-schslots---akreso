const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const replacement = `const end = addHours(start, withDryer ? 3 : 2);
    
    // Check overlaps
    const overlap = db.prepare(\\\`SELECT * FROM bookings WHERE machineId = ? AND status = 'active' AND startTime < ? AND endTime > ?\\\`).get(machineId, end.toISOString(), start.toISOString());
    if (overlap) return res.status(400).json({ error: 'Diese Zeit ist bereits belegt.' });
    const block = db.prepare(\\\`SELECT * FROM blocks WHERE (machineId = ? OR machineId IS NULL) AND startTime < ? AND endTime > ?\\\`).get(machineId, end.toISOString(), start.toISOString());
    if (block) return res.status(400).json({ error: 'Diese Zeit ist blockiert.' });
`;

code = code.replace(/const end = addHours\(start, withDryer \? 3 : WASH_DURATION_HOURS\);/g, replacement);

fs.writeFileSync('server.ts', code);
