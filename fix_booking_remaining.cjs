const fs = require('fs');
let code = fs.readFileSync('src/components/Booking.tsx', 'utf8');

const stateVar = `  const [remainingBookings, setRemainingBookings] = useState<number | null>(null);`;
code = code.replace(/const \[bookingError, setBookingError\] = useState\(''\);/, "const [bookingError, setBookingError] = useState('');\n" + stateVar);

const fetchRemaining = `
  const fetchRemainingBookings = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/remaining-bookings', {
        headers: { Authorization: \`Bearer \${token}\` }
      });
      const data = await res.json();
      if (res.ok) setRemainingBookings(data.remaining);
    } catch (e) {
      console.error(e);
    }
  }, [token]);

  useEffect(() => {
    fetchRemainingBookings();
  }, [fetchRemainingBookings]);
`;

code = code.replace(/useEffect\(\(\) => \{\n    fetchChunks\(\);\n  \}, \[fetchChunks\]\);/, "useEffect(() => {\n    fetchChunks();\n  }, [fetchChunks]);\n" + fetchRemaining);

const refreshCall = `fetchChunks();
        fetchRemainingBookings();`;

code = code.replace(/fetchChunks\(\);/, refreshCall);

const uiElement = `
      {remainingBookings !== null && (
        <div className="mb-4 bg-emerald-50 border border-emerald-100 p-3 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="text-sm font-medium text-emerald-800">Verfügbare Waschgänge diese Woche</div>
          <div className="flex space-x-1">
            {[...Array(2)].map((_, i) => (
              <div 
                key={i} 
                className={\`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold \${i < remainingBookings ? 'bg-[#53a661] text-white' : 'bg-gray-200 text-gray-400'}\`}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>
      )}
`;

code = code.replace(/<h1 className="text-3xl font-bold text-gray-900 mb-6">Freie Zeit finden<\/h1>/, `<h1 className="text-3xl font-bold text-gray-900 mb-6">Freie Zeit finden</h1>\n${uiElement}`);

fs.writeFileSync('src/components/Booking.tsx', code);
