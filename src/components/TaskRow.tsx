import React from 'react';
import {
  Check,
  Calendar,
  Clock,
  Repeat,
  Pin,
  Paperclip,
  CheckSquare,
  MoreHorizontal,
  Trash2,
  Edit2,
  Flag,
} from 'lucide-react';
import { Item, PRIORITY_CONFIG } from '../types/planify';
import { usePlanify } from '../context/PlanifyContext';

interface TaskRowProps {
  task: Item;
  showProjectBadge?: boolean;
}

export const TaskRow: React.FC<TaskRowProps> = ({ task, showProjectBadge = true }) => {
  const {
    toggleTaskCompletion,
    toggleTaskPin,
    deleteTask,
    setSelectedTaskId,
    getProjectById,
    getSectionById,
    getLabelById,
  } = usePlanify();

  const project = getProjectById(task.project_id);
  const section = task.section_id ? getSectionById(task.section_id) : undefined;
  const priorityConfig = PRIORITY_CONFIG[task.priority];

  // Due date styling
  const todayStr = new Date().toISOString().split('T')[0];
  const isOverdue = task.due_date && task.due_date < todayStr && !task.completed;
  const isToday = task.due_date === todayStr;

  let dueDateLabel = task.due_date;
  if (isToday) dueDateLabel = 'Today';
  else if (task.due_date) {
    const d = new Date(task.due_date + 'T00:00:00');
    dueDateLabel = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  const completedSubtasks = task.subtasks.filter((s) => s.completed).length;
  const totalSubtasks = task.subtasks.length;

  return (
    <div
      onClick={() => setSelectedTaskId(task.id)}
      className={`group relative flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
        task.completed
          ? 'bg-slate-50/60 dark:bg-slate-900/30 border-slate-200/50 dark:border-slate-800/50 opacity-60'
          : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 shadow-2xs hover:shadow-xs'
      }`}
    >
      {/* Checkbox with priority indicator */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          toggleTaskCompletion(task.id);
        }}
        className={`w-5 h-5 mt-0.5 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
          task.completed
            ? 'bg-slate-400 border-slate-400 text-white dark:bg-slate-600 dark:border-slate-600'
            : 'hover:opacity-80'
        }`}
        style={
          task.completed
            ? {}
            : {
                borderColor: priorityConfig.color,
                backgroundColor: 'transparent',
              }
        }
        title={task.completed ? 'Mark incomplete' : 'Mark complete'}
      >
        {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
      </button>

      {/* Task Content and Meta */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`text-sm leading-snug break-words ${
              task.completed
                ? 'line-through text-slate-400 dark:text-slate-500 font-normal'
                : 'text-slate-850 dark:text-slate-100 font-medium'
            }`}
          >
            {task.content}
          </span>

          {task.is_pinned && (
            <Pin className="w-3.5 h-3.5 text-rose-500 fill-rose-500 shrink-0" />
          )}
        </div>

        {/* Task Description Preview */}
        {task.description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5 font-normal">
            {task.description}
          </p>
        )}

        {/* Meta Pills (Due date, project, section, labels, subtasks, attachments) */}
        <div className="flex flex-wrap items-center gap-1.5 mt-2 text-xs">
          {/* Due date chip */}
          {task.due_date && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium text-[11px] ${
                isOverdue
                  ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400'
                  : isToday
                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              <Calendar className="w-3 h-3" />
              <span>{dueDateLabel}</span>
              {task.due_time && (
                <span className="flex items-center gap-0.5 text-[10px] opacity-80">
                  <Clock className="w-2.5 h-2.5 ml-0.5" />
                  {task.due_time}
                </span>
              )}
              {task.is_recurring && <Repeat className="w-2.5 h-2.5 ml-0.5" />}
            </span>
          )}

          {/* Project & Section Badge */}
          {showProjectBadge && project && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[11px]">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: project.color }}
              />
              <span className="truncate max-w-[120px]">{project.name}</span>
              {section && (
                <>
                  <span className="opacity-40">/</span>
                  <span className="truncate max-w-[100px]">{section.name}</span>
                </>
              )}
            </span>
          )}

          {/* Labels */}
          {task.labels.map((lblId) => {
            const lbl = getLabelById(lblId);
            if (!lbl) return null;
            return (
              <span
                key={lbl.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium"
                style={{
                  backgroundColor: `${lbl.color}15`,
                  color: lbl.color,
                }}
              >
                <span>@{lbl.name}</span>
              </span>
            );
          })}

          {/* Subtasks Count */}
          {totalSubtasks > 0 && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800">
              <CheckSquare className="w-3 h-3" />
              <span>
                {completedSubtasks}/{totalSubtasks}
              </span>
            </span>
          )}

          {/* Attachments */}
          {task.attachments.length > 0 && (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800"
              title={`${task.attachments.length} attachments`}
            >
              <Paperclip className="w-3 h-3" />
              <span>{task.attachments.length}</span>
            </span>
          )}

          {/* Priority indicator if not P4 */}
          {task.priority > 1 && (
            <span
              className="inline-flex items-center gap-0.5 text-[11px] font-medium"
              style={{ color: priorityConfig.color }}
              title={priorityConfig.label}
            >
              <Flag className="w-3 h-3 fill-current" />
            </span>
          )}
        </div>
      </div>

      {/* Hover Action Buttons */}
      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 shrink-0 transition-opacity">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleTaskPin(task.id);
          }}
          className={`p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors ${
            task.is_pinned ? 'text-rose-500' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
          title={task.is_pinned ? 'Unpin' : 'Pin to Pinboard'}
        >
          <Pin className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedTaskId(task.id);
          }}
          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors"
          title="Edit Task"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            deleteTask(task.id);
          }}
          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors"
          title="Delete Task"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
