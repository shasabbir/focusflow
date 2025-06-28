export const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxRLznvfGO_bMX1sMymAbS96Mye-Qd2j7QiBf7CcOGK-tE1M7L7qN4iYXpDks02l-NqlA/exec';

export type PomodoroMode = 'focus' | 'shortBreak' | 'longBreak';

export type TimerSettings = {
  focus: number;
  shortBreak: number;
  longBreak: number;
};

export type ContributionData = {
  [date: string]: number; // date in 'yyyy-MM-dd' format, value is total focus minutes
};

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
