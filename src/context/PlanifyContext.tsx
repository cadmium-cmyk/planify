import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import {
  Item,
  Project,
  Section,
  Label,
  ActiveView,
  AppearanceMode,
  PriorityLevel,
  SubItem,
  Attachment,
  Reminder,
  CalendarFeed,
  CalendarEvent,
} from '../types/planify';
import {
  getInitialState,
  saveState,
  generateId,
  playCompleteSound,
  getFormattedDate,
  STORAGE_KEY,
} from '../services/store';
import {
  CaldavConfig,
  syncCaldav,
  testCaldavConnection,
} from '../services/caldav';
import { parseIcsContent } from '../services/calendar';

interface PlanifyContextType {
  // State
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
  isSyncingCaldav: boolean;
  activeView: ActiveView;
  searchQuery: string;
  selectedTaskId: string | null;
  isQuickAddOpen: boolean;
  isProductivityOpen: boolean;
  isSettingsOpen: boolean;
  isNewProjectOpen: boolean;
  editingProject: Project | null;
  sidebarOpen: boolean;

  // View navigation
  setActiveView: (view: ActiveView) => void;
  setSearchQuery: (query: string) => void;
  setSelectedTaskId: (id: string | null) => void;
  setIsQuickAddOpen: (open: boolean) => void;
  setIsProductivityOpen: (open: boolean) => void;
  setIsSettingsOpen: (open: boolean) => void;
  setIsNewProjectOpen: (open: boolean) => void;
  setEditingProject: (project: Project | null) => void;
  setSidebarOpen: (open: boolean) => void;
  setAppearance: (mode: AppearanceMode) => void;
  setDailyGoal: (goal: number) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setCaldavConfig: (config: Partial<CaldavConfig>) => void;
  syncCaldavNow: () => Promise<{ success: boolean; message: string }>;

  // Calendar actions
  toggleCalendarFeed: (id: string) => void;
  addCalendarFeed: (feed: Omit<CalendarFeed, 'id' | 'eventsCount'>) => CalendarFeed;
  importIcsEvents: (calendarId: string, icsContent: string) => number;
  addCalendarEvent: (event: Omit<CalendarEvent, 'id'>) => CalendarEvent;
  deleteCalendarEvent: (id: string) => void;

