const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(/const time = \\`\$\{hour/g, 'const time = `${hour');
code = code.replace(/0'\)}\\`/g, "0')}`");
fs.writeFileSync('server.ts', code);
