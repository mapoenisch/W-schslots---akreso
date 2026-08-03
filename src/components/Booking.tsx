import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthProvider';
import { format, addDays, subDays, addHours, parseISO, isSameDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { cn } from '../lib/utils';

type Chunk = {
  time: string;
  startTime: string;
  endTime: string;
  machine1Free: boolean;
  machine2Free: boolean;
  m1Booking: string | null;
  m2Booking: string | null;
  canStartM1: boolean;
  canStartM2: boolean;
  canHaveDryer: boolean;
};

export default function Booking() {
  const { token } = useAuth();
  const [date, setDate] = useState(new Date());
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedStart, setSelectedStart] = useState<{time: string, machineId: number, chunkInfo: Chunk} | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [withDryer, setWithDryer] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [remainingBookings, setRemainingBookings] = useState<number | null>(null);

  const fetchChunks = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setSelectedStart(null);
    try {
      const dateStr = date.toISOString().split('T')[0];
      const res = await fetch(`/api/slots?date=${dateStr}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setChunks(data.chunks);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [date, token]);

  useEffect(() => {
    fetchChunks();
  }, [fetchChunks]);

  const fetchRemainingBookings = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/remaining-bookings', {
        headers: { Authorization: `Bearer ${token}` }
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


  const handleBook = async () => {
    if (!selectedStart) return;
    setBookingError('');
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          startTime: selectedStart.chunkInfo.startTime,
          machineId: selectedStart.machineId,
          withDryer
        })
      });
      const data = await res.json();
      if (res.ok) {
        setShowConfirm(false);
        setSelectedStart(null);
        setWithDryer(false);
        fetchChunks();
        fetchRemainingBookings();
        alert('Erfolgreich gebucht!');
      } else {
        setBookingError(data.error || 'Fehler bei der Buchung');
      }
    } catch (e) {
      setBookingError('Netzwerkfehler');
    }
  };

  const formattedDate = format(date, 'EEEE, d. MMMM', { locale: de });
  const isToday = isSameDay(date, new Date());

  // Determine if a chunk is part of the selected 2-hour window
  const isSelected = (time: string, machineId: number) => {
    if (!selectedStart || selectedStart.machineId !== machineId) return false;
    const startIdx = chunks.findIndex(c => c.time === selectedStart.time);
    const currIdx = chunks.findIndex(c => c.time === time);
    // 2 hours = 4 chunks
    return currIdx >= startIdx && currIdx < startIdx + 4;
  };

  return (
    <div className="p-4 max-w-lg mx-auto pb-32">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Freie Zeit finden</h1>

      {remainingBookings !== null && (
        <div className="mb-4 bg-emerald-50 border border-emerald-100 p-3 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="text-sm font-medium text-emerald-800">Verfügbare Waschgänge diese Woche</div>
          <div className="flex space-x-1">
            {[...Array(2)].map((_, i) => (
              <div 
                key={i} 
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i < remainingBookings ? 'bg-[#53a661] text-white' : 'bg-gray-200 text-gray-400'}`}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>
      )}

      
      {/* Date Selector */}
      <div className="flex items-center justify-between bg-white px-4 py-3 rounded-full shadow-sm border border-gray-100 mb-6 w-full max-w-sm mx-auto">
        <button onClick={() => setDate(subDays(date, 1))} className="p-1 text-gray-400 hover:text-gray-700">
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-center space-x-2 font-medium text-[#53a661]">
          <CalendarIcon size={18} />
          <span>{isToday ? 'Heute · ' : ''}{formattedDate}</span>
        </div>
        <button onClick={() => setDate(addDays(date, 1))} className="p-1 text-gray-400 hover:text-gray-700">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Grid Header */}
      <div className="grid grid-cols-[3rem_1fr_1fr] gap-3 mb-2 px-2 text-xs font-semibold text-gray-500 text-center uppercase tracking-wider">
        <div></div>
        <div>Maschine 1</div>
        <div>Maschine 2</div>
      </div>

      {/* Grid */}
      <div className="space-y-1 bg-white p-2 rounded-3xl shadow-sm border border-gray-100">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Lade Zeiten...</div>
        ) : chunks.filter(c => c.canStartM1 || c.canStartM2 || isSelected(c.time, 1) || isSelected(c.time, 2)).length === 0 ? (
          <div className="p-8 text-center text-gray-500">Keine freien Zeiten verfügbar</div>
        ) : (
          chunks.map((chunk, idx) => {
            const m1Selected = isSelected(chunk.time, 1);
            const m2Selected = isSelected(chunk.time, 2);
            
            if (!chunk.canStartM1 && !chunk.canStartM2 && !m1Selected && !m2Selected) {
              return null;
            }
            
            return (
              <div key={chunk.time} className="grid grid-cols-[3rem_1fr_1fr] gap-2 hover:bg-gray-50 rounded-lg p-1 transition-colors">
                {/* Time Label */}
                <div className="text-xs font-medium text-gray-400 text-right pr-2 py-3">
                  {chunk.time}
                </div>
                
                <ChunkCell 
                  free={chunk.machine1Free} 
                  canStart={chunk.canStartM1}
                  selected={m1Selected}
                  bookingLabel={chunk.m1Booking}
                  onClick={() => chunk.canStartM1 && setSelectedStart({time: chunk.time, machineId: 1, chunkInfo: chunk})}
                />
                <ChunkCell 
                  free={chunk.machine2Free} 
                  canStart={chunk.canStartM2}
                  selected={m2Selected}
                  bookingLabel={chunk.m2Booking}
                  onClick={() => chunk.canStartM2 && setSelectedStart({time: chunk.time, machineId: 2, chunkInfo: chunk})}
                />
              </div>
            );
          })
        )}
      </div>

      {/* Action Button */}
      {selectedStart && !showConfirm && (
        <div className="fixed bottom-20 left-0 right-0 flex flex-col items-center animate-in slide-in-from-bottom-4">
          <button 
            onClick={() => setShowConfirm(true)}
            className="bg-[#53a661] text-white w-32 h-32 rounded-full shadow-2xl flex flex-col items-center justify-center hover:bg-emerald-700 transition-transform hover:scale-105 border-4 border-white"
          >
            <span className="text-3xl font-bold">{selectedStart.time}</span>
            <span className="text-lg font-medium">buchen</span>
          </button>
          <p className="mt-4 text-sm text-gray-700 font-medium bg-white px-4 py-1.5 rounded-full shadow-sm border border-gray-100">
            {(
    selectedStart && 
    (chunks.findIndex(c => c.time === selectedStart.time) + 6 <= chunks.length) &&
    chunks.slice(chunks.findIndex(c => c.time === selectedStart.time), chunks.findIndex(c => c.time === selectedStart.time) + 6).every(c => selectedStart.machineId === 1 ? c.machine1Free : c.machine2Free)
  ) ? 'Trockner im nächsten Schritt' : 'Trockner bei dieser Zeit nicht möglich'}
          </p>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirm && selectedStart && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 animate-in slide-in-from-bottom-8">
            <h2 className="text-xl font-bold mb-4">Buchung bestätigen</h2>
            
            <div className="space-y-4 mb-6">
              <div className="bg-[#F9F8F6] p-4 rounded-2xl">
                <div className="text-sm text-gray-500 mb-1">Waschgang (2 Stunden)</div>
                <div className="font-medium text-gray-900">{formattedDate}</div>
                <div className="font-bold text-xl text-[#53a661] mt-1">
                  {selectedStart.time} – {format(addHours(parseISO(selectedStart.chunkInfo.startTime), 2), 'HH:mm')} Uhr
                </div>
                <div className="text-sm text-gray-500 mt-2 flex items-center">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></div>
                  Maschine {selectedStart.machineId}
                </div>
              </div>

              {(
    selectedStart && 
    (chunks.findIndex(c => c.time === selectedStart.time) + 6 <= chunks.length) &&
    chunks.slice(chunks.findIndex(c => c.time === selectedStart.time), chunks.findIndex(c => c.time === selectedStart.time) + 6).every(c => selectedStart.machineId === 1 ? c.machine1Free : c.machine2Free)
  ) ? (
                <label className="flex items-center p-4 border rounded-2xl cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className={cn("w-6 h-6 rounded-md border flex items-center justify-center mr-3 transition-colors", withDryer ? "bg-[#53a661] border-[#53a661]" : "border-gray-300 bg-white")}>
                    {withDryer && <Check size={16} className="text-white" />}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Trockner hinzufügen</div>
                    <div className="text-sm text-gray-500">+1 Stunde (bis {format(addHours(parseISO(selectedStart.chunkInfo.startTime), 3), 'HH:mm')} Uhr)</div>
                  </div>
                </label>
              ) : (
                <div className="p-4 bg-gray-50 rounded-2xl text-sm text-gray-500">
                  Zu dieser Uhrzeit kann der Trockner nicht mehr genutzt werden.
                </div>
              )}
            </div>

            {bookingError && <div className="text-red-600 text-sm font-medium mb-4">{bookingError}</div>}

            <div className="text-center text-sm text-gray-500 mb-4">
              Die Bezahlung erfolgt in bar vor Ort.
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Abbrechen
              </button>
              <button 
                onClick={handleBook}
                className="flex-1 py-3 font-semibold text-white bg-[#53a661] rounded-xl hover:bg-emerald-700 transition-colors"
              >
                Buchen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ChunkCell({ free, canStart, selected, bookingLabel, onClick }: { free: boolean, canStart: boolean, selected: boolean, bookingLabel: string | null, onClick: () => void }) {
  if (selected) {
    return (
      <div className="bg-[#53a661] text-white rounded-md p-1.5 text-center text-[10px] font-medium transition-colors shadow-sm flex items-center justify-center">Gewählt
      </div>
    );
  }

  if (!canStart) {
    return <div />;
  }

  return (
    <button 
      onClick={onClick}
      className="bg-emerald-50 text-[#53a661] hover:bg-emerald-100 rounded-md p-2 text-center text-sm font-medium transition-colors border border-emerald-100/50"
    >
      Starten
    </button>
  );
}
