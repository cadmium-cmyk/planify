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
          ? 'bg-slate-50/60 dark:bg-[#2E3440]/60 border-slate-200/50 dark:border-[#4C566A]/50 opacity-60'
          : 'bg-white dark:bg-[#3B4252] border-slate-200 dark:border-[#4C566A] hover:border-[#88C0D0] dark:hover:border-[#88C0D0] shadow-2xs hover:shadow-xs'
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
            ? 'bg-slate-400 border-slate-400 text-white dark:bg-[#4C566A] dark:border-[#4C566A]'
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
                ? 'line-through text-slate-400 dark:text-[#D8DEE9]/60 font-normal'
                : 'text-slate-850 dark:text-[#ECEFF4] font-medium'
            }`}
          >
            {task.content}
          </span>

          {task.is_pinned && (
            <Pin className="w-3.5 h-3.5 text-[#BF616A] fill-[#BF616A] shrink-0" />
          )}
        </div>

        {/* Task Description Preview */}
        {task.description && (
          <p className="text-xs text-slate-500 dark:text-[#D8DEE9] line-clamp-1 mt-0.5 font-normal">
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
                  ? 'bg-red-50 text-[#BF616A] dark:bg-[#BF616A]/20 dark:text-[#BF616A]'
                  : isToday
                  ? 'bg-amber-50 text-[#D08770] dark:bg-[#D08770]/20 dark:text-[#EBCB8B]'
                  : 'bg-slate-100 text-slate-600 dark:bg-[#434C5E] dark:text-[#ECEFF4]'
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
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#434C5E] text-slate-600 dark:text-[#ECEFF4] text-[11px]">
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
                  backgroundColor: `${lbl.color}25`,
                  color: lbl.color,
                }}
              >
                <span>@{lbl.name}</span>
              </span>
            );
          })}

          {/* Subtasks Count */}
          {totalSubtasks > 0 && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] text-slate-500 dark:text-[#D8DEE9] bg-slate-100 dark:bg-[#434C5E]">
              <CheckSquare className="w-3 h-3" />
              <span>
                {completedSubtasks}/{totalSubtasks}
              </span>
            </span>
          )}

          {/* Attachments */}
          {task.attachments.length > 0 && (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] text-slate-500 dark:text-[#D8DEE9] bg-slate-100 dark:bg-[#434C5E]"
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
          className={`p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#434C5E] transition-colors ${
            task.is_pinned ? 'text-[#BF616A]' : 'text-slate-400 dark:text-[#D8DEE9] hover:text-slate-600 dark:hover:text-[#ECEFF4]'
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
          className="p-1.5 rounded-lg text-slate-400 dark:text-[#D8DEE9] hover:text-[#5E81AC] dark:hover:text-[#88C0D0] hover:bg-slate-100 dark:hover:bg-[#434C5E] transition-colors"
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
          className="p-1.5 rounded-lg text-slate-400 dark:text-[#D8DEE9] hover:text-[#BF616A] dark:hover:text-[#BF616A] hover:bg-slate-100 dark:hover:bg-[#434C5E] transition-colors"
          title="Delete Task"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
