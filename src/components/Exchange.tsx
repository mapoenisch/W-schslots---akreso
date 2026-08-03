import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthProvider';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

export default function Exchange() {
  const { token } = useAuth();
  const [exchanges, setExchanges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchExchanges = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/exchanges', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setExchanges(data.exchanges);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    fetchExchanges();
  }, [fetchExchanges]);

  const handleAccept = async (id: number) => {
    setError('');
    if (!confirm('Diesen Termin übernehmen? (Zählt zu deinem Wochenlimit)')) return;
    try {
      const res = await fetch(`/api/exchanges/${id}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        alert('Erfolgreich übernommen!');
        fetchExchanges();
      } else {
        setError(data.error || 'Fehler beim Übernehmen');
      }
    } catch (e) {
      setError('Netzwerkfehler');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Lade...</div>;

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Tauschbörse</h1>
      <p className="text-gray-500 mb-6">Hier findest du anonyme Termine, die von anderen Bewohnern abgegeben wurden.</p>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">{error}</div>}

      {exchanges.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
          <div className="text-gray-400">Keine Angebote aktuell</div>
        </div>
      ) : (
        <div className="space-y-4">
          {exchanges.map(e => (
            <div key={e.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                <div className="font-semibold text-lg">
                  {format(parseISO(e.startTime), 'EEEE, d. MMM', { locale: de })}
                </div>
                <div className="text-[#53a661] font-medium">
                  {format(parseISO(e.startTime), 'HH:mm')} – {format(parseISO(e.endTime), 'HH:mm')} Uhr
                </div>
                <div className="text-gray-500 text-sm mt-1">
                  {e.type === 'wash_and_dry' ? 'Waschen + Trockner' : 'Nur Waschen'}
                </div>
              </div>
              
              <button 
                onClick={() => handleAccept(e.id)}
                className="bg-[#53a661] text-white px-4 py-2 rounded-xl font-medium hover:bg-emerald-700 transition-colors"
              >
                Übernehmen
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
