const fs = require('fs');
let code = fs.readFileSync('src/components/Booking.tsx', 'utf8');
code = code.replace(/\{ \(\n    selectedStart[\s\S]*? \) \?/g, "{ (selectedStart && (chunks.findIndex(c => c.time === selectedStart.time) + 6 <= chunks.length) && chunks.slice(chunks.findIndex(c => c.time === selectedStart.time), chunks.findIndex(c => c.time === selectedStart.time) + 6).every(c => selectedStart.machineId === 1 ? c.machine1Free : c.machine2Free)) ?");
code = code.replace(/\( \n    selectedStart[\s\S]*?\) \?/g, "(selectedStart && (chunks.findIndex(c => c.time === selectedStart.time) + 6 <= chunks.length) && chunks.slice(chunks.findIndex(c => c.time === selectedStart.time), chunks.findIndex(c => c.time === selectedStart.time) + 6).every(c => selectedStart.machineId === 1 ? c.machine1Free : c.machine2Free)) ?");
fs.writeFileSync('src/components/Booking.tsx', code);
