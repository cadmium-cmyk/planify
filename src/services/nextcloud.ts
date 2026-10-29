import { Item, Project, Section, Label, PriorityLevel } from '../types/planify';
import { generateId } from './store';

export interface NextcloudConfig {
  serverUrl: string;
  username: string;
  password: string; // User password or App Password
  syncDeck: boolean;
  syncCalDav: boolean;
  autoSync: boolean;
  lastSyncedAt?: string;
  enabled: boolean;
}

export interface NextcloudDeckBoard {
  id: number;
  title: string;
  color?: string;
  archived?: boolean;
}

export interface NextcloudDeckStack {
  id: number;
  title: string;
  boardId: number;
  order?: number;
}

export interface NextcloudDeckCard {
  id: number;
  title: string;
  description?: string;
  stackId: number;
  boardId: number;
  duedate?: string;
  done?: boolean;
  labels?: Array<{ id: number; title: string; color: string }>;
}

export const DEFAULT_NEXTCLOUD_CONFIG: NextcloudConfig = {
  serverUrl: '',
  username: '',
  password: '',
  syncDeck: true,
  syncCalDav: true,
  autoSync: false,
  enabled: false,
};

function formatServerUrl(url: string): string {
  let cleaned = url.trim();
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = `https://${cleaned}`;
  }
  return cleaned.replace(/\/+$/, '');
}

