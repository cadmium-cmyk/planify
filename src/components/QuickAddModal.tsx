import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Plus,
  Calendar,
  Clock,
  Flag,
  Folder,
  Tag,
  Sparkles,
} from 'lucide-react';
import { usePlanify } from '../context/PlanifyContext';
import { PriorityLevel, PRIORITY_CONFIG } from '../types/planify';
import { getFormattedDate } from '../services/store';

export const QuickAddModal: React.FC = () => {
  const {
    isQuickAddOpen,
    setIsQuickAddOpen,
    projects,
    sections,
    labels,
    addTask,
    activeView,
  } = usePlanify();

  const [rawText, setRawText] = useState('');
  const [description, setDescription] = useState('');
  const [showDescription, setShowDescription] = useState(false);

  // Selected values (can be overridden by NLP or dropdowns)
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<PriorityLevel>(1);
  const [selectedDueDate, setSelectedDueDate] = useState<string | null>(null);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isQuickAddOpen) {
      // Default project: if user is currently viewing a project, use that. Otherwise, use inbox.
      let defaultProj = projects.find((p) => p.is_inbox)?.id || projects[0]?.id || '';
      if (activeView.type === 'project') {
        defaultProj = activeView.id;
      }
      setSelectedProjectId(defaultProj);
      setSelectedSectionId('');
      setSelectedPriority(1);

      // If active view is today or tomorrow, pre-select that date
      if (activeView.type === 'filter' && activeView.id === 'today') {
        setSelectedDueDate(getFormattedDate(0));
      } else if (activeView.type === 'filter' && activeView.id === 'tomorrow') {
        setSelectedDueDate(getFormattedDate(1));
      } else {
        setSelectedDueDate(null);
      }

      setSelectedLabels([]);
      setRawText('');
      setDescription('');
      setShowDescription(false);

      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isQuickAddOpen, activeView, projects]);

  if (!isQuickAddOpen) return null;

  // Natural language parsing as user types
  const handleInputChange = (text: string) => {
    setRawText(text);

    // Parse priority: !p1, !p2, !p3, !p4 or p1, p2
    const priorityMatch = text.match(/(?:^|\s)!?p([1-4])(?:\s|$)/i);
    if (priorityMatch) {
      const pNum = parseInt(priorityMatch[1], 10);
      const mapped = (5 - pNum) as PriorityLevel; // p1 -> 4, p2 -> 3, etc.
      setSelectedPriority(mapped);
    }

    // Parse date: today, tomorrow
    if (/\btoday\b/i.test(text)) {
      setSelectedDueDate(getFormattedDate(0));
    } else if (/\btomorrow\b/i.test(text)) {
      setSelectedDueDate(getFormattedDate(1));
    }

    // Parse #project
    const projMatch = text.match(/(?:^|\s)#([\w-]+)/);
    if (projMatch) {
      const projName = projMatch[1].toLowerCase();
      const found = projects.find((p) => p.name.toLowerCase().includes(projName));
      if (found) setSelectedProjectId(found.id);
    }

    // Parse @label
    const labelMatch = text.match(/(?:^|\s)@([\w-]+)/);
    if (labelMatch) {
      const labelName = labelMatch[1].toLowerCase();
      const found = labels.find((l) => l.name.toLowerCase().includes(labelName));
      if (found && !selectedLabels.includes(found.id)) {
        setSelectedLabels((prev) => [...prev, found.id]);
      }
    }
  };

  const cleanTitle = (text: string): string => {
    return text
      .replace(/(?:^|\s)!?p[1-4](?:\s|$)/gi, ' ')
      .replace(/\b(today|tomorrow)\b/gi, ' ')
      .replace(/(?:^|\s)#[\w-]+/g, ' ')
      .replace(/(?:^|\s)@[\w-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const taskContent = cleanTitle(rawText) || rawText.trim();
    if (!taskContent) return;

    addTask({
      content: taskContent,
      description: description.trim(),
      project_id: selectedProjectId,
      section_id: selectedSectionId || undefined,
      priority: selectedPriority,
      due_date: selectedDueDate,
      labels: selectedLabels,
    });

    setIsQuickAddOpen(false);
  };

  const projectSections = sections.filter((s) => s.project_id === selectedProjectId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={() => setIsQuickAddOpen(false)}
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60">
            <span className="font-semibold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-500" />
              Quick Add Task
            </span>
            <button
              type="button"
              onClick={() => setIsQuickAddOpen(false)}
              className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Inputs */}
          <div className="p-4 space-y-3">
            <div>
              <input
                ref={inputRef}
                type="text"
                placeholder='e.g. Finish report tomorrow #Work !p1 @urgent'
                value={rawText}
                onChange={(e) => handleInputChange(e.target.value)}
                className="w-full text-base font-medium text-slate-900 dark:text-slate-100 bg-transparent outline-none placeholder:text-slate-400"
              />
            </div>

            {showDescription ? (
              <textarea
                rows={2}
                placeholder="Description or notes (optional)..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 resize-none"
              />
            ) : (
              <button
                type="button"
                onClick={() => setShowDescription(true)}
                className="text-xs text-slate-400 hover:text-blue-600 flex items-center gap-1"
              >
                + Add description
              </button>
            )}

            {/* Quick Picker Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              {/* Due Date */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedDueDate(
                      selectedDueDate === getFormattedDate(0) ? null : getFormattedDate(0)
                    )
                  }
                  className={`px-2 py-1 rounded-md border flex items-center gap-1 transition-colors ${
                    selectedDueDate === getFormattedDate(0)
                      ? 'bg-blue-50 border-blue-400 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <Calendar className="w-3 h-3 text-emerald-500" />
                  <span>Today</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedDueDate(
                      selectedDueDate === getFormattedDate(1) ? null : getFormattedDate(1)
                    )
                  }
                  className={`px-2 py-1 rounded-md border flex items-center gap-1 transition-colors ${
                    selectedDueDate === getFormattedDate(1)
                      ? 'bg-blue-50 border-blue-400 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <Clock className="w-3 h-3 text-cyan-500" />
                  <span>Tomorrow</span>
                </button>
              </div>

              {/* Priority Dropdown */}
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(Number(e.target.value) as PriorityLevel)}
                className="text-xs px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 outline-none"
              >
                <option value={4}>🚩 P1 (High)</option>
                <option value={3}>🚩 P2 (Medium)</option>
                <option value={2}>🚩 P3 (Low)</option>
                <option value={1}>⚐ P4 (None)</option>
              </select>

              {/* Project Dropdown */}
              <select
                value={selectedProjectId}
                onChange={(e) => {
                  setSelectedProjectId(e.target.value);
                  setSelectedSectionId('');
                }}
                className="text-xs px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 outline-none"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    📁 {p.name}
                  </option>
                ))}
              </select>

              {/* Section Dropdown if available */}
              {projectSections.length > 0 && (
                <select
                  value={selectedSectionId}
                  onChange={(e) => setSelectedSectionId(e.target.value)}
                  className="text-xs px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 outline-none"
                >
                  <option value="">Section: General</option>
                  {projectSections.map((s) => (
                    <option key={s.id} value={s.id}>
                      Section: {s.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Footer Submit */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
            <span className="text-[11px] text-slate-400">
              Tip: type <code className="font-mono bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">#project</code>, <code className="font-mono bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">!p1</code>, or <code className="font-mono bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">tomorrow</code>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsQuickAddOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!rawText.trim()}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium shadow-xs"
              >
                Add Task
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
