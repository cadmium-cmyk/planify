import React from 'react';
import { Calendar, Clock, MapPin, Trash2 } from 'lucide-react';
import { CalendarEvent } from '../types/planify';
import { usePlanify } from '../context/PlanifyContext';

interface CalendarEventRowProps {
  event: CalendarEvent;
}

export const CalendarEventRow: React.FC<CalendarEventRowProps> = ({ event }) => {
  const { calendarFeeds, deleteCalendarEvent } = usePlanify();
  const feed = calendarFeeds.find((f) => f.id === event.calendarId);

  const feedColor = feed?.color || '#3c6dff';
  const feedName = feed?.name || 'Local Calendar';

  return (
    <div className="group relative flex items-start gap-3 p-3 rounded-xl border border-dashed border-purple-300 dark:border-purple-800/80 bg-purple-50/40 dark:bg-purple-950/20 hover:border-purple-400 transition-all select-none">
      {/* Event Badge Icon */}
      <div
        className="w-5 h-5 mt-0.5 rounded-lg flex items-center justify-center text-white shrink-0 shadow-2xs"
        style={{ backgroundColor: feedColor }}
      >
        <Calendar className="w-3 h-3" />
      </div>

      {/* Event Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {event.title}
          </span>
          <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded-md bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">
            Event
          </span>
        </div>

        {event.description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5 font-normal">
            {event.description}
          </p>
        )}

        {/* Time, Location & Calendar Tag */}
        <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-600 dark:text-slate-400">
          <span className="inline-flex items-center gap-1 font-medium text-[11px] text-purple-700 dark:text-purple-300">
            <Clock className="w-3 h-3 text-purple-500" />
            <span>
              {event.isAllDay ? 'All Day' : `${event.startTime || '09:00'} ${event.endTime ? `- ${event.endTime}` : ''}`}
            </span>
          </span>

          {event.location && (
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
              <MapPin className="w-3 h-3 text-slate-400" />
              <span className="truncate max-w-[150px]">{event.location}</span>
            </span>
          )}

          <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: feedColor }} />
            <span>{feedName}</span>
          </span>
        </div>
      </div>

      {/* Actions */}
      <button
        onClick={() => deleteCalendarEvent(event.id)}
        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-opacity"
        title="Delete Calendar Event"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
