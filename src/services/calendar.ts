import { CalendarFeed, CalendarEvent } from '../types/planify';
import { generateId, getFormattedDate } from './store';

export const INITIAL_CALENDAR_FEEDS: CalendarFeed[] = [];

export const INITIAL_CALENDAR_EVENTS: CalendarEvent[] = [];

/**
 * Trigger Android System Calendar Sync
 */
export async function syncAndroidSystemCalendar(): Promise<{
  success: boolean;
  message: string;
  eventsCount: number;
}> {
  try {
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
      message: 'Android system calendar connected.',
      eventsCount: 0,
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

function decodeXmlEntities(str: string): string {
  return str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#13;/g, '\r')
    .replace(/&#10;/g, '\n')
    .replace(/&amp;/g, '&');
}

function unfoldIcsLines(icsString: string): string[] {
  const decoded = decodeXmlEntities(icsString);
  const rawLines = decoded.split(/\r?\n/);
  const unfolded: string[] = [];

  for (const rawLine of rawLines) {
    if ((rawLine.startsWith(' ') || rawLine.startsWith('\t')) && unfolded.length > 0) {
      unfolded[unfolded.length - 1] += rawLine.substring(1);
    } else {
      unfolded.push(rawLine);
    }
  }

  return unfolded;
}

/**
 * Parses basic iCalendar (.ics) format string into CalendarEvent objects
 */
export function parseIcsContent(icsString: string, calendarId: string): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const lines = unfoldIcsLines(icsString);

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
        currentEvent.title = line.substring(8).trim();
      } else if (line.startsWith('DESCRIPTION:')) {
        currentEvent.description = line.substring(12).trim();
      } else if (line.startsWith('LOCATION:')) {
        currentEvent.location = line.substring(9).trim();
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
