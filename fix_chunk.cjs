const fs = require('fs');
let code = fs.readFileSync('src/components/Booking.tsx', 'utf8');
code = code.replace(/<div className="bg-\[#53a661\] text-white rounded-md p-2 text-center text-sm font-medium transition-colors shadow-sm">/g, '<div className="bg-[#53a661] text-white rounded-md p-1.5 text-center text-[10px] font-medium transition-colors shadow-sm flex items-center justify-center">Gewählt');
fs.writeFileSync('src/components/Booking.tsx', code);
