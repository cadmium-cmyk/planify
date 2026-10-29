import { Item, Project, Section, Label, AppearanceMode, CalendarFeed, CalendarEvent } from '../types/planify';
import { CaldavConfig, DEFAULT_CALDAV_CONFIG } from './caldav';
import { INITIAL_CALENDAR_FEEDS, INITIAL_CALENDAR_EVENTS } from './calendar';

export const STORAGE_KEY = 'planify_app_state_v3';

export interface PlanifyState {
  items: Item[];
  projects: Project[];
  sections: Section[];
  labels: Label[];
  calendarFeeds: CalendarFeed[];
  calendarEvents: CalendarEvent[];
  appearance: AppearanceMode;
  dailyGoal: number;
  soundEnabled: boolean;
  caldav: CaldavConfig;
}

export function generateId(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
}

export function getFormattedDate(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

export function playCompleteSound(enabled = true) {
  if (!enabled || typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(587.33, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  } catch (e) {
    console.warn('Audio feedback error', e);
  }
}

const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj_inbox',
    name: 'Inbox',
    description: '',
    color: '#3584e4',
    icon_type: 'symbolic',
    icon_symbolic: 'folder',
    is_inbox: true,
    is_favorite: true,
    is_archived: false,
    view_mode: 'list',
    order: 0,
  },
];

const INITIAL_SECTIONS: Section[] = [];
const INITIAL_LABELS: Label[] = [];
const INITIAL_ITEMS: Item[] = [];

export function getInitialState(): PlanifyState {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed.items) && Array.isArray(parsed.projects)) {
          return {
            items: parsed.items,
            projects: parsed.projects.length > 0 ? parsed.projects : INITIAL_PROJECTS,
            sections: parsed.sections || INITIAL_SECTIONS,
            labels: parsed.labels || INITIAL_LABELS,
            calendarFeeds: parsed.calendarFeeds || INITIAL_CALENDAR_FEEDS,
            calendarEvents: parsed.calendarEvents || INITIAL_CALENDAR_EVENTS,
            appearance: parsed.appearance || 'light',
            dailyGoal: parsed.dailyGoal || 5,
            soundEnabled: parsed.soundEnabled ?? true,
            caldav: parsed.caldav || DEFAULT_CALDAV_CONFIG,
          };
        }
      }
    } catch (e) {
      console.error('Error loading initial state:', e);
    }
  }

  return {
    items: INITIAL_ITEMS,
    projects: INITIAL_PROJECTS,
    sections: INITIAL_SECTIONS,
    labels: INITIAL_LABELS,
    calendarFeeds: INITIAL_CALENDAR_FEEDS,
    calendarEvents: INITIAL_CALENDAR_EVENTS,
    appearance: 'light',
    dailyGoal: 5,
    soundEnabled: true,
    caldav: DEFAULT_CALDAV_CONFIG,
  };
}

export function saveState(state: PlanifyState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save state:', e);
  }
}
