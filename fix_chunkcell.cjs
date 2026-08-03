const fs = require('fs');
let code = fs.readFileSync('src/components/Booking.tsx', 'utf8');

const regex = /if \(!free\) \{[\s\S]*?return \([\s\S]*?<button /;
const replacement = `if (!canStart) {
    return <div />;
  }

  return (
    <button `;

code = code.replace(regex, replacement);
fs.writeFileSync('src/components/Booking.tsx', code);
