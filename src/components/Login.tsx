import React, { useState } from 'react';
import { useAuth } from './AuthProvider';
import { APP_URL } from '../config';

export default function Login() {
  const { login } = useAuth();
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lastName, password })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login fehlgeschlagen');
      } else {
        login(data.token, data.user);
      }
    } catch (err) {
      setError('Netzwerkfehler');
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <span className="font-bold text-5xl text-black">ak</span>
            <div className="w-8 h-8 rounded-full bg-[#53a661] mt-2 mx-2"></div>
            <span className="font-bold text-5xl text-black">reso</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Waschraum Anmeldung</h1>
          <p className="text-gray-500 mt-2">Bitte melden Sie sich an, um Zeiten zu buchen.</p>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nachname</label>
            <input 
              type="text" 
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#53a661] focus:border-[#53a661] outline-none transition-all"
              placeholder="z.B. Müller"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Passwort</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#53a661] focus:border-[#53a661] outline-none transition-all"
              placeholder="••••••••"
              required
            />
          </div>
          <button 
            type="submit"
            className="w-full bg-[#53a661] hover:bg-[#438a4e] text-white font-medium py-3 rounded-xl transition-colors"
          >
            Anmelden
          </button>
        </form>

        <div className="mt-8 bg-gray-50 p-4 rounded-xl border border-gray-200 text-sm text-gray-600">
          <p className="font-semibold mb-2">Test-Zugangsdaten:</p>
          <ul className="space-y-1">
            <li><strong>Admin:</strong> Name: <code className="bg-white px-1 py-0.5 rounded border">admin</code> | Passwort: <code className="bg-white px-1 py-0.5 rounded border">admin</code></li>
            <li><strong>Bewohner 1:</strong> Name: <code className="bg-white px-1 py-0.5 rounded border">Müller</code> | Passwort: <code className="bg-white px-1 py-0.5 rounded border">test</code></li>
            <li><strong>Bewohner 2:</strong> Name: <code className="bg-white px-1 py-0.5 rounded border">Schmidt</code> | Passwort: <code className="bg-white px-1 py-0.5 rounded border">test</code></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
