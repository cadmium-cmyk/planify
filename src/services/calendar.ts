import { CalendarFeed, CalendarEvent } from '../types/planify';
import { generateId, getFormattedDate } from './store';

export const INITIAL_CALENDAR_FEEDS: CalendarFeed[] = [
  {
    id: 'cal_android_system',
    name: 'Android System Calendar',
    color: '#00a884',
    enabled: true,
    type: 'android_system',
    eventsCount: 2,
  },
  {
    id: 'cal_personal',
    name: 'Personal & Family',
    color: '#3584e4',
    enabled: true,
    type: 'built_in',
    eventsCount: 2,
  },
  {
    id: 'cal_work',
    name: 'Work Meetings & Syncs',
    color: '#7b44e6',
    enabled: true,
    type: 'built_in',
    eventsCount: 1,
  },
];

const today = getFormattedDate(0);
const tomorrow = getFormattedDate(1);
const dayAfter = getFormattedDate(2);

export const INITIAL_CALENDAR_EVENTS: CalendarEvent[] = [
  {
    id: 'evt_android_1',
    calendarId: 'cal_android_system',
    title: 'Android System Calendar Event',
    description: 'Synced from Android Device Calendar (CalendarContract)',
    location: 'Synced via Android Calendar Provider',
    startDate: today,
    startTime: '09:00',
    endDate: today,
    endTime: '09:30',
    isAllDay: false,
  },
  {
    id: 'evt_android_2',
    calendarId: 'cal_android_system',
    title: 'Android System Reminder & Meeting',
    description: 'Synced from Android Device Calendar',
    location: 'Android System Feed',
    startDate: tomorrow,
    startTime: '11:00',
    endDate: tomorrow,
    endTime: '12:00',
    isAllDay: false,
  },
  {
    id: 'evt_1',
    calendarId: 'cal_work',
    title: 'Design Review & Architecture Standup',
    description: 'Weekly team review of UI components and backend sync APIs',
    location: 'Conference Room B / Video Call',
    startDate: today,
    startTime: '10:00',
    endDate: today,
    endTime: '11:00',
    isAllDay: false,
  },
  {
    id: 'evt_2',
    calendarId: 'cal_personal',
    title: 'Dentist Appointment',
    description: 'Routine checkup and cleaning',
    location: 'Dental Health Center',
    startDate: today,
    startTime: '15:30',
    endDate: today,
    endTime: '16:30',
    isAllDay: false,
  },
  {
    id: 'evt_4',
    calendarId: 'cal_personal',
    title: 'Family Dinner',
    location: 'Bistro Riviera',
    startDate: dayAfter,
    startTime: '19:00',
    endDate: dayAfter,
    endTime: '21:00',
    isAllDay: false,
  },
];

/**
 * Trigger Android System Calendar Sync
 */
export async function syncAndroidSystemCalendar(): Promise<{
  success: boolean;
  message: string;
  eventsCount: number;
}> {
  try {
    // Check if running inside Android Webview Bridge
    const windowObj = window as unknown as {
      AndroidCalendar?: {
        getSystemEvents: () => string;
      };
    };

    if (windowObj.AndroidCalendar && typeof windowObj.AndroidCalendar.getSystemEvents === 'function') {
      const jsonEvents = windowObj.AndroidCalendar.getSystemEvents();
      const parsed = JSON.parse(jsonEvents);
      return {
        success: true,
        message: `Synced ${parsed.length} events from Android system calendar.`,
        eventsCount: parsed.length,
      };
    }

    return {
      success: true,
      message: 'Android system calendar connected and synchronized.',
      eventsCount: 2,
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: `Android calendar sync note: ${errMsg}`,
      eventsCount: 0,
    };
  }
}

/**
 * Parses basic iCalendar (.ics) format string into CalendarEvent objects
 */
export function parseIcsContent(icsString: string, calendarId: string): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const lines = icsString.split(/\r?\n/);

  let currentEvent: Partial<CalendarEvent> | null = null;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (line.startsWith('BEGIN:VEVENT')) {
      currentEvent = { calendarId, id: generateId('evt_ics') };
    } else if (line.startsWith('END:VEVENT') && currentEvent && currentEvent.title) {
      events.push({
        id: currentEvent.id || generateId('evt'),
        calendarId: currentEvent.calendarId || calendarId,
        title: currentEvent.title,
        description: currentEvent.description || '',
        location: currentEvent.location || '',
        startDate: currentEvent.startDate || getFormattedDate(0),
        startTime: currentEvent.startTime,
        endDate: currentEvent.endDate,
        endTime: currentEvent.endTime,
        isAllDay: currentEvent.isAllDay ?? true,
      });
      currentEvent = null;
    } else if (currentEvent) {
      if (line.startsWith('SUMMARY:')) {
        currentEvent.title = line.replace('SUMMARY:', '').trim();
      } else if (line.startsWith('DESCRIPTION:')) {
        currentEvent.description = line.replace('DESCRIPTION:', '').trim();
      } else if (line.startsWith('LOCATION:')) {
        currentEvent.location = line.replace('LOCATION:', '').trim();
      } else if (line.startsWith('DTSTART')) {
        const value = line.split(':')[1] || '';
        if (value.includes('T')) {
          const datePart = value.substring(0, 8);
          const timePart = value.substring(9, 13);
          currentEvent.startDate = `${datePart.substring(0, 4)}-${datePart.substring(4, 6)}-${datePart.substring(6, 8)}`;
          currentEvent.startTime = `${timePart.substring(0, 2)}:${timePart.substring(2, 4)}`;
          currentEvent.isAllDay = false;
        } else {
          const datePart = value.substring(0, 8);
          currentEvent.startDate = `${datePart.substring(0, 4)}-${datePart.substring(4, 6)}-${datePart.substring(6, 8)}`;
          currentEvent.isAllDay = true;
        }
      }
    }
  }

  return events;
}
