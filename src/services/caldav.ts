import { Item, Project, CalendarEvent, PriorityLevel } from '../types/planify';
import { generateId } from './store';
import { parseIcsContent } from './calendar';

export interface CaldavConfig {
  serverUrl: string;
  username: string;
  password: string; // Password or App Token
  syncTasks: boolean; // VTODO items
  syncEvents: boolean; // VEVENT items
  autoSync: boolean;
  autoSyncIntervalMinutes: number; // 5, 15, 30, 60
  providerPreset: 'gnome' | 'android' | 'nextcloud' | 'google' | 'custom';
  enabled: boolean;
  lastSyncedAt?: string;
}

export const DEFAULT_CALDAV_CONFIG: CaldavConfig = {
  serverUrl: '',
  username: '',
  password: '',
  syncTasks: true,
  syncEvents: true,
  autoSync: true,
  autoSyncIntervalMinutes: 15,
  providerPreset: 'gnome',
  enabled: false,
};

export const PROVIDER_PRESETS = [
  {
    id: 'gnome',
    name: 'GNOME Online Accounts',
    icon: '🖥️',
    description: 'Syncs with Nextcloud, ownCloud, or CalDAV added in GNOME Settings → Online Accounts.',
    defaultUrl: 'https://your-nextcloud.com/remote.php/dav/calendars/username/',
  },
  {
    id: 'android',
    name: 'Android Device Account (DAVx⁵)',
    icon: '📱',
    description: 'Syncs with DAVx⁵ or native Android account adapters managing WebDAV/CalDAV.',
    defaultUrl: 'https://your-server.com/remote.php/dav/calendars/username/',
  },
  {
    id: 'nextcloud',
    name: 'Nextcloud / ownCloud',
    icon: '☁️',
    description: 'Direct connection to Nextcloud/ownCloud tasks and calendars.',
    defaultUrl: 'https://cloud.example.com/remote.php/dav/calendars/username/',
  },
  {
    id: 'google',
    name: 'Google Tasks / Calendar',
    icon: '🌐',
    description: 'Connect via Google CalDAV endpoint or app password.',
    defaultUrl: 'https://apidata.googleusercontent.com/caldav/v2/your-email@gmail.com/user',
  },
  {
    id: 'custom',
    name: 'Custom CalDAV Server',
    icon: '⚙️',
    description: 'Any standard CalDAV server endpoint.',
    defaultUrl: '',
  },
] as const;

function formatUrl(url: string): string {
  let cleaned = url.trim();
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = `https://${cleaned}`;
  }
  return cleaned.replace(/\/+$/, '');
}

function getAuthHeaders(config: CaldavConfig): Record<string, string> {
  const credentials = btoa(`${config.username.trim()}:${config.password.trim()}`);
  return {
    Authorization: `Basic ${credentials}`,
    'Content-Type': 'application/xml; charset=utf-8',
    Accept: 'text/calendar, application/xml, text/xml',
  };
}

/**
 * Execute a HTTP request to a CalDAV server, utilizing the Express server proxy
 * to bypass browser CORS constraints when available.
 */
async function caldavRequest(
  url: string,
  method: string,
  headers: Record<string, string>,
  body?: string
): Promise<{ status: number; text: string; ok: boolean }> {
  // 1. Try backend CORS proxy endpoint first
  try {
    const proxyRes = await fetch('/api/caldav-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        method,
        headers,
        body,
      }),
    });

    if (proxyRes.ok) {
      const text = await proxyRes.text();
      return {
        status: proxyRes.status,
        text,
        ok: proxyRes.status >= 200 && proxyRes.status < 300,
      };
    }
  } catch {
    // If local proxy API fails, fallback to direct fetch
  }

  // 2. Direct browser fetch fallback
  const directRes = await fetch(url, {
    method,
    headers,
    body,
  });

  const text = await directRes.text();
  return {
    status: directRes.status,
    text,
    ok: directRes.ok,
  };
}

/**
 * Test CalDAV server connection
 */
