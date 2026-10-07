export type ThemePref = 'system' | 'light' | 'dark';

export type MetricKey =
  | 'weight'
  | 'sleep'
  | 'water'
  | 'hunger'
  | 'fasting'
  | 'bmi'
  | 'steps'
  | 'hr'
  | 'glucose'
  | 'ketone'
  | 'bp';

export type VitalType = 'steps' | 'hr' | 'glucose' | 'ketone' | 'bp';

export interface UserProfile {
  heightCm: number | null;
  dateOfBirth: string | null;
  fastingGoalH: number;
  waterGoalMl: number;
  theme: ThemePref;
  visibleMetrics: MetricKey[];
  hourlyPrompt: boolean;
  quietStart: number;
  quietEnd: number;
  lastPromptHour: string;
  lastExportAt: number | null;
  exportSnoozeUntil: number | null;
}

export interface WeightEntry {
  id: string;
  weight: number;
  timestamp: number;
}

export interface HungerEntry {
  id: string;
  intensity: number; // 1–10
  timestamp: number;
  fasting: boolean;
  fastHours: number | null;
  note?: string;
  mood?: string;
  reason?: string;
}

export interface FastingSession {
  id: string;
  startTime: number;
  endTime: number;
  targetHours: number;
  completed: boolean;
}

export interface ActiveFast {
  startTime: number;
  targetHours: number;
  /** what was last handed to the phone calendar, to detect when it needs re-adding */
  calendar?: { uid: string; seq: number; end: number };
}

export interface SleepEntry {
  id: string;
  sleepStart: number;
  wakeTime: number;
  duration: number; // minutes
}

export interface WaterEntry {
  id: string;
  amount: number; // ml
  timestamp: number;
}

export interface VitalEntry {
  id: string;
  type: VitalType;
  value: number;
  value2?: number;
  timestamp: number;
}

export interface Data {
  version: 2;
  profile: UserProfile;
  weights: WeightEntry[];
  hunger: HungerEntry[];
  fasts: FastingSession[];
  activeFast: ActiveFast | null;
  sleep: SleepEntry[];
  water: WaterEntry[];
  vitals: VitalEntry[];
}

export interface DailyMetrics {
  date: string;
  averageHunger: number | null;
  fastingDuration: number; // minutes completed that day
  sleepDuration: number | null; // minutes
  waterAmount: number;
  weight: number | null;
}