function getAuthHeaders(config: NextcloudConfig): HeadersInit {
  const credentials = btoa(`${config.username.trim()}:${config.password.trim()}`);
  return {
    Authorization: `Basic ${credentials}`,
    'OCS-APIRequest': 'true',
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

/**
 * Test Nextcloud connection and verify Deck / CalDAV endpoint accessibility
 */
export async function testNextcloudConnection(config: NextcloudConfig): Promise<{
  success: boolean;
  message: string;
  deckAvailable?: boolean;
  caldavAvailable?: boolean;
}> {
  if (!config.serverUrl || !config.username || !config.password) {
    return { success: false, message: 'Please provide Server URL, Username, and App Password.' };
  }

  const baseUrl = formatServerUrl(config.serverUrl);
  const headers = getAuthHeaders(config);

  try {
    // 1. Test Deck API
    let deckAvailable = false;
    try {
      const deckRes = await fetch(`${baseUrl}/index.php/apps/deck/api/v1.0/boards`, { headers });
      if (deckRes.ok) {
        deckAvailable = true;
      }
    } catch (e) {
      console.warn('Nextcloud Deck API probe failed:', e);
    }

    // 2. Test CalDAV / WebDAV user endpoint
    let caldavAvailable = false;
    try {
      const davUrl = `${baseUrl}/remote.php/dav/calendars/${encodeURIComponent(config.username.trim())}/`;
      const davRes = await fetch(davUrl, { method: 'PROPFIND', headers });
      if (davRes.status === 207 || davRes.ok || davRes.status === 405) {
        caldavAvailable = true;
      }
    } catch (e) {
      console.warn('Nextcloud CalDAV probe failed:', e);
    }

    if (!deckAvailable && !caldavAvailable) {
      // Try generic Nextcloud status check
      const statusRes = await fetch(`${baseUrl}/status.php`, { headers });
      if (statusRes.ok) {
        return {
          success: true,
          message: 'Connected to Nextcloud server! (Deck/CalDAV apps can be enabled)',
          deckAvailable: false,
          caldavAvailable: false,
        };
      }
      return { success: false, message: 'Authentication failed or server returned error.' };
    }

    return {
      success: true,
      message: `Connected successfully! Deck: ${deckAvailable ? 'Ready' : 'Not installed'}, CalDAV Tasks: ${caldavAvailable ? 'Ready' : 'Not installed'}`,
      deckAvailable,
      caldavAvailable,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: `Connection failed: ${errorMsg}. Check URL and CORS settings on Nextcloud.`,
    };
  }
}

/**
 * Sync Nextcloud Deck boards, stacks, and cards into Planify
 */
export async function syncNextcloudDeck(
  config: NextcloudConfig,
  currentProjects: Project[],
  currentSections: Section[],
  currentItems: Item[]
): Promise<{
  projects: Project[];
  sections: Section[];
  items: Item[];
  syncedCount: number;
}> {
  if (!config.enabled || !config.serverUrl) {
    return { projects: currentProjects, sections: currentSections, items: currentItems, syncedCount: 0 };
  }

  const baseUrl = formatServerUrl(config.serverUrl);
  const headers = getAuthHeaders(config);

  const newProjects = [...currentProjects];
  const newSections = [...currentSections];
  const newItems = [...currentItems];
  let syncedCount = 0;

  try {
    // Get all Deck boards
    const boardsRes = await fetch(`${baseUrl}/index.php/apps/deck/api/v1.0/boards`, { headers });
    if (!boardsRes.ok) {
      throw new Error(`Deck API error: ${boardsRes.statusText}`);
    }

    const boards: NextcloudDeckBoard[] = await boardsRes.json();

    for (const board of boards) {
      if (board.archived) continue;

      // Find or create matching project
      let project = newProjects.find((p) => p.name.toLowerCase() === board.title.toLowerCase());
      if (!project) {
        project = {
          id: generateId('proj_nc'),
          name: board.title,
          description: 'Synced from Nextcloud Deck',
          color: board.color ? `#${board.color}` : '#3584e4',
          emoji: '☁️',
          is_inbox: false,
          is_favorite: false,
          is_archived: false,
          view_mode: 'board',
          order: newProjects.length,
        };
        newProjects.push(project);
      }

      // Fetch stacks for board
      const stacksRes = await fetch(
        `${baseUrl}/index.php/apps/deck/api/v1.0/boards/${board.id}/stacks`,
        { headers }
      );
      if (!stacksRes.ok) continue;

      const stacks: NextcloudDeckStack[] = await stacksRes.json();

      for (const stack of stacks) {
        // Find or create matching section
        let section = newSections.find(
          (s) => s.project_id === project!.id && s.name.toLowerCase() === stack.title.toLowerCase()
        );
        if (!section) {
          section = {
            id: generateId('sec_nc'),
            project_id: project.id,
            name: stack.title,
            order: stack.order || newSections.length,
            collapsed: false,
          };
          newSections.push(section);
        }

        // Fetch cards for stack
        const cardsRes = await fetch(
          `${baseUrl}/index.php/apps/deck/api/v1.0/boards/${board.id}/stacks/${stack.id}/cards`,
          { headers }
        );
        if (!cardsRes.ok) continue;

        const cards: NextcloudDeckCard[] = await cardsRes.json();

        for (const card of cards) {
          // Find or create matching item
          const existingItem = newItems.find((i) => i.content === card.title && i.project_id === project!.id);
          if (!existingItem) {
            const newItem: Item = {
              id: generateId('task_nc'),
              content: card.title,
              description: card.description || '',
              project_id: project.id,
              section_id: section.id,
              priority: 1,
              due_date: card.duedate ? card.duedate.split('T')[0] : null,
              due_time: card.duedate && card.duedate.includes('T') ? card.duedate.split('T')[1].substring(0, 5) : null,
              is_recurring: false,
              labels: [],
              completed: !!card.done,
              completed_at: card.done ? new Date().toISOString() : null,
              added_at: new Date().toISOString(),
              is_pinned: false,
              order: newItems.length,
              subtasks: [],
              attachments: [],
              reminders: [],
            };
            newItems.unshift(newItem);
            syncedCount++;
          }
        }
      }
    }
  } catch (err) {
    console.error('Error syncing Nextcloud Deck:', err);
  }

  return { projects: newProjects, sections: newSections, items: newItems, syncedCount };
}