export async function testCaldavConnection(config: CaldavConfig): Promise<{
  success: boolean;
  message: string;
}> {
  if (!config.serverUrl || !config.username || !config.password) {
    return { success: false, message: 'Please provide CalDAV Server URL, Username, and Password.' };
  }

  // 1. Try server-side test endpoint first
  try {
    const res = await fetch('/api/caldav-test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        serverUrl: config.serverUrl,
        username: config.username,
        password: config.password,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch {
    // Fallback to direct client test if server API is unreachable
  }

  const url = formatUrl(config.serverUrl);
  const headers = getAuthHeaders(config);

  try {
    const propfindBody = `<?xml version="1.0" encoding="utf-8" ?>
<D:propfind xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
  <D:prop>
    <D:resourcetype/>
    <D:displayname/>
  </D:prop>
</D:propfind>`;

    const response = await caldavRequest(url, 'PROPFIND', { ...headers, Depth: '1' }, propfindBody);

    if (response.status === 207 || response.ok || response.status === 405) {
      return {
        success: true,
        message: 'Successfully connected to CalDAV server!',
      };
    }

    if (response.status === 401) {
      return { success: false, message: 'Authentication failed (401 Unauthorized). Check username & password.' };
    }

    return { success: false, message: `Server returned status ${response.status}` };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: `Connection error: ${errMsg}. Check Server URL or credentials.`,
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

/**
 * Extract all href URLs from DAV XML responses
 */
function extractHrefsFromXml(xmlText: string, baseUrlStr: string): string[] {
  const hrefs: string[] = [];
  const hrefRegex = /<[^>]*href[^>]*>([^<]+)<\/[^>]*href>/gi;
  let match;

  const urlObj = new URL(baseUrlStr);
  const origin = urlObj.origin;

  while ((match = hrefRegex.exec(xmlText)) !== null) {
    let rawPath = match[1].trim();
    if (!rawPath) continue;

    let fullUrl = '';
    if (rawPath.startsWith('http://') || rawPath.startsWith('https://')) {
      fullUrl = rawPath;
    } else if (rawPath.startsWith('/')) {
      fullUrl = `${origin}${rawPath}`;
    } else {
      fullUrl = `${baseUrlStr.replace(/\/+$/, '')}/${rawPath}`;
    }

    if (!hrefs.includes(fullUrl)) {
      hrefs.push(fullUrl);
    }
  }

  return hrefs;
}

/**
 * Parse CalDAV VTODO text into Planify Tasks
 */
export function parseVtodoContent(vtodoIcs: string, defaultProjectId: string): Item[] {
  const decoded = decodeXmlEntities(vtodoIcs);
  const tasks: Item[] = [];
  const eventsBlocks = decoded.split('BEGIN:VTODO');

  for (let i = 1; i < eventsBlocks.length; i++) {
    const block = eventsBlocks[i].split('END:VTODO')[0];
    if (!block) continue;

    const rawLines = block.split(/\r?\n/);
    const lines: string[] = [];

    // Unfold multiline fields
    for (const rawLine of rawLines) {
      if ((rawLine.startsWith(' ') || rawLine.startsWith('\t')) && lines.length > 0) {
        lines[lines.length - 1] += rawLine.substring(1);
      } else {
        lines.push(rawLine.trim());
      }
    }

    let title = '';
    let description = '';
    let dueDate: string | null = null;
    let dueTime: string | null = null;
    let completed = false;
    let priority: PriorityLevel = 1;

    for (const line of lines) {
      if (line.startsWith('SUMMARY:')) {
        title = line.substring(8).trim();
      } else if (line.startsWith('DESCRIPTION:')) {
        description = line.substring(12).trim();
      } else if (line.startsWith('STATUS:COMPLETED') || line.startsWith('PERCENT-COMPLETE:100')) {
        completed = true;
      } else if (line.startsWith('PRIORITY:')) {
        const pNum = parseInt(line.substring(9).trim(), 10);
        if (pNum === 1 || pNum === 2) priority = 4; // High
        else if (pNum >= 3 && pNum <= 5) priority = 3; // Medium
        else if (pNum >= 6 && pNum <= 8) priority = 2; // Low
      } else if (line.startsWith('DUE') || line.startsWith('DTSTART')) {
        const value = line.split(':')[1] || '';
        if (value.includes('T')) {
          const datePart = value.substring(0, 8);
          const timePart = value.substring(9, 13);
          dueDate = `${datePart.substring(0, 4)}-${datePart.substring(4, 6)}-${datePart.substring(6, 8)}`;
          dueTime = `${timePart.substring(0, 2)}:${timePart.substring(2, 4)}`;
        } else if (value.length >= 8) {
          dueDate = `${value.substring(0, 4)}-${value.substring(4, 6)}-${value.substring(6, 8)}`;
        }
      }
    }

    if (title) {
      tasks.push({
        id: generateId('task_caldav'),
        content: title,
        description,
        project_id: defaultProjectId,
        priority,
        due_date: dueDate,
        due_time: dueTime,
        is_recurring: false,
        labels: [],
        completed,
        completed_at: completed ? new Date().toISOString() : null,
        added_at: new Date().toISOString(),
        is_pinned: false,
        order: tasks.length,
        subtasks: [],
        attachments: [],
        reminders: [],
      });
    }
  }

  return tasks;
}

/**
 * Sync tasks and calendar events with CalDAV server across all discovered calendar collections
 */
export async function syncCaldav(
  config: CaldavConfig,
  currentProjects: Project[],
  currentItems: Item[],
  currentEvents: CalendarEvent[]
): Promise<{
  items: Item[];
  events: CalendarEvent[];
  syncedCount: number;
}> {
  if (!config.enabled || !config.serverUrl) {
    return { items: currentItems, events: currentEvents, syncedCount: 0 };
  }

  const baseUrl = formatUrl(config.serverUrl);
  const headers = getAuthHeaders(config);

  const newItems = [...currentItems];
  const newEvents = [...currentEvents];
  let syncedCount = 0;

  try {
    // 1. Discover calendar collection endpoints via PROPFIND Depth 1
    const targetUrls: string[] = [baseUrl];

    try {
      const propfindBody = `<?xml version="1.0" encoding="utf-8" ?>
<D:propfind xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
  <D:prop>
    <D:resourcetype/>
    <D:displayname/>
  </D:prop>
</D:propfind>`;

      const propfindRes = await caldavRequest(baseUrl, 'PROPFIND', { ...headers, Depth: '1' }, propfindBody);
      if (propfindRes.ok || propfindRes.status === 207) {
        const extractedHrefs = extractHrefsFromXml(propfindRes.text, baseUrl);
        for (const href of extractedHrefs) {
          if (!targetUrls.includes(href)) {
            targetUrls.push(href);
          }
        }
      }
    } catch {
      // Ignore discovery errors, fallback to baseUrl
    }

    // Common Nextcloud/CalDAV subpaths fallback if only base URL exists
    if (targetUrls.length === 1 && !baseUrl.endsWith('.ics')) {
      const cleanBase = baseUrl.replace(/\/+$/, '');
      const commonPaths = ['/personal/', '/tasks/', '/default/', '/calendar/'];
      for (const p of commonPaths) {
        targetUrls.push(`${cleanBase}${p}`);
      }
    }

    const defaultProject = currentProjects[0]?.id || 'proj_inbox';

    // 2. Query each candidate calendar URL
    for (const calendarUrl of targetUrls) {
      // --- A. Sync VTODO Tasks ---
      if (config.syncTasks) {
        const taskQueryXml = `<?xml version="1.0" encoding="utf-8" ?>
<C:calendar-query xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
  <D:prop>
    <D:getetag/>
    <C:calendar-data/>
  </D:prop>
  <C:filter>
    <C:comp-filter name="VCALENDAR">
      <C:comp-filter name="VTODO"/>
    </C:comp-filter>
  </C:filter>
</C:calendar-query>`;

        const taskRes = await caldavRequest(calendarUrl, 'REPORT', headers, taskQueryXml);

        if ((taskRes.status === 207 || taskRes.ok) && taskRes.text.includes('BEGIN:VTODO')) {
          const parsedTasks = parseVtodoContent(taskRes.text, defaultProject);
          for (const task of parsedTasks) {
            const exists = newItems.some((i) => i.content === task.content);
            if (!exists) {
              newItems.unshift(task);
              syncedCount++;
            }
          }
        }
      }

      // --- B. Sync VEVENT Calendar Events ---
      if (config.syncEvents) {
        const eventQueryXml = `<?xml version="1.0" encoding="utf-8" ?>
<C:calendar-query xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
  <D:prop>
    <D:getetag/>
    <C:calendar-data/>
  </D:prop>
  <C:filter>
    <C:comp-filter name="VCALENDAR">
      <C:comp-filter name="VEVENT"/>
    </C:comp-filter>
  </C:filter>
</C:calendar-query>`;

        const eventRes = await caldavRequest(calendarUrl, 'REPORT', headers, eventQueryXml);

        if ((eventRes.status === 207 || eventRes.ok) && eventRes.text.includes('BEGIN:VEVENT')) {
          const parsedEvents = parseIcsContent(eventRes.text, 'caldav_synced');
          for (const evt of parsedEvents) {
            const exists = newEvents.some((e) => e.title === evt.title && e.startDate === evt.startDate);
            if (!exists) {
              newEvents.unshift(evt);
              syncedCount++;
            }
          }
        }
      }

      // --- C. Direct GET fallback for .ics resources ---
      if (calendarUrl.endsWith('.ics')) {
        const directIcsRes = await caldavRequest(calendarUrl, 'GET', headers);
        if (directIcsRes.ok) {
          if (config.syncTasks && directIcsRes.text.includes('BEGIN:VTODO')) {
            const parsedTasks = parseVtodoContent(directIcsRes.text, defaultProject);
            for (const task of parsedTasks) {
              const exists = newItems.some((i) => i.content === task.content);
              if (!exists) {
                newItems.unshift(task);
                syncedCount++;
              }
            }
          }
          if (config.syncEvents && directIcsRes.text.includes('BEGIN:VEVENT')) {
            const parsedEvents = parseIcsContent(directIcsRes.text, 'caldav_synced');
            for (const evt of parsedEvents) {
              const exists = newEvents.some((e) => e.title === evt.title && e.startDate === evt.startDate);
              if (!exists) {
                newEvents.unshift(evt);
                syncedCount++;
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('CalDAV sync error:', err);
  }

  return { items: newItems, events: newEvents, syncedCount };
}

