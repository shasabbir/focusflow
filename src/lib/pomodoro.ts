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