  // Task actions
  addTask: (task: Partial<Item> & { content: string; project_id: string }) => Item;
  updateTask: (id: string, updates: Partial<Item>) => void;
  deleteTask: (id: string) => void;
  toggleTaskCompletion: (id: string) => void;
  toggleTaskPin: (id: string) => void;
  moveTaskToSection: (taskId: string, sectionId?: string) => void;
  moveTaskToProject: (taskId: string, projectId: string) => void;
  addSubtask: (taskId: string, content: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  deleteSubtask: (taskId: string, subtaskId: string) => void;
  addAttachment: (taskId: string, attachment: Omit<Attachment, 'id'>) => void;
  deleteAttachment: (taskId: string, attachmentId: string) => void;
  addReminder: (taskId: string, reminder: Omit<Reminder, 'id'>) => void;
  deleteReminder: (taskId: string, reminderId: string) => void;

  // Project actions
  addProject: (project: Omit<Project, 'id' | 'order' | 'is_inbox' | 'is_archived'>) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  toggleProjectFavorite: (id: string) => void;
  setProjectViewMode: (id: string, mode: 'list' | 'board') => void;

  // Section actions
  addSection: (projectId: string, name: string) => Section;
  updateSection: (id: string, updates: Partial<Section>) => void;
  deleteSection: (id: string) => void;
  toggleSectionCollapse: (id: string) => void;

  // Label actions
  addLabel: (name: string, color: string) => Label;
  updateLabel: (id: string, updates: Partial<Label>) => void;
  deleteLabel: (id: string) => void;

  // Utilities
  getProjectById: (id: string) => Project | undefined;
  getSectionById: (id: string) => Section | undefined;
  getLabelById: (id: string) => Label | undefined;
  getTaskCountForFilter: (filterId: string) => number;
  getTaskCountForProject: (projectId: string) => number;
  getTaskCountForLabel: (labelId: string) => number;
  exportBackupJSON: () => string;
  importBackupJSON: (jsonString: string) => boolean;
  resetToDefaults: () => void;
}

const PlanifyContext = createContext<PlanifyContextType | undefined>(undefined);

export const PlanifyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState(getInitialState);
  const [activeView, setActiveView] = useState<ActiveView>({ type: 'filter', id: 'today' });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isProductivityOpen, setIsProductivityOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isSyncingCaldav, setIsSyncingCaldav] = useState(false);

  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    root.setAttribute('data-appearance', state.appearance);
    body.setAttribute('data-appearance', state.appearance);

    if (state.appearance === 'dark' || state.appearance === 'dark-blue') {
      root.classList.add('dark');
      body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      body.classList.remove('dark');
    }
  }, [state.appearance]);

  // Calendar Feed Management
  const toggleCalendarFeed = (id: string) => {
    setState((prev) => ({
      ...prev,
      calendarFeeds: prev.calendarFeeds.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f)),
    }));
  };

  const addCalendarFeed = (feedData: Omit<CalendarFeed, 'id' | 'eventsCount'>): CalendarFeed => {
    const newFeed: CalendarFeed = {
      ...feedData,
      id: generateId('cal'),
      eventsCount: 0,
    };
    setState((prev) => ({
      ...prev,
      calendarFeeds: [...prev.calendarFeeds, newFeed],
    }));
    return newFeed;
  };

  const importIcsEvents = (calendarId: string, icsContent: string): number => {
    const parsedEvents = parseIcsContent(icsContent, calendarId);
    if (parsedEvents.length > 0) {
      setState((prev) => ({
        ...prev,
        calendarEvents: [...prev.calendarEvents, ...parsedEvents],
        calendarFeeds: prev.calendarFeeds.map((f) =>
          f.id === calendarId ? { ...f, eventsCount: f.eventsCount + parsedEvents.length } : f
        ),
      }));
    }
    return parsedEvents.length;
  };

  const addCalendarEvent = (eventData: Omit<CalendarEvent, 'id'>): CalendarEvent => {
    const newEvt: CalendarEvent = {
      ...eventData,
      id: generateId('evt'),
    };
    setState((prev) => ({
      ...prev,
      calendarEvents: [...prev.calendarEvents, newEvt],
      calendarFeeds: prev.calendarFeeds.map((f) =>
        f.id === eventData.calendarId ? { ...f, eventsCount: f.eventsCount + 1 } : f
      ),
    }));
    return newEvt;
  };

  const deleteCalendarEvent = (id: string) => {
    setState((prev) => ({
      ...prev,
      calendarEvents: prev.calendarEvents.filter((e) => e.id !== id),
    }));
  };

  // Keyboard accelerators
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        if (e.key === 'Escape') {
          (e.target as HTMLElement).blur();
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('planify-quick-find') as HTMLInputElement | null;
        if (searchInput) searchInput.focus();
      } else if (e.key === 'q' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setIsQuickAddOpen(true);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 't') {
        e.preventDefault();
        setActiveView({ type: 'filter', id: 'today' });
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'u') {
        e.preventDefault();
        setActiveView({ type: 'filter', id: 'scheduled' });
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        setActiveView({ type: 'filter', id: 'labels' });
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setActiveView({ type: 'filter', id: 'pinboard' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const setAppearance = (mode: AppearanceMode) => {
    setState((prev) => ({ ...prev, appearance: mode }));
  };

  const setDailyGoal = (dailyGoal: number) => {
    setState((prev) => ({ ...prev, dailyGoal }));
  };

  const setSoundEnabled = (soundEnabled: boolean) => {
    setState((prev) => ({ ...prev, soundEnabled }));
  };

  const setCaldavConfig = (config: Partial<CaldavConfig>) => {
    setState((prev) => ({
      ...prev,
      caldav: { ...prev.caldav, ...config },
    }));
  };

  const syncCaldavNow = async (): Promise<{ success: boolean; message: string }> => {
    if (!state.caldav.enabled || !state.caldav.serverUrl) {
      return { success: false, message: 'CalDAV sync is not configured or enabled.' };
    }

    setIsSyncingCaldav(true);
    try {
      const testRes = await testCaldavConnection(state.caldav);
      if (!testRes.success) {
        setIsSyncingCaldav(false);
        return { success: false, message: testRes.message };
      }

      const syncRes = await syncCaldav(
        state.caldav,
        state.projects,
        state.items,
        state.calendarEvents
      );

      setState((prev) => ({
        ...prev,
        items: syncRes.items,
        calendarEvents: syncRes.events,
        caldav: {
          ...prev.caldav,
          lastSyncedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      }));

      setIsSyncingCaldav(false);
      return {
        success: true,
        message: `CalDAV sync completed! Synced ${syncRes.syncedCount} new item(s).`,
      };
    } catch (e: unknown) {
      setIsSyncingCaldav(false);
      const errMsg = e instanceof Error ? e.message : String(e);
      return { success: false, message: `CalDAV error: ${errMsg}` };
    }
  };

  // Background Auto-Sync Timer for GNOME & Android CalDAV Accounts
  useEffect(() => {
    if (!state.caldav.enabled || !state.caldav.autoSync || !state.caldav.serverUrl) {
      return;
    }

    // Perform an initial sync on mount or configuration enable
    syncCaldavNow();

    const intervalMs = Math.max(1, state.caldav.autoSyncIntervalMinutes || 15) * 60 * 1000;
    const timer = setInterval(() => {
      syncCaldavNow();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [
    state.caldav.enabled,
    state.caldav.autoSync,
    state.caldav.autoSyncIntervalMinutes,
    state.caldav.serverUrl,
  ]);

  const getProjectById = (id: string) => state.projects.find((p) => p.id === id);
  const getSectionById = (id: string) => state.sections.find((s) => s.id === id);
  const getLabelById = (id: string) => state.labels.find((l) => l.id === id);

  // Task CRUD
  const addTask = (taskData: Partial<Item> & { content: string; project_id: string }): Item => {
    const newItem: Item = {
      id: generateId('task'),
      content: taskData.content,
      description: taskData.description || '',
      project_id: taskData.project_id,
      section_id: taskData.section_id,
      priority: taskData.priority || 1,
      due_date: taskData.due_date || null,
      due_time: taskData.due_time || null,
      is_recurring: taskData.is_recurring || false,
      recurrence_rule: taskData.recurrence_rule,
      labels: taskData.labels || [],
      completed: false,
      completed_at: null,
      added_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_pinned: taskData.is_pinned || false,
      order: state.items.filter((i) => i.project_id === taskData.project_id).length,
      subtasks: taskData.subtasks || [],
      attachments: taskData.attachments || [],
      reminders: taskData.reminders || [],
    };

    setState((prev) => ({
      ...prev,
      items: [newItem, ...prev.items],
    }));

    return newItem;
  };

  const updateTask = (id: string, updates: Partial<Item>) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === id ? { ...item, ...updates, updated_at: new Date().toISOString() } : item
      ),
    }));
  };

  const deleteTask = (id: string) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
    }));
    if (selectedTaskId === id) {
      setSelectedTaskId(null);
    }
  };

  const toggleTaskCompletion = (id: string) => {
    setState((prev) => {
      const task = prev.items.find((i) => i.id === id);
      if (!task) return prev;

      const isNowCompleted = !task.completed;
      if (isNowCompleted && prev.soundEnabled) {
        playCompleteSound(true);
      }

      if (isNowCompleted && task.is_recurring && task.due_date) {
        const nextDueDate = calculateNextDate(task.due_date, task.recurrence_rule);
        const completedCopy: Item = {
          ...task,
          id: generateId('task_done'),
          completed: true,
          completed_at: new Date().toISOString(),
          is_recurring: false,
        };

        const updatedRecurringTask: Item = {
          ...task,
          due_date: nextDueDate,
          completed: false,
          completed_at: null,
          updated_at: new Date().toISOString(),
        };

        return {
          ...prev,
          items: [completedCopy, ...prev.items.filter((i) => i.id !== id), updatedRecurringTask],
        };
      }

      return {
        ...prev,
        items: prev.items.map((item) =>
          item.id === id
            ? {
                ...item,
                completed: isNowCompleted,
                completed_at: isNowCompleted ? new Date().toISOString() : null,
                updated_at: new Date().toISOString(),
              }
            : item
        ),
      };
    });
  };

  const toggleTaskPin = (id: string) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === id ? { ...item, is_pinned: !item.is_pinned } : item
      ),
    }));
  };

  const moveTaskToSection = (taskId: string, sectionId?: string) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === taskId ? { ...item, section_id: sectionId, updated_at: new Date().toISOString() } : item
      ),
    }));
  };

  const moveTaskToProject = (taskId: string, projectId: string) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === taskId
          ? { ...item, project_id: projectId, section_id: undefined, updated_at: new Date().toISOString() }
          : item
      ),
    }));
  };

  const addSubtask = (taskId: string, content: string) => {
    const newSub: SubItem = { id: generateId('sub'), content, completed: false };
    setState((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === taskId ? { ...item, subtasks: [...item.subtasks, newSub] } : item
      ),
    }));
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id !== taskId) return item;
        return {
          ...item,
          subtasks: item.subtasks.map((s) =>
            s.id === subtaskId ? { ...s, completed: !s.completed } : s
          ),
        };
      }),
    }));
  };

  const deleteSubtask = (taskId: string, subtaskId: string) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id !== taskId) return item;
        return {
          ...item,
          subtasks: item.subtasks.filter((s) => s.id !== subtaskId),
        };
      }),
    }));
  };

  const addAttachment = (taskId: string, attachment: Omit<Attachment, 'id'>) => {
    const newAtt: Attachment = { ...attachment, id: generateId('att') };
    setState((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === taskId ? { ...item, attachments: [...item.attachments, newAtt] } : item
      ),
    }));
  };

  const deleteAttachment = (taskId: string, attachmentId: string) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id !== taskId) return item;
        return {
          ...item,
          attachments: item.attachments.filter((a) => a.id !== attachmentId),
        };
      }),
    }));
  };

  const addReminder = (taskId: string, reminder: Omit<Reminder, 'id'>) => {
    const newRem: Reminder = { ...reminder, id: generateId('rem') };
    setState((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === taskId ? { ...item, reminders: [...item.reminders, newRem] } : item
      ),
    }));
  };

  const deleteReminder = (taskId: string, reminderId: string) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id !== taskId) return item;
        return {
          ...item,
          reminders: item.reminders.filter((r) => r.id !== reminderId),
        };
      }),
    }));
  };

  // Projects
  const addProject = (projectData: Omit<Project, 'id' | 'order' | 'is_inbox' | 'is_archived'>): Project => {
    const newProj: Project = {
      ...projectData,
      id: generateId('proj'),
      order: state.projects.length,
      is_inbox: false,
      is_archived: false,
    };
    setState((prev) => ({
      ...prev,
      projects: [...prev.projects, newProj],
    }));
    return newProj;
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }));
  };

  const deleteProject = (id: string) => {
    const proj = state.projects.find((p) => p.id === id);
    if (proj?.is_inbox) return;

    setState((prev) => ({
      ...prev,
      projects: prev.projects.filter((p) => p.id !== id),
      sections: prev.sections.filter((s) => s.project_id !== id),
      items: prev.items.filter((i) => i.project_id !== id),
    }));

    if (activeView.type === 'project' && activeView.id === id) {
      setActiveView({ type: 'filter', id: 'today' });
    }
  };

  const toggleProjectFavorite = (id: string) => {
    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => (p.id === id ? { ...p, is_favorite: !p.is_favorite } : p)),
    }));
  };

  const setProjectViewMode = (id: string, mode: 'list' | 'board') => {
    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => (p.id === id ? { ...p, view_mode: mode } : p)),
    }));
  };

  // Sections
  const addSection = (projectId: string, name: string): Section => {
    const newSec: Section = {
      id: generateId('sec'),
      project_id: projectId,
      name,
      order: state.sections.filter((s) => s.project_id === projectId).length,
      collapsed: false,
    };
    setState((prev) => ({
      ...prev,
      sections: [...prev.sections, newSec],
    }));
    return newSec;
  };

  const updateSection = (id: string, updates: Partial<Section>) => {
    setState((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    }));
  };

  const deleteSection = (id: string) => {
    setState((prev) => ({
      ...prev,
      sections: prev.sections.filter((s) => s.id !== id),
      items: prev.items.map((i) => (i.section_id === id ? { ...i, section_id: undefined } : i)),
    }));
  };

  const toggleSectionCollapse = (id: string) => {
    setState((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => (s.id === id ? { ...s, collapsed: !s.collapsed } : s)),
    }));
  };

  // Labels
  const addLabel = (name: string, color: string): Label => {
    const newLbl: Label = {
      id: generateId('lbl'),
      name,
      color,
      is_favorite: false,
      order: state.labels.length,
    };
    setState((prev) => ({
      ...prev,
      labels: [...prev.labels, newLbl],
    }));
    return newLbl;
  };

  const updateLabel = (id: string, updates: Partial<Label>) => {
    setState((prev) => ({
      ...prev,
      labels: prev.labels.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    }));
  };

  const deleteLabel = (id: string) => {
    setState((prev) => ({
      ...prev,
      labels: prev.labels.filter((l) => l.id !== id),
      items: prev.items.map((i) => ({
        ...i,
        labels: i.labels.filter((lblId) => lblId !== id),
      })),
    }));
    if (activeView.type === 'label' && activeView.id === id) {
      setActiveView({ type: 'filter', id: 'today' });
    }
  };

  // Counts
  const todayDate = getFormattedDate(0);
  const tomorrowDate = getFormattedDate(1);

  const getTaskCountForFilter = (filterId: string): number => {
    const activeTasks = state.items.filter((i) => !i.completed);
    switch (filterId) {
      case 'inbox': {
        const inbox = state.projects.find((p) => p.is_inbox);
        return inbox ? activeTasks.filter((i) => i.project_id === inbox.id).length : 0;
      }
      case 'today':
        return activeTasks.filter((i) => i.due_date && i.due_date <= todayDate).length;
      case 'tomorrow':
        return activeTasks.filter((i) => i.due_date === tomorrowDate).length;
      case 'scheduled':
        return activeTasks.filter((i) => !!i.due_date).length;
      case 'pinboard':
        return activeTasks.filter((i) => i.is_pinned).length;
      case 'completed':
        return state.items.filter((i) => i.completed).length;
      case 'anytime':
        return activeTasks.filter((i) => !i.due_date).length;
      case 'repeating':
        return activeTasks.filter((i) => i.is_recurring).length;
      case 'unlabeled':
        return activeTasks.filter((i) => i.labels.length === 0).length;
      case 'all':
        return activeTasks.length;
      case 'labels':
        return state.labels.length;
      default:
        return 0;
    }
  };

  const getTaskCountForProject = (projectId: string): number => {
    return state.items.filter((i) => i.project_id === projectId && !i.completed).length;
  };

  const getTaskCountForLabel = (labelId: string): number => {
    return state.items.filter((i) => i.labels.includes(labelId) && !i.completed).length;
  };

  // Backup & Restore
  const exportBackupJSON = (): string => {
    const backupData = {
      version: '2.0',
      exported_at: new Date().toISOString(),
      ...state,
    };
    return JSON.stringify(backupData, null, 2);
  };

  const importBackupJSON = (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data.items) && Array.isArray(data.projects)) {
        setState({
          items: data.items,
          projects: data.projects,
          sections: data.sections || [],
          labels: data.labels || [],
          calendarFeeds: data.calendarFeeds || state.calendarFeeds,
          calendarEvents: data.calendarEvents || state.calendarEvents,
          appearance: data.appearance || 'light',
          dailyGoal: data.dailyGoal || 5,
          soundEnabled: data.soundEnabled ?? true,
          caldav: data.caldav || state.caldav,
        });
        return true;
      }
    } catch (e) {
      console.error('Import backup failed:', e);
    }
    return false;
  };

  const resetToDefaults = () => {
    localStorage.removeItem(STORAGE_KEY);
    setState(getInitialState());
  };

  const contextValue = useMemo<PlanifyContextType>(
    () => ({
      items: state.items,
      projects: state.projects,
      sections: state.sections,
      labels: state.labels,
      calendarFeeds: state.calendarFeeds,
      calendarEvents: state.calendarEvents,
      appearance: state.appearance,
      dailyGoal: state.dailyGoal,
      soundEnabled: state.soundEnabled,
      caldav: state.caldav,
      isSyncingCaldav,
      activeView,
      searchQuery,
      selectedTaskId,
      isQuickAddOpen,
      isProductivityOpen,
      isSettingsOpen,
      isNewProjectOpen,
      editingProject,
      sidebarOpen,
      setActiveView,
      setSearchQuery,
      setSelectedTaskId,
      setIsQuickAddOpen,
      setIsProductivityOpen,
      setIsSettingsOpen,
      setIsNewProjectOpen,
      setEditingProject,
      setSidebarOpen,
      setAppearance,
      setDailyGoal,
      setSoundEnabled,
      setCaldavConfig,
      syncCaldavNow,
      toggleCalendarFeed,
      addCalendarFeed,
      importIcsEvents,
      addCalendarEvent,
      deleteCalendarEvent,
      addTask,
      updateTask,
      deleteTask,
      toggleTaskCompletion,
      toggleTaskPin,
      moveTaskToSection,
      moveTaskToProject,
      addSubtask,
      toggleSubtask,
      deleteSubtask,
      addAttachment,
      deleteAttachment,
      addReminder,
      deleteReminder,
      addProject,
      updateProject,
      deleteProject,
      toggleProjectFavorite,
      setProjectViewMode,
      addSection,
      updateSection,
      deleteSection,
      toggleSectionCollapse,
      addLabel,
      updateLabel,
      deleteLabel,
      getProjectById,
      getSectionById,
      getLabelById,
      getTaskCountForFilter,
      getTaskCountForProject,
      getTaskCountForLabel,
      exportBackupJSON,
      importBackupJSON,
      resetToDefaults,
    }),
    [state, activeView, searchQuery, selectedTaskId, isQuickAddOpen, isProductivityOpen, isSettingsOpen, isNewProjectOpen, editingProject, sidebarOpen, isSyncingCaldav]
  );

  return <PlanifyContext.Provider value={contextValue}>{children}</PlanifyContext.Provider>;
};

export function usePlanify(): PlanifyContextType {
  const context = useContext(PlanifyContext);
  if (!context) {
    throw new Error('usePlanify must be used within a PlanifyProvider');
  }
  return context;
}

function calculateNextDate(currentDateStr: string, rule?: string): string {
  const date = new Date(currentDateStr);
  if (isNaN(date.getTime())) return getFormattedDate(1);

  switch (rule) {
    case 'weekdays': {
      do {
        date.setDate(date.getDate() + 1);
      } while (date.getDay() === 0 || date.getDay() === 6);
      break;
    }
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1);
      break;
    case 'daily':
    default:
      date.setDate(date.getDate() + 1);
      break;
  }
  return date.toISOString().split('T')[0];
}
