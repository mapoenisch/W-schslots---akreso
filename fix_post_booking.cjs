const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /const end = addHours\(start, WASH_DURATION_HOURS\);/g;
code = code.replace(regex, "const end = addHours(start, withDryer ? 3 : WASH_DURATION_HOURS);");

fs.writeFileSync('server.ts', code);
