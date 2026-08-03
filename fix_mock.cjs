const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const mockService = `
// Mock-Service für Erinnerungen
function mockScheduleReminder(userId: number, endTime: string, type: string) {
  const time = new Date(endTime).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  console.log(\`[Mock-Service] Erinnerung geplant für User \${userId}: Bitte Wäsche entnehmen um \${time} Uhr (Typ: \${type})\`);
}
`;

if (!code.includes('function mockScheduleReminder')) {
  code = code.replace(/initDb\(\);/g, "initDb();\n" + mockService);
  fs.writeFileSync('server.ts', code);
}
