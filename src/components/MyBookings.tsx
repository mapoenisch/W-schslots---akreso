import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthProvider';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { Trash2, Repeat } from 'lucide-react';

export default function MyBookings() {
  const { token } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/my-bookings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setBookings(data.bookings);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleCancel = async (id: number) => {
    if (!confirm('Buchung wirklich stornieren?')) return;
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchBookings();
    } catch (e) {
      console.error(e);
    }
  };

  const handleOfferExchange = async (id: number) => {
    if (!confirm('Buchung zum Tausch anbieten?')) return;
    try {
      const res = await fetch(`/api/bookings/${id}/exchange`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchBookings();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Lade...</div>;

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Meine Buchungen</h1>

      {bookings.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
          <div className="text-gray-400 mb-2">Keine aktuellen Buchungen</div>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map(b => (
            <div key={b.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="font-semibold text-lg">
                    {format(parseISO(b.startTime), 'EEEE, d. MMM', { locale: de })}
                  </div>
                  <div className="text-[#53a661] font-medium">
                    {format(parseISO(b.startTime), 'HH:mm')} – {format(parseISO(b.endTime), 'HH:mm')} Uhr
                  </div>
                  <div className="text-gray-500 text-sm mt-1">
                    Maschine {b.machineId} {b.type === 'wash_and_dry' && ' + Trockner'}
                  </div>
                </div>
                {b.status === 'exchange_offered' && (
                  <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full font-medium">
                    Im Tausch
                  </span>
                )}
              </div>

              <div className="flex space-x-2 border-t pt-4">
                {b.status !== 'exchange_offered' && (
                  <button 
                    onClick={() => handleOfferExchange(b.id)}
                    className="flex-1 flex items-center justify-center space-x-1 py-2 bg-emerald-50 text-[#53a661] rounded-lg hover:bg-emerald-100 transition-colors font-medium text-sm"
                  >
                    <Repeat size={16} />
                    <span>Tauschen</span>
                  </button>
                )}
                <button 
                  onClick={() => handleCancel(b.id)}
                  className="flex-1 flex items-center justify-center space-x-1 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm"
                >
                  <Trash2 size={16} />
                  <span>Stornieren</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
