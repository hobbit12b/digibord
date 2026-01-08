
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Settings, X } from 'lucide-react';
import { VOICE_LEVELS } from '../constants';
import { VoiceLevel, VoiceLevelConfig } from '../types';

const STORAGE_THRESHOLDS = 'digibord.voiceThresholds.v1';
const STORAGE_DESIRED_LEVEL = 'digibord.desiredVoiceLevel.v1';

function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

function loadThresholds(defaultLevels: VoiceLevelConfig[]) {
  try {
    const raw = localStorage.getItem(STORAGE_THRESHOLDS);
    if (!raw) return defaultLevels;
    const parsed = JSON.parse(raw) as Record<string, number>;

    const rebuilt = defaultLevels.map((l) => ({
      ...l,
      threshold: typeof parsed[String(l.id)] === 'number' ? Number(parsed[String(l.id)]) : l.threshold
    }));

    // Zorg voor oplopende waarden en een nette bovengrens
    const cleaned: VoiceLevelConfig[] = rebuilt.map((l) => ({ ...l }));
    for (let i = 0; i < cleaned.length; i++) {
      const prev = i === 0 ? 0 : cleaned[i - 1].threshold;
      const next = i === cleaned.length - 1 ? 100 : cleaned[i + 1].threshold;
      const min = i === 0 ? 0 : prev + 1;
      const max = i === cleaned.length - 1 ? 100 : next - 1;
      cleaned[i].threshold = clamp(cleaned[i].threshold, min, max);
    }
    cleaned[cleaned.length - 1].threshold = 100;
    return cleaned;
  } catch {
    return defaultLevels;
  }
}

function saveThresholds(levels: VoiceLevelConfig[]) {
  const payload: Record<string, number> = {};
  for (const l of levels) payload[String(l.id)] = l.threshold;
  localStorage.setItem(STORAGE_THRESHOLDS, JSON.stringify(payload));
}

function loadDesiredLevel() {
  try {
    const raw = localStorage.getItem(STORAGE_DESIRED_LEVEL);
    if (!raw) return VoiceLevel.SPY;
    const n = Number(raw);
    if (Number.isFinite(n)) return n as VoiceLevel;
    return VoiceLevel.SPY;
  } catch {
    return VoiceLevel.SPY;
  }
}

