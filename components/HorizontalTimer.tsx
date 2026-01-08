import React, { useEffect, useMemo, useState } from 'react';
import { Play, Pause, RotateCcw, Settings, Package2, X } from 'lucide-react';
import { DEFAULT_WORK_TIME_MINS, CLEANUP_TIME_MINS } from '../constants';

const STORAGE_WORK_MINS = 'digibord.workMins.v1';
const STORAGE_LETTERS_TEXT = 'digibord.lettersText.v1';
const STORAGE_SLOTS_COUNT = 'digibord.letterSlotsCount.v1';

function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

function parseLetters(input: string): string[] {
  const raw = (input ?? '').trim();
  if (!raw) return [];

  // Als er scheidingstekens zijn, splits dan, anders pak ieder karakter.
  const hasSeparators = /[\s,;|/]/.test(raw);
  const parts = hasSeparators
    ? raw
        .split(/[\s,;|/]+/)
        .map((p) => p.trim())
        .filter(Boolean)
    : raw.split('');

  // Houd het bij losse letters, maar laat ook korte combinaties toe als de gebruiker dat wil.
  return parts.map((p) => p.toLowerCase()).filter(Boolean);
}

function loadNumber(key: string, fallback: number) {
  try {
    const raw = localStorage.getItem(key);
    const n = raw == null ? NaN : Number(raw);
    return Number.isFinite(n) ? n : fallback;
  } catch {
    return fallback;
  }
}

function loadString(key: string, fallback: string) {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? fallback : String(raw);
  } catch {
    return fallback;
  }
}

