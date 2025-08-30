
export interface Section {
  id: number;
  name: string;
  minutes: number;
}

export type TimerState = 'idle' | 'running' | 'paused';

export interface HistoryDetail {
  name: string;
  plannedTime: number; // minutes
  actualTime: number; // minutes
}

export interface HistoryEntry {
  id: string;
  finishedAt: string; // ISO string for storing, can be converted back to Date
  details: HistoryDetail[];
}
