
export enum VoiceLevel {
  NONE = 0,
  SPY = 1,
  GROUP = 2,
  PRESENT = 3,
  PLAYGROUND = 4
}

export interface VoiceLevelConfig {
  id: VoiceLevel;
  name: string;
  color: string;
  emoji: string;
  /**
   * Maximum volume (0 to 100) for this level.
   * Lower value means quieter.
   */
  threshold: number;
}

export enum TrafficLightColor {
  RED = 'RED',
  ORANGE = 'ORANGE',
  GREEN = 'GREEN',
  OFF = 'OFF'
}
