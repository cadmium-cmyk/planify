import React, { useState } from 'react';
import {
  X,
  Trash2,
  Calendar,
  Clock,
  Pin,
  Flag,
  Tag,
  Folder,
  Plus,
  CheckSquare,
  Paperclip,
  ExternalLink,
  Repeat,
  Check,
} from 'lucide-react';
import { usePlanify } from '../context/PlanifyContext';
import { PriorityLevel, PRIORITY_CONFIG } from '../types/planify';
import { getFormattedDate } from '../services/store';

export const TaskDetailModal: React.FC = () => {
  const {
    selectedTaskId,
    setSelectedTaskId,
    items,
    projects,
    sections,
    labels,
    updateTask,
    deleteTask,
    toggleTaskCompletion,
    toggleTaskPin,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    addAttachment,
    deleteAttachment,
  } = usePlanify();

  const [newSubtaskContent, setNewSubtaskContent] = useState('');
  const [newAttachmentName, setNewAttachmentName] = useState('');
  const [newAttachmentUrl, setNewAttachmentUrl] = useState('');
  const [isAddingAttachment, setIsAddingAttachment] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'subtasks' | 'attachments'>('details');

  const task = items.find((i) => i.id === selectedTaskId);
  if (!task) return null;

  const currentProject = projects.find((p) => p.id === task.project_id);
  const projectSections = sections.filter((s) => s.project_id === task.project_id);

  const handlePriorityChange = (priority: PriorityLevel) => {
    updateTask(task.id, { priority });
  };

  const handleDatePreset = (offset: number | null) => {
    if (offset === null) {
      updateTask(task.id, { due_date: null, due_time: null });
    } else {
      updateTask(task.id, { due_date: getFormattedDate(offset) });
    }
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskContent.trim()) return;
    addSubtask(task.id, newSubtaskContent.trim());
    setNewSubtaskContent('');
  };

  const handleAddAttachment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAttachmentName.trim() || !newAttachmentUrl.trim()) return;
    addAttachment(task.id, {
      name: newAttachmentName.trim(),
      url: newAttachmentUrl.trim(),
      type: 'link',
    });
    setNewAttachmentName('');
    setNewAttachmentUrl('');
    setIsAddingAttachment(false);
  };

  const toggleLabel = (labelId: string) => {
    const hasLabel = task.labels.includes(labelId);
    const updated = hasLabel
      ? task.labels.filter((id) => id !== labelId)
      : [...task.labels, labelId];
    updateTask(task.id, { labels: updated });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={() => setSelectedTaskId(null)}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60">
          <div className="flex items-center gap-2">
            {/* Completion toggle */}
            <button
              onClick={() => toggleTaskCompletion(task.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                task.completed
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                  task.completed ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-400'
                }`}
              >
                {task.completed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
              </div>
              <span>{task.completed ? 'Completed' : 'Mark Done'}</span>
            </button>

            {/* Pin Toggle */}
            <button
              onClick={() => toggleTaskPin(task.id)}
              className={`p-1.5 rounded-lg border transition-colors ${
                task.is_pinned
                  ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-400'
                  : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
              title="Pin task to Pinboard"
            >
              <Pin className={`w-3.5 h-3.5 ${task.is_pinned ? 'fill-current' : ''}`} />
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => deleteTask(task.id)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Delete Task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSelectedTaskId(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 text-xs font-medium">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-2 px-3 border-b-2 transition-colors ${
              activeTab === 'details'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab('subtasks')}
            className={`py-2 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'subtasks'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <span>Subtasks</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px]">
              {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('attachments')}
            className={`py-2 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'attachments'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <span>Attachments & Links</span>
            {task.attachments.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px]">
                {task.attachments.length}
              </span>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {activeTab === 'details' && (
            <>
              {/* Task Title */}
              <div>
                <input
                  type="text"
                  value={task.content}
                  onChange={(e) => updateTask(task.id, { content: e.target.value })}
                  placeholder="Task title"
                  className="w-full text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100 bg-transparent outline-none border-b border-transparent focus:border-blue-500 pb-1"
                />
              </div>

              {/* Task Description */}
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Description / Markdown Notes
                </label>
                <textarea
                  rows={4}
                  value={task.description}
                  onChange={(e) => updateTask(task.id, { description: e.target.value })}
                  placeholder="Add details, markdown checklists, or context..."
                  className="w-full text-xs sm:text-sm p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 resize-y"
                />
              </div>

              {/* Grid: Priority, Project & Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Priority Selector */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                    <Flag className="w-3.5 h-3.5 text-slate-400" />
                    <span>Priority</span>
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {([4, 3, 2, 1] as PriorityLevel[]).map((p) => {
                      const cfg = PRIORITY_CONFIG[p];
                      const isSelected = task.priority === p;
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => handlePriorityChange(p)}
                          className={`flex flex-col items-center justify-center p-1.5 rounded-lg border text-xs transition-colors ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 font-semibold text-slate-900 dark:text-white'
                              : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <Flag className={`w-3.5 h-3.5 ${cfg.flagColor}`} />
                          <span className="text-[10px] mt-0.5">P{5 - p}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Project & Section Dropdowns */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                    <Folder className="w-3.5 h-3.5 text-slate-400" />
                    <span>Project & Section</span>
                  </label>
                  <div className="space-y-1.5">
                    <select
                      value={task.project_id}
                      onChange={(e) =>
                        updateTask(task.id, {
                          project_id: e.target.value,
                          section_id: undefined,
                        })
                      }
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none"
                    >
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.emoji ? `${p.emoji} ` : ''}
                          {p.name}
                        </option>
                      ))}
                    </select>

                    {projectSections.length > 0 && (
                      <select
                        value={task.section_id || ''}
                        onChange={(e) =>
                          updateTask(task.id, {
                            section_id: e.target.value || undefined,
                          })
                        }
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none"
                      >
                        <option value="">(No Section / General)</option>
                        {projectSections.map((s) => (
                          <option key={s.id} value={s.id}>
                            Section: {s.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </div>

              {/* Due Date & Time Picker */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-500" />
                    Schedule Due Date
                  </span>
                  {task.due_date && (
                    <button
                      onClick={() => handleDatePreset(null)}
                      className="text-[11px] text-slate-500 hover:text-red-600 transition-colors"
                    >
                      Clear Date
                    </button>
                  )}
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  <button
                    type="button"
                    onClick={() => handleDatePreset(0)}
                    className="px-2.5 py-1 rounded-lg text-xs bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 text-slate-700 dark:text-slate-200"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDatePreset(1)}
                    className="px-2.5 py-1 rounded-lg text-xs bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 text-slate-700 dark:text-slate-200"
                  >
                    Tomorrow
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDatePreset(7)}
                    className="px-2.5 py-1 rounded-lg text-xs bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 text-slate-700 dark:text-slate-200"
                  >
                    Next Week
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Date</label>
                    <input
                      type="date"
                      value={task.due_date || ''}
                      onChange={(e) => updateTask(task.id, { due_date: e.target.value || null })}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Time (optional)</label>
                    <input
                      type="time"
                      value={task.due_time || ''}
                      onChange={(e) => updateTask(task.id, { due_time: e.target.value || null })}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 outline-none"
                    />
                  </div>
                </div>

                {/* Recurrence Rule */}
                <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="recurring-checkbox"
                      checked={task.is_recurring}
                      onChange={(e) =>
                        updateTask(task.id, {
                          is_recurring: e.target.checked,
                          recurrence_rule: e.target.checked ? 'daily' : undefined,
                        })
                      }
                      className="rounded text-blue-600"
                    />
                    <label
                      htmlFor="recurring-checkbox"
                      className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1 cursor-pointer"
                    >
                      <Repeat className="w-3.5 h-3.5 text-slate-400" />
                      Recurring Task
                    </label>
                  </div>

                  {task.is_recurring && (
                    <select
                      value={task.recurrence_rule || 'daily'}
                      onChange={(e) => updateTask(task.id, { recurrence_rule: e.target.value })}
                      className="text-xs px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 outline-none"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekdays">Every Weekday</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  )}
                </div>
              </div>

              {/* Labels Picker */}
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  <span>Labels</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {labels.map((lbl) => {
                    const hasLabel = task.labels.includes(lbl.id);
                    return (
                      <button
                        key={lbl.id}
                        type="button"
                        onClick={() => toggleLabel(lbl.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                          hasLabel
                            ? 'border-transparent text-white'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                        }`}
                        style={hasLabel ? { backgroundColor: lbl.color } : {}}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${hasLabel ? 'bg-white' : ''}`}
                          style={!hasLabel ? { backgroundColor: lbl.color } : {}}
                        />
                        <span>{lbl.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {activeTab === 'subtasks' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Checklist & Sub-items</span>
                <span>
                  {task.subtasks.filter((s) => s.completed).length} of {task.subtasks.length} done
                </span>
              </div>

              {/* Subtask list */}
              <div className="space-y-1.5">
                {task.subtasks.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button
                        type="button"
                        onClick={() => toggleSubtask(task.id, sub.id)}
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                          sub.completed
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'border-slate-400 bg-white dark:bg-slate-700'
                        }`}
                      >
                        {sub.completed && <Check className="w-3 h-3 stroke-[3]" />}
                      </button>
                      <span
                        className={`text-xs ${
                          sub.completed
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {sub.content}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => deleteSubtask(task.id, sub.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add subtask form */}
              <form onSubmit={handleAddSubtask} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a subtask..."
                  value={newSubtaskContent}
                  onChange={(e) => setNewSubtaskContent(e.target.value)}
                  className="flex-1 text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={!newSubtaskContent.trim()}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium"
                >
                  Add Subtask
                </button>
              </form>
            </div>
          )}

          {activeTab === 'attachments' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Links & Reference Files</span>
                <button
                  onClick={() => setIsAddingAttachment(true)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Link</span>
                </button>
              </div>

              {isAddingAttachment && (
                <form
                  onSubmit={handleAddAttachment}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2"
                >
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Label / Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Design Spec Document"
                      value={newAttachmentName}
                      onChange={(e) => setNewAttachmentName(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">URL / Link</label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={newAttachmentUrl}
                      onChange={(e) => setNewAttachmentUrl(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingAttachment(false)}
                      className="px-2.5 py-1 text-xs text-slate-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!newAttachmentName || !newAttachmentUrl}
                      className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-medium"
                    >
                      Save Attachment
                    </button>
                  </div>
                </form>
              )}

              {/* Attachments list */}
              <div className="space-y-1.5">
                {task.attachments.length === 0 && !isAddingAttachment && (
                  <p className="text-xs text-slate-400 italic py-2">No attachments or links added yet.</p>
                )}

                {task.attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 group"
                  >
                    <a
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 hover:underline min-w-0"
                    >
                      <Paperclip className="w-3.5 h-3.5 shrink-0" />
                      <span className="font-medium truncate">{att.name}</span>
                      <ExternalLink className="w-3 h-3 shrink-0 opacity-70" />
                    </a>

                    <button
                      onClick={() => deleteAttachment(task.id, att.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
