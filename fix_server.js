const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/'SELECT \* FROM bookings WHERE status = 'active' AND startTime >= \? AND startTime < \?'/g, "`SELECT * FROM bookings WHERE status = 'active' AND startTime >= ? AND startTime < ?`");
code = code.replace(/'SELECT COUNT\(\*\) as c FROM bookings WHERE userId = \? AND status = 'active' AND startTime >= \? AND startTime <= \?'/g, "`SELECT COUNT(*) as c FROM bookings WHERE userId = ? AND status = 'active' AND startTime >= ? AND startTime <= ?`");
code = code.replace(/'SELECT \* FROM bookings WHERE userId = \? AND status != 'cancelled' ORDER BY startTime ASC'/g, "`SELECT * FROM bookings WHERE userId = ? AND status != 'cancelled' ORDER BY startTime ASC`");
code = code.replace(/'UPDATE bookings SET status = 'cancelled' WHERE id = \? AND userId = \?'/g, "`UPDATE bookings SET status = 'cancelled' WHERE id = ? AND userId = ?`");
code = code.replace(/'UPDATE bookings SET status = 'exchange_offered' WHERE id = \? AND userId = \?'/g, "`UPDATE bookings SET status = 'exchange_offered' WHERE id = ? AND userId = ?`");
code = code.replace(/'SELECT id, type, startTime, endTime FROM bookings WHERE status = 'exchange_offered' AND startTime > \? AND userId != \? ORDER BY startTime ASC'/g, "`SELECT id, type, startTime, endTime FROM bookings WHERE status = 'exchange_offered' AND startTime > ? AND userId != ? ORDER BY startTime ASC`");
code = code.replace(/'UPDATE bookings SET userId = \?, status = 'active' WHERE id = \? AND status = 'exchange_offered''/g, "`UPDATE bookings SET userId = ?, status = 'active' WHERE id = ? AND status = 'exchange_offered'`");

fs.writeFileSync('server.ts', code);
