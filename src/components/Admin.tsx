import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthProvider';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { Users, Calendar } from 'lucide-react';

export default function Admin() {
  const { token, user } = useAuth();
  const [view, setView] = useState<'users' | 'bookings'>('users');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New user form
  const [newLastName, setNewLastName] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const fetchData = useCallback(async () => {
    if (!token || user?.role !== 'admin') return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/${view}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (res.ok) setData(json[view]);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [token, user?.role, view]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ lastName: newLastName, password: newPassword })
      });
      if (res.ok) {
        setNewLastName('');
        setNewPassword('');
        fetchData();
        alert('Bewohner angelegt');
      } else {
        const d = await res.json();
        alert(d.error || 'Fehler');
      }
    } catch (e) {
      alert('Netzwerkfehler');
    }
  };

  const handleReset = async (id: number) => {
    const pwd = prompt('Neues Passwort eingeben:');
    if (!pwd) return;
    try {
      const res = await fetch(`/api/admin/users/${id}/reset`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ password: pwd })
      });
      if (res.ok) alert('Passwort zurückgesetzt');
    } catch (e) {
      console.error(e);
    }
  };

  if (user?.role !== 'admin') return <div className="p-8 text-center">Kein Zugriff</div>;

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin-Bereich</h1>

      <div className="flex space-x-2 mb-6">
        <button 
          onClick={() => setView('users')}
          className={`flex-1 py-2 rounded-xl font-medium flex items-center justify-center space-x-2 ${view === 'users' ? 'bg-[#53a661] text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
        >
          <Users size={18} />
          <span>Bewohner</span>
        </button>
        <button 
          onClick={() => setView('bookings')}
          className={`flex-1 py-2 rounded-xl font-medium flex items-center justify-center space-x-2 ${view === 'bookings' ? 'bg-[#53a661] text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
        >
          <Calendar size={18} />
          <span>Buchungen</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Lade...</div>
      ) : view === 'users' ? (
        <div className="space-y-6">
          <form onSubmit={handleCreateUser} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <h2 className="font-bold">Neuer Bewohner</h2>
            <div className="flex space-x-2">
              <input 
                type="text" 
                placeholder="Nachname" 
                value={newLastName}
                onChange={e => setNewLastName(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-lg"
                required
              />
              <input 
                type="text" 
                placeholder="Passwort" 
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-lg"
                required
              />
            </div>
            <button type="submit" className="w-full bg-gray-800 text-white py-2 rounded-lg font-medium">Anlegen</button>
          </form>

          <div className="space-y-2">
            {data.map(u => (
              <div key={u.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                <div>
                  <div className="font-medium">{u.lastName}</div>
                  <div className="text-xs text-gray-500">Rolle: {u.role}</div>
                </div>
                <button 
                  onClick={() => handleReset(u.id)}
                  className="text-sm text-[#53a661] hover:underline"
                >
                  Reset Pwd
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {data.map(b => (
            <div key={b.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between">
                <span className="font-bold">{b.lastName}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${b.status === 'active' ? 'bg-green-100 text-green-700' : b.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                  {b.status}
                </span>
              </div>
              <div className="text-sm text-gray-600 mt-2">
                {format(parseISO(b.startTime), 'dd.MM.yyyy HH:mm')} - {format(parseISO(b.endTime), 'HH:mm')}
              </div>
              <div className="text-xs text-gray-500">
                Maschine {b.machineId} | {b.type === 'wash_and_dry' ? 'Waschen & Trocknen' : 'Nur Waschen'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
