const fs = require('fs');
let code = fs.readFileSync('src/components/Booking.tsx', 'utf8');

const replacement = `            <div className="text-center text-sm text-gray-500 mb-4">
              Die Bezahlung erfolgt in bar vor Ort.
            </div>
            <div className="flex space-x-3">`;

code = code.replace(/            <div className="flex space-x-3">/, replacement);
fs.writeFileSync('src/components/Booking.tsx', code);