export const SoundMeter: React.FC = () => {
  const defaultLevels = useMemo(() => VOICE_LEVELS, []);

  const [levels, setLevels] = useState<VoiceLevelConfig[]>(() => {
    // localStorage bestaat pas in de browser
    if (typeof window === 'undefined') return defaultLevels;
    return loadThresholds(defaultLevels);
  });

  const [desiredLevel, setDesiredLevel] = useState<VoiceLevel>(() => {
    if (typeof window === 'undefined') return VoiceLevel.SPY;
    return loadDesiredLevel();
  });

  const [showSettings, setShowSettings] = useState(false);
  const [currentVolume, setCurrentVolume] = useState(0);
  const [activeLevel, setActiveLevel] = useState<VoiceLevel>(VoiceLevel.NONE);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const requestRef = useRef<number>();
  const streamRef = useRef<MediaStream | null>(null);

  // Houd de nieuwste levels bij zonder de microfoon opnieuw te starten
  const levelsRef = useRef<VoiceLevelConfig[]>(levels);
  useEffect(() => {
    levelsRef.current = levels;
  }, [levels]);

  // Refs om de pijl netjes op de juiste kaart te zetten
  const itemRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const [arrowTop, setArrowTop] = useState<number | null>(null);

  const desiredMax = useMemo(() => {
    return levels.find((l) => l.id === desiredLevel)?.threshold ?? 25;
  }, [levels, desiredLevel]);

  const isTooLoud = currentVolume > desiredMax;

  const computeActiveLevel = (volume: number) => {
    const currentLevels = levelsRef.current;
    const found = currentLevels.find((l) => volume <= l.threshold) ?? currentLevels[currentLevels.length - 1];
    return found.id;
  };

  useEffect(() => {
    const startMic = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyserRef.current);
        analyserRef.current.fftSize = 256;

        const update = () => {
          if (!analyserRef.current) return;
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);

          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
          const average = sum / dataArray.length;

          // Normaliseer naar 0 tot 100.
          // Dit is een praktische schaal voor klasgebruik, niet een echte dB meting.
          const normalized = clamp((average / 100) * 100, 0, 100);

          setCurrentVolume(normalized);
          setActiveLevel(computeActiveLevel(normalized));

          requestRef.current = requestAnimationFrame(update);
        };

        update();
      } catch (err) {
        console.error('Microfoon niet beschikbaar:', err);
      }
    };

    startMic();
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
      if (streamRef.current) {
        for (const track of streamRef.current.getTracks()) track.stop();
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_DESIRED_LEVEL, String(desiredLevel));
  }, [desiredLevel]);

  const setThreshold = (levelId: VoiceLevel, value: number) => {
    setLevels((prev) => {
      const next = prev.map((l) => ({ ...l }));
      const idx = next.findIndex((l) => l.id === levelId);
      if (idx < 0) return prev;

      const prevMax = idx === 0 ? 0 : next[idx - 1].threshold;
      const nextMax = idx === next.length - 1 ? 100 : next[idx + 1].threshold;

      const min = idx === 0 ? 0 : prevMax + 1;
      const max = idx === next.length - 1 ? 100 : nextMax - 1;

      next[idx].threshold = clamp(Math.round(value), min, max);
      next[next.length - 1].threshold = 100;

      if (typeof window !== 'undefined') saveThresholds(next);
      return next;
    });
  };

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;
    const updateArrow = () => {
      const el = itemRefs.current[desiredLevel];
      if (!el) {
        setArrowTop(null);
        return;
      }
      const top = el.offsetTop + el.offsetHeight / 2;
      setArrowTop(top);
    };

    updateArrow();
    window.addEventListener('resize', updateArrow);
    return () => window.removeEventListener('resize', updateArrow);
  }, [desiredLevel, levels]);

  return (
    <div className="flex items-center gap-6">
      {/* Stemniveaus */}
      <div className="relative">
        <div className="flex flex-col gap-3 w-[320px]">
          {levels.map((level) => (
            <div
              key={level.id}
              ref={(node) => {
                itemRefs.current[level.id] = node;
              }}
              role="button"
              tabIndex={0}
              onClick={() => setDesiredLevel(level.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setDesiredLevel(level.id);
              }}
              className={`
                ${level.color} text-white rounded-2xl px-5 py-4
                flex items-center justify-between
                transition-all duration-200
                shadow-lg
                ${activeLevel === level.id ? 'ring-8 ring-white/50 scale-[1.02]' : 'opacity-95'}
                ${desiredLevel === level.id ? 'outline outline-4 outline-blue-300/80' : 'outline-none'}
              `}
            >
              <div className="flex flex-col">
                <span className="text-2xl font-extrabold tracking-wide uppercase leading-none">
                  {level.name}
                </span>
                <span className="text-sm opacity-90 mt-1">grens: {level.threshold}</span>
              </div>
              <span className="text-4xl">{level.emoji}</span>
            </div>
          ))}
        </div>

        {/* Pijl naar gewenst stemniveau */}
        {arrowTop !== null && (
          <div
            className="absolute -right-20"
            style={{ top: arrowTop, transform: 'translateY(-50%)' }}
            aria-hidden="true"
          >
            <div className="w-16 h-10 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <svg viewBox="0 0 160 100" className="w-full h-full drop-shadow-md">
                  <path
                    d="M 160 50 L 92 10 L 92 35 L 0 35 L 0 65 L 92 65 L 92 90 Z"
                    fill="#1d4ed8"
                    opacity="0.95"
                  />
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* Instellingen knop */}
        <button
          onClick={() => setShowSettings(true)}
          className="absolute -top-2 -right-2 bg-white/95 text-gray-700 rounded-full p-3 shadow-lg border-4 border-gray-200 hover:scale-105 transition"
          title="Instellingen"
        >
          <Settings size={24} />
        </button>
      </div>

      {/* Meter, top is stil, onder is veel geluid */}
      <div className="bg-white/90 p-5 rounded-3xl shadow-xl border-4 border-gray-100 w-28 flex flex-col items-center gap-3">
        <div className="text-xs font-extrabold tracking-widest text-gray-600 uppercase">geluid</div>

        <div className="relative w-full h-[420px] bg-gray-200 rounded-full overflow-hidden border-4 border-white shadow-inner">
          {/* Vulling vanaf onder, zodat harder omhoog gaat */}
          <div
            className={`absolute bottom-0 left-0 right-0 ${isTooLoud ? 'bg-red-500' : 'bg-green-500'} transition-all duration-200`}
            style={{ height: `${currentVolume}%` }}
          />

          {/* Huidige marker */}
          <div
            className="absolute left-1/2 -translate-x-1/2 w-full pointer-events-none"
            style={{ bottom: `${currentVolume}%` }}
          >
            <div className="w-full h-1 bg-black/30" />
          </div>

          {/* Gewenste grens marker */}
          <div
            className="absolute left-1/2 -translate-x-1/2 w-full pointer-events-none"
            style={{ bottom: `${desiredMax}%` }}
          >
            <div className="w-full h-[3px] bg-blue-900/60" />
          </div>
        </div>

        <div className="text-sm font-bold tabular-nums text-gray-700">{Math.round(currentVolume)}</div>
      </div>

      {showSettings && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border-4 border-blue-100 overflow-hidden">
            <div className="p-6 flex items-center justify-between bg-blue-50">
              <div>
                <div className="text-2xl font-extrabold text-gray-900">Stemniveaus instellen</div>
                <div className="text-gray-600 mt-1">Schuif naar rechts voor meer geluid, waarden lopen van 0 tot 100.</div>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="p-3 rounded-full bg-white border-2 border-gray-200 hover:scale-105 transition"
                title="Sluiten"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-5">
              {levels.map((l, idx) => {
                const min = idx === 0 ? 0 : levels[idx - 1].threshold + 1;
                const max = idx === levels.length - 1 ? 100 : levels[idx + 1].threshold - 1;

                return (
                  <div key={l.id} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full ${l.color}`} />
                        <div className="font-extrabold text-gray-800 uppercase">{l.name}</div>
                      </div>
                      <div className="font-bold text-gray-700 tabular-nums">{l.threshold}</div>
                    </div>

                    <input
                      type="range"
                      min={min}
                      max={max}
                      value={l.threshold}
                      onChange={(e) => setThreshold(l.id, Number(e.currentTarget.value))}
                      className="w-full"
                      disabled={l.id === VoiceLevel.PLAYGROUND}
                    />

                    <div className="text-xs text-gray-500">
                      bereik: {min} tot {max}
                      {l.id === VoiceLevel.PLAYGROUND ? ', dit is altijd 100' : ''}
                    </div>
                  </div>
                );
              })}

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setLevels(VOICE_LEVELS);
                    if (typeof window !== 'undefined') {
                      saveThresholds(VOICE_LEVELS);
                    }
                  }}
                  className="px-5 py-3 rounded-2xl border-2 border-gray-200 font-extrabold text-gray-700 hover:bg-gray-50"
                >
                  Terug naar standaard
                </button>
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-5 py-3 rounded-2xl bg-blue-600 text-white font-extrabold hover:bg-blue-700"
                >
                  Klaar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
