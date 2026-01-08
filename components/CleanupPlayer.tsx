
import React, { useState, useRef } from 'react';
import { Play, Pause, Music } from 'lucide-react';
import { CLEANUP_SONG_URL } from '../constants';

export const CleanupPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="bg-indigo-800 p-4 rounded-3xl shadow-xl flex items-center gap-4 text-white hover:bg-indigo-900 transition-colors cursor-pointer group" onClick={togglePlay}>
      <audio ref={audioRef} src={CLEANUP_SONG_URL} onEnded={() => setIsPlaying(false)} />
      <div className={`p-4 rounded-full transition-all duration-300 ${isPlaying ? 'bg-green-500 scale-110 shadow-[0_0_20px_rgba(34,197,94,0.6)]' : 'bg-indigo-600'}`}>
        {isPlaying ? <Pause size={32} fill="white" /> : <Play size={32} fill="white" />}
      </div>
      <div className="flex flex-col">
        <span className="text-xl font-bold">Opruimlied</span>
        <span className="text-sm opacity-80 flex items-center gap-1"><Music size={14} /> Klaar met werken?</span>
      </div>
    </div>
  );
};
