export type PriorityLevel = 1 | 2 | 3 | 4; // 4: High, 3: Medium, 2: Low, 1: None

export interface SubItem {
  id: string;
  content: string;
  completed: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type?: string;
  size?: string;
}

export interface Reminder {
  id: string;
  time: string;
  label?: string;
}

export interface Item {
  id: string;
  content: string;
  description: string;
  project_id: string;
  section_id?: string;
  parent_id?: string;
  priority: PriorityLevel;
  due_date?: string | null; // 'YYYY-MM-DD'
  due_time?: string | null; // 'HH:mm'
  is_recurring: boolean;
  recurrence_rule?: string; // 'daily' | 'weekdays' | 'weekly' | 'monthly' | 'yearly'
  labels: string[]; // Label IDs
  completed: boolean;
  completed_at?: string | null;
  added_at: string;
  updated_at?: string;
  is_pinned: boolean;
  order: number;
  subtasks: SubItem[];
  attachments: Attachment[];
  reminders: Reminder[];
}

export interface Section {
  id: string;
  project_id: string;
  name: string;
  order: number;
  collapsed?: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  emoji?: string;
  icon_symbolic?: string;
  icon_type?: 'symbolic' | 'emoji' | 'none';
  is_inbox: boolean;
  is_favorite: boolean;
  is_archived: boolean;
  view_mode: 'list' | 'board';
  order: number;
}

export interface Label {
  id: string;
  name: string;
  color: string;
  is_favorite: boolean;
  order: number;
}

export interface CalendarFeed {
  id: string;
  name: string;
  color: string;
  enabled: boolean;
  type: 'android_system' | 'local_ics' | 'webcal' | 'built_in';
  url?: string;
  eventsCount: number;
}

export interface CalendarEvent {
  id: string;
  calendarId: string;
  title: string;
  description?: string;
  location?: string;
  startDate: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endDate?: string;
  endTime?: string;
  isAllDay: boolean;
}

export type FilterId =
  | 'inbox'
  | 'today'
  | 'tomorrow'
  | 'scheduled'
  | 'labels'
  | 'pinboard'
  | 'completed'
  | 'anytime'
  | 'repeating'
  | 'unlabeled'
  | 'all';

export type ActiveView =
  | { type: 'filter'; id: FilterId }
  | { type: 'project'; id: string }
  | { type: 'label'; id: string };

export type AppearanceMode = 'light' | 'dark' | 'dark-blue';

export interface PlanifyColor {
  id: number;
  code: string;
  name: string;
  hex: string;
}

export const PLANIFY_COLORS: PlanifyColor[] = [
  { id: 30, code: 'berry_red', name: 'Berry Red', hex: '#c42d78' },
  { id: 31, code: 'red', name: 'Red', hex: '#e23d3d' },
  { id: 32, code: 'orange', name: 'Orange', hex: '#ff8a2a' },
  { id: 33, code: 'yellow', name: 'Yellow', hex: '#f5c400' },
  { id: 34, code: 'olive_green', name: 'Olive Green', hex: '#9cab3a' },
  { id: 35, code: 'lime_green', name: 'Lime Green', hex: '#70c741' },
  { id: 36, code: 'green', name: 'Green', hex: '#27983a' },
  { id: 37, code: 'mint_green', name: 'Mint Green', hex: '#55cbb0' },
  { id: 38, code: 'teal', name: 'Teal', hex: '#1492b2' },
  { id: 39, code: 'sky_blue', name: 'Sky Blue', hex: '#139ef7' },
  { id: 40, code: 'light_blue', name: 'Light Blue', hex: '#7fb9e8' },
  { id: 41, code: 'blue', name: 'Blue', hex: '#3c6dff' },
  { id: 42, code: 'grape', name: 'Grape', hex: '#7b44e6' },
  { id: 43, code: 'violet', name: 'Violet', hex: '#a02adb' },
  { id: 44, code: 'lavender', name: 'Lavender', hex: '#d89ae8' },
  { id: 45, code: 'magenta', name: 'Magenta', hex: '#d6458d' },
  { id: 46, code: 'salmon', name: 'Salmon', hex: '#f77c70' },
  { id: 47, code: 'charcoal', name: 'Charcoal', hex: '#666666' },
  { id: 48, code: 'grey', name: 'Grey', hex: '#a0a0a0' },
  { id: 49, code: 'taupe', name: 'Taupe', hex: '#b99780' },
];

export const SYMBOLIC_ICONS = [
  { id: 'folder', name: 'Folder' },
  { id: 'briefcase', name: 'Briefcase' },
  { id: 'home', name: 'Home' },
  { id: 'code', name: 'Code' },
  { id: 'sparkles', name: 'Sparkles' },
  { id: 'book', name: 'Book' },
  { id: 'target', name: 'Target' },
  { id: 'hash', name: 'Hash' },
  { id: 'star', name: 'Star' },
  { id: 'heart', name: 'Heart' },
  { id: 'wrench', name: 'Wrench' },
  { id: 'globe', name: 'Globe' },
  { id: 'compass', name: 'Compass' },
  { id: 'bookmark', name: 'Bookmark' },
] as const;

export const PRIORITY_CONFIG = {
  4: { label: 'Priority 1', color: '#ff7066', text: 'High', flagColor: 'text-red-500 fill-red-500/20' },
  3: { label: 'Priority 2', color: '#ff9914', text: 'Medium', flagColor: 'text-amber-500 fill-amber-500/20' },
  2: { label: 'Priority 3', color: '#5297ff', text: 'Low', flagColor: 'text-blue-500 fill-blue-500/20' },
  1: { label: 'Priority 4', color: '#94a3b8', text: 'None', flagColor: 'text-slate-400' },
} as const;
