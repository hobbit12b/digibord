
import { VoiceLevel, VoiceLevelConfig } from './types';

// threshold betekent hier: de maximale volume waarde (0 tot 100) die nog bij dat stemniveau past.
// De lijst staat van stil naar luid.
export const VOICE_LEVELS: VoiceLevelConfig[] = [
  { id: VoiceLevel.NONE, name: 'geen stem', color: 'bg-red-600', emoji: '🤐', threshold: 10 },
  { id: VoiceLevel.SPY, name: 'spionnenstem', color: 'bg-orange-500', emoji: '🤫', threshold: 25 },
  { id: VoiceLevel.GROUP, name: 'groepjesstem', color: 'bg-blue-500', emoji: '👥', threshold: 50 },
  { id: VoiceLevel.PRESENT, name: 'presenteerstem', color: 'bg-indigo-900', emoji: '🗣️', threshold: 75 },
  { id: VoiceLevel.PLAYGROUND, name: 'speelplaatsstem', color: 'bg-purple-700', emoji: '📢', threshold: 100 }
];

export const DEFAULT_WORK_TIME_MINS = 30;
export const CLEANUP_TIME_MINS = 5;

// Voorbeeldmuziek, je kunt dit later vervangen door een lokaal bestand.
export const CLEANUP_SONG_URL = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
