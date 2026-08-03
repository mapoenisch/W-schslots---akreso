const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const replacement = `const checkCanStart = (machineId, hours) => {
          if (isBefore(start, addHours(now, 2))) return false;
          let endT = addHours(start, hours);
          if (endT.getHours() > 16 || (endT.getHours() === 16 && endT.getMinutes() > 0)) return false;
          
          const conflictBooking = bookings.some(b => {
            if (b.machineId !== machineId) return false;
            return start < new Date(b.endTime) && endT > new Date(b.startTime);
          });
          const conflictBlock = blocks.some(b => {
            if (b.machineId !== null && b.machineId !== machineId) return false;
            return start < new Date(b.endTime) && endT > new Date(b.startTime);
          });
          return !conflictBooking && !conflictBlock;
        };`;

code = code.replace(/const checkCanStart = \(machineId\) => \{[\s\S]*?return !conflictBooking && !conflictBlock;\n        \};/g, replacement);

const replacement2 = `canStartM1: checkCanStart(1, 2),
          canStartM2: checkCanStart(2, 2),
          canHaveDryer: (checkCanStart(1, 3) || checkCanStart(2, 3))`;

// wait, canHaveDryer should be per machine!
// The chunk doesn't have per-machine canHaveDryer. It's a single boolean.
// But the UI checks selectedStart.chunkInfo.canHaveDryer. That means it applies to both.
// Let's change the chunk schema?
// Or we can just calculate it in the frontend!
// If the frontend has all chunks, it can check if the next 6 chunks are free for the selected machine!
// That's much easier!
