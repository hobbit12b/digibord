
import React, { useEffect, useMemo, useState } from 'react';
import { Play, Pause, RotateCcw, Settings } from 'lucide-react';

export const CircularTimer: React.FC = () => {
  const [totalSeconds, setTotalSeconds] = useState(600); // 10 minutes default
  const [timeLeft, setTimeLeft] = useState(600);
  const [isRunning, setIsRunning] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Voorkom delen door 0 (bijv. als iemand per ongeluk 0:00 instelt)
  const safeTotalSeconds = useMemo(() => (totalSeconds > 0 ? totalSeconds : 1), [totalSeconds]);

  useEffect(() => {
    let interval: number;
    if (isRunning && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const reset = () => {
    setIsRunning(false);
    setTimeLeft(totalSeconds);
  };

  const ratio = timeLeft / safeTotalSeconds;

  const handleSettingsSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const mins = Number(formData.get('mins')) || 0;
    const secs = Number(formData.get('secs')) || 0;
    const newTotal = Math.max(0, mins * 60 + secs);
    setTotalSeconds(newTotal);
    setTimeLeft(newTotal);
    setShowSettings(false);
    setIsRunning(false);
  };

  return (
    <div className="bg-white/90 p-6 rounded-3xl shadow-xl flex flex-col items-center gap-4 border-4 border-gray-100 relative w-64">
      <div className="relative w-48 h-48">
        {/* SVG Circle Timer */}
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            className="text-gray-200"
            strokeWidth="10"
            stroke="currentColor"
            fill="white"
            r="45"
            cx="50"
            cy="50"
          />
          <path
            className="text-red-500 transition-all duration-1000"
            strokeWidth="0"
            fill="currentColor"
            d={`M 50 50 L 50 5 A 45 45 0 ${ratio > 0.5 ? 1 : 0} 1 ${50 + 45 * Math.sin(ratio * 2 * Math.PI)} ${50 - 45 * Math.cos(ratio * 2 * Math.PI)} Z`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl font-bold tabular-nums">
            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setIsRunning(!isRunning)} className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition shadow-md">
          {isRunning ? <Pause size={24} /> : <Play size={24} />}
        </button>
        <button onClick={reset} className="p-3 bg-gray-500 text-white rounded-full hover:bg-gray-600 transition shadow-md">
          <RotateCcw size={24} />
        </button>
        <button onClick={() => setShowSettings(!showSettings)} className="p-3 bg-indigo-500 text-white rounded-full hover:bg-indigo-600 transition shadow-md">
          <Settings size={24} />
        </button>
      </div>

      {showSettings && (
        <div className="absolute top-0 left-0 w-full h-full bg-white z-10 rounded-3xl p-4 flex flex-col justify-center border-4 border-indigo-200">
          <h3 className="text-lg font-bold mb-2">Stel tijd in</h3>
          <form onSubmit={handleSettingsSubmit} className="flex flex-col gap-3">
            <div className="flex gap-2 items-center">
              <input name="mins" type="number" defaultValue={Math.floor(totalSeconds / 60)} className="w-16 border p-1 rounded" />
              <span>min</span>
              <input name="secs" type="number" defaultValue={totalSeconds % 60} className="w-16 border p-1 rounded" />
              <span>sec</span>
            </div>
            <button type="submit" className="bg-green-500 text-white p-2 rounded hover:bg-green-600">Opslaan</button>
            <button type="button" onClick={() => setShowSettings(false)} className="text-sm text-gray-500">Annuleren</button>
          </form>
        </div>
      )}
    </div>
  );
};
