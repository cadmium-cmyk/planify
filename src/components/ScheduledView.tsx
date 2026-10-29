import React, { useState } from 'react';
import {
  CalendarDays,
  AlertTriangle,
  Plus,
  Calendar as CalendarIcon,
  X,
  MapPin,
  Clock,
} from 'lucide-react';
import { usePlanify } from '../context/PlanifyContext';
import { TaskRow } from './TaskRow';
import { CalendarEventRow } from './CalendarEventRow';
import { getFormattedDate } from '../services/store';

export const ScheduledView: React.FC = () => {
  const {
    items,
    addTask,
    calendarEvents,
    calendarFeeds,
    addCalendarEvent,
  } = usePlanify();

  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(null);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState(getFormattedDate(0));
  const [eventTime, setEventTime] = useState('10:00');
  const [eventLocation, setEventLocation] = useState('');
  const [eventCalendarId, setEventCalendarId] = useState('');

  const todayStr = getFormattedDate(0);
  const tomorrowStr = getFormattedDate(1);

  // Filter enabled calendar feeds
  const enabledFeedIds = calendarFeeds.filter((f) => f.enabled).map((f) => f.id);
  const activeEvents = calendarEvents.filter((e) => enabledFeedIds.includes(e.calendarId));

  // Active tasks with a due date
  const activeDatedTasks = items.filter((i) => !i.completed && i.due_date);

  // Grouping tasks
  const overdueTasks = activeDatedTasks.filter((i) => i.due_date! < todayStr);
  const todayTasks = activeDatedTasks.filter((i) => i.due_date === todayStr);
  const tomorrowTasks = activeDatedTasks.filter((i) => i.due_date === tomorrowStr);

  // Grouping events
  const todayEvents = activeEvents.filter((e) => e.startDate === todayStr);
  const tomorrowEvents = activeEvents.filter((e) => e.startDate === tomorrowStr);

  // Future dates containing tasks or events
  const upcomingTasks = activeDatedTasks.filter((i) => i.due_date! > tomorrowStr);
  const upcomingEvents = activeEvents.filter((e) => e.startDate > tomorrowStr);

  const allUpcomingDates = Array.from(
    new Set([
      ...upcomingTasks.map((t) => t.due_date!),
      ...upcomingEvents.map((e) => e.startDate),
    ])
  ).sort();

  // 14-day carousel
  const daysCarousel = Array.from({ length: 14 }).map((_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() + idx);
    const dateStr = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString(undefined, { weekday: 'short' });
    const dayNum = d.getDate();

    const taskCount = activeDatedTasks.filter((t) => t.due_date === dateStr).length;
    const eventCount = activeEvents.filter((e) => e.startDate === dateStr).length;

    return {
      dateStr,
      dayName,
      dayNum,
      taskCount,
      eventCount,
      totalCount: taskCount + eventCount,
      isToday: idx === 0,
    };
  });

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;

    const calId = eventCalendarId || calendarFeeds[0]?.id || 'cal_personal';
    addCalendarEvent({
      calendarId: calId,
      title: eventTitle.trim(),
      location: eventLocation.trim(),
      startDate: eventDate,
      startTime: eventTime,
      isAllDay: false,
    });

    setEventTitle('');
    setEventLocation('');
    setIsAddingEvent(false);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      {/* Top Days Quick Selector Strip */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 shadow-2xs">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
            <CalendarDays className="w-3.5 h-3.5 text-purple-500" />
            Schedule Timeline (Tasks & Calendar Events)
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddingEvent(true)}
              className="text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Event</span>
            </button>
            {selectedDateFilter && (
              <button
                onClick={() => setSelectedDateFilter(null)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Show all dates
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {daysCarousel.map((item) => {
            const isSelected = selectedDateFilter === item.dateStr;
            return (
              <button
                key={item.dateStr}
                onClick={() => setSelectedDateFilter(isSelected ? null : item.dateStr)}
                className={`flex-1 min-w-[54px] py-2 px-1 rounded-xl flex flex-col items-center justify-center text-xs transition-all ${
                  isSelected
                    ? 'bg-purple-600 text-white font-semibold shadow-xs'
                    : item.isToday
                    ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className="text-[10px] uppercase opacity-75">{item.dayName}</span>
                <span className="text-base font-bold my-0.5">{item.dayNum}</span>

                <div className="flex items-center gap-0.5">
                  {item.taskCount > 0 && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-500'}`}
                      title={`${item.taskCount} task(s)`}
                    />
                  )}
                  {item.eventCount > 0 && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-amber-200' : 'bg-purple-500'}`}
                      title={`${item.eventCount} event(s)`}
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Add Event Modal */}
      {isAddingEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
          onClick={() => setIsAddingEvent(false)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-purple-600" />
                <span>New Calendar Event</span>
              </h3>
              <button
                onClick={() => setIsAddingEvent(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Event Title
                </label>
                <input
                  type="text"
                  autoFocus
                  placeholder="e.g. Design Review Sync, Team Lunch"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Time
                  </label>
                  <input
                    type="time"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Location (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Room B / Video Call"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Calendar Feed
                </label>
                <select
                  value={eventCalendarId}
                  onChange={(e) => setEventCalendarId(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                >
                  {calendarFeeds.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddingEvent(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!eventTitle.trim()}
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium"
                >
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Selected Date View */}
      {selectedDateFilter ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm text-slate-800 dark:text-slate-200">
              Schedule for {new Date(selectedDateFilter + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </h2>
          </div>

          <div className="space-y-2">
            {/* Events first */}
            {activeEvents
              .filter((e) => e.startDate === selectedDateFilter)
              .map((e) => (
                <CalendarEventRow key={e.id} event={e} />
              ))}

            {/* Tasks next */}
            {activeDatedTasks
              .filter((t) => t.due_date === selectedDateFilter)
              .map((task) => (
                <TaskRow key={task.id} task={task} />
              ))}

            {activeEvents.filter((e) => e.startDate === selectedDateFilter).length === 0 &&
              activeDatedTasks.filter((t) => t.due_date === selectedDateFilter).length === 0 && (
                <p className="text-xs text-slate-400 py-6 text-center">Nothing scheduled for this date.</p>
              )}
          </div>
        </div>
      ) : (
        /* Regular Chronological Breakdown */
        <div className="space-y-6">
          {/* Overdue Tasks Section */}
          {overdueTasks.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-rose-600 dark:text-rose-400">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Overdue Tasks ({overdueTasks.length})</span>
                </div>
              </div>
              <div className="space-y-2">
                {overdueTasks.map((task) => (
                  <TaskRow key={task.id} task={task} />
                ))}
              </div>
            </div>
          )}

          {/* Today Section (Integrated Events + Tasks) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                  Today
                </h3>
                <span className="text-xs text-slate-400">
                  {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
                <span className="text-xs px-2 py-0.2 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-medium">
                  {todayTasks.length} tasks · {todayEvents.length} events
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {todayEvents.map((evt) => (
                <CalendarEventRow key={evt.id} event={evt} />
              ))}
              {todayTasks.map((task) => (
                <TaskRow key={task.id} task={task} />
              ))}
              {todayEvents.length === 0 && todayTasks.length === 0 && (
                <p className="text-xs text-slate-400 py-3 italic">Nothing scheduled for today.</p>
              )}
            </div>
          </div>

          {/* Tomorrow Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                  Tomorrow
                </h3>
                <span className="text-xs px-2 py-0.2 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-medium">
                  {tomorrowTasks.length} tasks · {tomorrowEvents.length} events
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {tomorrowEvents.map((evt) => (
                <CalendarEventRow key={evt.id} event={evt} />
              ))}
              {tomorrowTasks.map((task) => (
                <TaskRow key={task.id} task={task} />
              ))}
              {tomorrowEvents.length === 0 && tomorrowTasks.length === 0 && (
                <p className="text-xs text-slate-400 py-3 italic">Nothing scheduled for tomorrow.</p>
              )}
            </div>
          </div>

          {/* Upcoming Dates Sections */}
          {allUpcomingDates.map((dateStr) => {
            const dateTasks = upcomingTasks.filter((t) => t.due_date === dateStr);
            const dateEvents = upcomingEvents.filter((e) => e.startDate === dateStr);
            const d = new Date(dateStr + 'T00:00:00');
            const formatted = d.toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            });

            return (
              <div key={dateStr} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300">
                      {formatted}
                    </h3>
                    <span className="text-xs px-2 py-0.2 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-medium">
                      {dateTasks.length} tasks · {dateEvents.length} events
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  {dateEvents.map((evt) => (
                    <CalendarEventRow key={evt.id} event={evt} />
                  ))}
                  {dateTasks.map((task) => (
                    <TaskRow key={task.id} task={task} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
