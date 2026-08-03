const fs = require('fs');
let code = fs.readFileSync('src/components/Booking.tsx', 'utf8');

// fix useEffect
code = code.replace(/useEffect\(\(\) => \{\n    fetchChunks\(\);\n        fetchRemainingBookings\(\);\n  \}, \[fetchChunks\]\);/, `useEffect(() => {
    fetchChunks();
  }, [fetchChunks]);`);

// fix handleBook
code = code.replace(/fetchChunks\(\);\n        alert\('Erfolgreich gebucht!'\);/, `fetchChunks();
        fetchRemainingBookings();
        alert('Erfolgreich gebucht!');`);

fs.writeFileSync('src/components/Booking.tsx', code);