export const HorizontalTimer: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Timer instellingen
  const [workMins, setWorkMins] = useState<number>(() => {
    if (typeof window === 'undefined') return DEFAULT_WORK_TIME_MINS;
    return clamp(loadNumber(STORAGE_WORK_MINS, DEFAULT_WORK_TIME_MINS), 1, 180);
  });

  const [totalSeconds, setTotalSeconds] = useState(() => workMins * 60);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Lettervakjes instellingen
  const [lettersText, setLettersText] = useState<string>(() => {
    if (typeof window === 'undefined') return 'm, b, g, h, k, s';
    return loadString(STORAGE_LETTERS_TEXT, 'm, b, g, h, k, s');
  });

  const letters = useMemo(() => {
    const parsed = parseLetters(lettersText);
    return parsed.length ? parsed : ['m', 'b', 'g', 'h', 'k', 's'];
  }, [lettersText]);

  const [slotsCount, setSlotsCount] = useState<number>(() => {
    if (typeof window === 'undefined') return 6;
    return clamp(loadNumber(STORAGE_SLOTS_COUNT, 6), 1, 12);
  });

  const [slots, setSlots] = useState<string[]>(() => Array(slotsCount).fill(''));

  // Houd totalSeconds in sync met workMins
  useEffect(() => {
    setTotalSeconds(workMins * 60);
    // reset niet automatisch, dat doen we bewust in de UI
  }, [workMins]);

  // Reset lettervakjes als letters of aantal vakjes wijzigt
  useEffect(() => {
    setSlots(Array(slotsCount).fill(''));
  }, [letters, slotsCount]);

  // Timer loop
  useEffect(() => {
    let interval: number;
    if (isRunning && elapsedSeconds < totalSeconds) {
      interval = window.setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else if (elapsedSeconds >= totalSeconds) {
      setIsRunning(false);
    }
    return () => clearInterval(interval);
  }, [isRunning, elapsedSeconds, totalSeconds]);

  const progressPercent = (elapsedSeconds / totalSeconds) * 100;
  const cleanupPercent = ((CLEANUP_TIME_MINS * 60) / totalSeconds) * 100;

  const resetTimer = () => {
    setElapsedSeconds(0);
    setIsRunning(false);
  };

  const clearAllLetters = () => {
    setSlots(Array(slotsCount).fill(''));
  };

  const handleSlotClick = (index: number) => {
    const current = slots[index];

    // Klik op een gevuld vakje maakt het weer leeg
    if (current) {
      setSlots((prev) => {
        const next = [...prev];
        next[index] = '';
        return next;
      });
      return;
    }

    // Klik op leeg vakje, kies een willekeurige letter, letters mogen altijd herhalen
    const picked = letters[Math.floor(Math.random() * letters.length)] ?? '';
    setSlots((prev) => {
      const next = [...prev];
      next[index] = picked;
      return next;
    });
  };

  const handleSettings = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);

    const mins = clamp(Number(data.get('mins')), 1, 180);
    const newLettersText = String(data.get('letters') ?? '').trim();
    const newSlotsCount = clamp(Number(data.get('slotsCount')), 1, 12);

    if (Number.isFinite(mins) && mins > 0) {
      setWorkMins(mins);
      setElapsedSeconds(0);
      setIsRunning(false);
      try {
        localStorage.setItem(STORAGE_WORK_MINS, String(mins));
      } catch {
        // ignore
      }
    }

    if (newLettersText) {
      setLettersText(newLettersText);
      try {
        localStorage.setItem(STORAGE_LETTERS_TEXT, newLettersText);
      } catch {
        // ignore
      }
    }

    if (Number.isFinite(newSlotsCount)) {
      setSlotsCount(newSlotsCount);
      try {
        localStorage.setItem(STORAGE_SLOTS_COUNT, String(newSlotsCount));
      } catch {
        // ignore
      }
    }

    setShowSettings(false);
  };

  const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);
  const remainingLabel = `${Math.floor(remainingSeconds / 60)}:${String(remainingSeconds % 60).padStart(2, '0')}`;

  return (
    <div className="bg-white/95 p-6 rounded-3xl shadow-xl flex flex-col gap-4 border-4 border-indigo-100 w-full max-w-4xl">
      <div className="relative h-24 bg-gray-100 rounded-xl overflow-hidden border-2 border-indigo-200">
        <div className="absolute inset-0 bg-fuchsia-900/90" />

        <div
          className="absolute right-0 h-full bg-green-500 border-l-2 border-white flex items-center justify-center"
          style={{ width: `${cleanupPercent}%` }}
          aria-label="Opruimtijd"
        >
          <Package2 className="text-white" size={40} />
        </div>

        <div
          className="absolute top-0 bottom-0 w-2 bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)] transition-all duration-1000"
          style={{ left: `${progressPercent}%` }}
          aria-hidden="true"
        />

        <div className="absolute bottom-2 right-4 text-white font-mono font-bold text-xl drop-shadow-md">{remainingLabel}</div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="p-4 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-md"
            aria-label={isRunning ? 'Pauze' : 'Start'}
          >
            {isRunning ? <Pause size={28} /> : <Play size={28} />}
          </button>
          <button
            onClick={resetTimer}
            className="p-4 bg-gray-500 text-white rounded-full hover:bg-gray-600 shadow-md"
            aria-label="Reset"
          >
            <RotateCcw size={28} />
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center gap-2">
          {slots.map((value, i) => (
            <button
              key={i}
              onClick={() => handleSlotClick(i)}
              className={
                `w-16 h-16 rounded-xl border-2 shadow-sm flex items-center justify-center ` +
                `${value ? 'bg-amber-50 border-amber-200' : 'bg-amber-50/70 border-amber-200/70'} ` +
                `hover:scale-[1.02] active:scale-[0.98] transition`}
              aria-label={value ? `Letter ${value}, klik om te wissen` : 'Leeg vakje, klik voor een letter'}
              title={value ? 'Klik om leeg te maken' : 'Klik voor een willekeurige letter'}
            >
              <span className={value ? 'text-4xl font-black text-gray-700' : 'text-4xl font-black text-transparent'}>
                {value || 'a'}
              </span>
            </button>
          ))}

          <button
            onClick={clearAllLetters}
            className="ml-2 p-3 bg-white border-2 border-gray-200 text-gray-700 rounded-full hover:bg-gray-50 shadow-sm"
            aria-label="Alle lettervakjes leegmaken"
            title="Alles leegmaken"
          >
            <X size={22} />
          </button>
        </div>

        <div className="ml-auto">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-4 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 shadow-md"
            aria-label="Instellingen"
          >
            <Settings size={28} />
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-xl">
            <h2 className="text-2xl font-black mb-6">Instellingen</h2>

            <form onSubmit={handleSettings} className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="font-extrabold text-gray-800">Werktijd</label>
                <div className="flex items-center gap-2">
                  <input
                    name="mins"
                    type="number"
                    defaultValue={workMins}
                    min={1}
                    max={180}
                    className="border-2 border-indigo-200 p-3 rounded-xl w-32 text-center text-2xl font-black"
                  />
                  <span className="text-xl font-bold text-gray-700">minuten</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-extrabold text-gray-800">Letters voor de vakjes</label>
                <input
                  name="letters"
                  type="text"
                  defaultValue={lettersText}
                  className="border-2 border-gray-200 p-3 rounded-xl text-lg font-semibold"
                  placeholder="bijvoorbeeld: m, b, g, h, k, s"
                />
                <div className="text-sm text-gray-600">
                  Je mag letters scheiden met komma of spatie, je mag ook gewoon een rijtje typen.
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex flex-col gap-2">
                  <label className="font-extrabold text-gray-800">Aantal vakjes</label>
                  <input
                    name="slotsCount"
                    type="number"
                    defaultValue={slotsCount}
                    min={1}
                    max={12}
                    className="border-2 border-gray-200 p-3 rounded-xl w-32 text-center text-xl font-black"
                  />
                </div>
                <div className="flex-1 text-sm text-gray-600">
                  Tip, als je minder letters invult dan vakjes, dan zullen letters vaker terugkomen.
                </div>
              </div>

              <div className="flex items-center gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="px-5 py-3 rounded-2xl border-2 border-gray-200 font-extrabold text-gray-700 hover:bg-gray-50"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  className="px-5 py-3 rounded-2xl bg-green-500 text-white font-extrabold hover:bg-green-600"
                >
                  Opslaan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
