const fs = require('fs');
let code = fs.readFileSync('src/components/Booking.tsx', 'utf8');

const regex = /selectedStart.chunkInfo.canHaveDryer \?/g;
const replacement = `(
    selectedStart && 
    (chunks.findIndex(c => c.time === selectedStart.time) + 6 <= chunks.length) &&
    chunks.slice(chunks.findIndex(c => c.time === selectedStart.time), chunks.findIndex(c => c.time === selectedStart.time) + 6).every(c => selectedStart.machineId === 1 ? c.machine1Free : c.machine2Free)
  ) ?`;

code = code.replace(regex, replacement);

const regex2 = /\{selectedStart.chunkInfo.canHaveDryer \?/g;
const replacement2 = `{ (
    selectedStart && 
    (chunks.findIndex(c => c.time === selectedStart.time) + 6 <= chunks.length) &&
    chunks.slice(chunks.findIndex(c => c.time === selectedStart.time), chunks.findIndex(c => c.time === selectedStart.time) + 6).every(c => selectedStart.machineId === 1 ? c.machine1Free : c.machine2Free)
  ) ?`;

code = code.replace(regex2, replacement2);

fs.writeFileSync('src/components/Booking.tsx', code);
