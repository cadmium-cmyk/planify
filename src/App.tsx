import React, { useState } from 'react';
import {
  Plus,
  Inbox,
  Calendar,
  Clock,
  Pin,
  CheckCircle2,
  Layers,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Search,
  FolderPlus,
  Trash2,
  Edit2,
  CalendarDays,
  Repeat,
  FileQuestion,
  Tag,
} from 'lucide-react';
import { usePlanify } from './context/PlanifyContext';
import { HeaderBar } from './components/HeaderBar';
import { Sidebar } from './components/Sidebar';
import { TaskRow } from './components/TaskRow';
import { TaskBoard } from './components/TaskBoard';
import { ScheduledView } from './components/ScheduledView';
import { LabelsView } from './components/LabelsView';
import { TaskDetailModal } from './components/TaskDetailModal';
import { QuickAddModal } from './components/QuickAddModal';
import { ProductivityModal } from './components/ProductivityModal';
import { ProjectModal } from './components/ProjectModal';
import { SettingsModal } from './components/SettingsModal';
import { getFormattedDate } from './services/store';

export const App: React.FC = () => {
  const {
    activeView,
    items,
    projects,
    sections,
    labels,
    searchQuery,
    setSearchQuery,
    setIsQuickAddOpen,
    addTask,
    addSection,
    updateSection,
    deleteSection,
    toggleSectionCollapse,
    deleteProject,
    setEditingProject,
  } = usePlanify();

  const [inlineTaskInput, setInlineTaskInput] = useState('');
  const [inlineSectionInput, setInlineSectionInput] = useState('');
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [activeInlineSectionId, setActiveInlineSectionId] = useState<string | null>(null);

  const todayStr = getFormattedDate(0);
  const tomorrowStr = getFormattedDate(1);

  // If user searched in HeaderBar, filter all tasks
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    const matchingTasks = items.filter(
      (i) =>
        i.content.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.labels.some((lId) => {
          const l = labels.find((lbl) => lbl.id === lId);
          return l && l.name.toLowerCase().includes(q);
        })
    );

    return (
      <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 h-full">
          <HeaderBar />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-4xl mx-auto w-full space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Search className="w-4 h-4 text-blue-500" />
                <span>Search results for "{searchQuery}"</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-normal">
                  {matchingTasks.length} {matchingTasks.length === 1 ? 'task' : 'tasks'}
                </span>
              </h2>
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Clear search
              </button>
            </div>

            {matchingTasks.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <Search className="w-10 h-10 mx-auto opacity-30" />
                <p className="text-sm">No tasks matched your query.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {matchingTasks.map((t) => (
                  <TaskRow key={t.id} task={t} />
                ))}
              </div>
            )}
          </main>
        </div>
        <TaskDetailModal />
        <QuickAddModal />
        <ProductivityModal />
        <ProjectModal />
        <SettingsModal />
      </div>
    );
  }

  // Handle Scheduled view
  if (activeView.type === 'filter' && activeView.id === 'scheduled') {
    return (
      <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 h-full">
          <HeaderBar />
          <ScheduledView />
        </div>
        <TaskDetailModal />
        <QuickAddModal />
        <ProductivityModal />
        <ProjectModal />
        <SettingsModal />
      </div>
    );
  }

  // Handle Labels view
  if (activeView.type === 'filter' && activeView.id === 'labels') {
    return (
      <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 h-full">
          <HeaderBar />
          <LabelsView />
        </div>
        <TaskDetailModal />
        <QuickAddModal />
        <ProductivityModal />
        <ProjectModal />
        <SettingsModal />
      </div>
    );
  }

  // Handle Project View
  if (activeView.type === 'project') {
    const project = projects.find((p) => p.id === activeView.id);
    if (!project) return null;

    if (project.view_mode === 'board') {
      return (
        <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0 h-full">
            <HeaderBar />
            <TaskBoard project={project} tasks={items} sections={sections} />
          </div>
          <TaskDetailModal />
          <QuickAddModal />
          <ProductivityModal />
          <ProjectModal />
          <SettingsModal />
        </div>
      );
    }

    // List view for project
    const projectTasks = items.filter((i) => i.project_id === project.id && !i.completed);
    const completedProjectTasks = items.filter((i) => i.project_id === project.id && i.completed);
    const unsectionedTasks = projectTasks.filter((t) => !t.section_id);
    const projectSections = sections
      .filter((s) => s.project_id === project.id)
      .sort((a, b) => a.order - b.order);

    const handleCreateSection = (e: React.FormEvent) => {
      e.preventDefault();
      if (!inlineSectionInput.trim()) return;
      addSection(project.id, inlineSectionInput.trim());
      setInlineSectionInput('');
      setIsAddingSection(false);
    };

    const handleAddInlineTask = (sectionId?: string) => {
      if (!inlineTaskInput.trim()) return;
      addTask({
        content: inlineTaskInput.trim(),
        project_id: project.id,
        section_id: sectionId,
      });
      setInlineTaskInput('');
      setActiveInlineSectionId(null);
    };

    return (
      <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 h-full">
          <HeaderBar />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-4xl mx-auto w-full space-y-6">
            {/* Project Header Banner */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  {project.emoji && <span className="text-3xl">{project.emoji}</span>}
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: project.color }}
                      />
                      <span>{project.name}</span>
                    </h2>
                    {project.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {project.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setEditingProject(project)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Edit project"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {!project.is_inbox && (
                    <button
                      onClick={() => {
                        if (confirm(`Delete project "${project.name}" and all its tasks?`)) {
                          deleteProject(project.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Delete project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <span>
                  {projectTasks.length} pending, {completedProjectTasks.length} completed
                </span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {projectTasks.length + completedProjectTasks.length > 0
                    ? Math.round(
                        (completedProjectTasks.length /
                          (projectTasks.length + completedProjectTasks.length)) *
                          100
                      )
                    : 0}
                  % done
                </span>
              </div>
            </div>

            {/* Unsectioned Tasks List */}
            {unsectionedTasks.length > 0 && (
              <div className="space-y-2">
                {projectSections.length > 0 && (
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
                    General
                  </h3>
                )}
                {unsectionedTasks.map((t) => (
                  <TaskRow key={t.id} task={t} showProjectBadge={false} />
                ))}
              </div>
            )}

            {/* Sections Accordion */}
            {projectSections.map((sec) => {
              const secTasks = projectTasks.filter((t) => t.section_id === sec.id);

              return (
                <div key={sec.id} className="space-y-2">
                  <div className="flex items-center justify-between py-1 border-b border-slate-200 dark:border-slate-800 group">
                    <button
                      onClick={() => toggleSectionCollapse(sec.id)}
                      className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300"
                    >
                      {sec.collapsed ? (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      <span>{sec.name}</span>
                      <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-normal">
                        {secTasks.length}
                      </span>
                    </button>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setActiveInlineSectionId(sec.id)}
                        className="p-1 rounded text-slate-400 hover:text-blue-600"
                        title="Add task in section"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          const n = prompt('Rename section:', sec.name);
                          if (n && n.trim()) updateSection(sec.id, { name: n.trim() });
                        }}
                        className="p-1 rounded text-slate-400 hover:text-slate-600"
                        title="Rename section"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete section "${sec.name}"? Tasks will stay in project.`)) {
                            deleteSection(sec.id);
                          }
                        }}
                        className="p-1 rounded text-slate-400 hover:text-red-500"
                        title="Delete section"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {!sec.collapsed && (
                    <div className="space-y-2 pl-2">
                      {secTasks.map((t) => (
                        <TaskRow key={t.id} task={t} showProjectBadge={false} />
                      ))}

                      {activeInlineSectionId === sec.id ? (
                        <div className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-blue-400">
                          <input
                            type="text"
                            autoFocus
                            placeholder={`New task in ${sec.name}...`}
                            value={inlineTaskInput}
                            onChange={(e) => setInlineTaskInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleAddInlineTask(sec.id);
                              if (e.key === 'Escape') setActiveInlineSectionId(null);
                            }}
                            className="flex-1 text-xs text-slate-800 dark:text-slate-100 bg-transparent outline-none"
                          />
                          <button
                            onClick={() => handleAddInlineTask(sec.id)}
                            className="px-2.5 py-1 text-xs bg-blue-600 text-white rounded-md font-medium"
                          >
                            Add
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setActiveInlineSectionId(sec.id)}
                          className="w-full py-1.5 flex items-center gap-1.5 text-xs text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg px-2 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Task</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Quick Add at bottom of project */}
            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={() => setIsQuickAddOpen(true)}
                className="flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                <Plus className="w-4 h-4" />
                <span>Add Task to {project.name}</span>
              </button>

              <span className="text-slate-300 dark:text-slate-700">|</span>

              {isAddingSection ? (
                <form onSubmit={handleCreateSection} className="flex items-center gap-2">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Section name..."
                    value={inlineSectionInput}
                    onChange={(e) => setInlineSectionInput(e.target.value)}
                    className="text-xs px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none"
                  />
                  <button
                    type="submit"
                    className="px-2.5 py-1 text-xs bg-blue-600 text-white rounded-md font-medium"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingSection(false)}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setIsAddingSection(true)}
                  className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                >
                  <FolderPlus className="w-4 h-4" />
                  <span>Add Section</span>
                </button>
              )}
            </div>
          </main>
        </div>
        <TaskDetailModal />
        <QuickAddModal />
        <ProductivityModal />
        <ProjectModal />
        <SettingsModal />
      </div>
    );
  }

  // Handle Label Filter View
  if (activeView.type === 'label') {
    const lbl = labels.find((l) => l.id === activeView.id);
    const labelTasks = items.filter((i) => i.labels.includes(activeView.id) && !i.completed);

    return (
      <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 h-full">
          <HeaderBar />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-4xl mx-auto w-full space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <span
                  className="w-3.5 h-3.5 rounded-full"
                  style={{ backgroundColor: lbl?.color }}
                />
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                  @{lbl?.name}
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                  {labelTasks.length}
                </span>
              </div>
              <button
                onClick={() => setIsQuickAddOpen(true)}
                className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add task</span>
              </button>
            </div>

            {labelTasks.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center italic">
                No active tasks with this label.
              </p>
            ) : (
              <div className="space-y-2">
                {labelTasks.map((t) => (
                  <TaskRow key={t.id} task={t} />
                ))}
              </div>
            )}
          </main>
        </div>
        <TaskDetailModal />
        <QuickAddModal />
        <ProductivityModal />
        <ProjectModal />
        <SettingsModal />
      </div>
    );
  }

  // Standard Filters: today, inbox, pinboard, completed, anytime, repeating, unlabeled, all, tomorrow
  const filterId = activeView.id;
  let filterTasks = items.filter((i) => !i.completed);
  let filterTitle = 'Tasks';
  let filterSubtitle = '';

  switch (filterId) {
    case 'inbox': {
      const inboxProj = projects.find((p) => p.is_inbox);
      filterTasks = filterTasks.filter((i) => i.project_id === inboxProj?.id);
      filterTitle = 'Inbox';
      filterSubtitle = 'Direct unorganized thoughts and items';
      break;
    }
    case 'today':
      filterTasks = filterTasks.filter((i) => i.due_date && i.due_date <= todayStr);
      filterTitle = 'Today';
      filterSubtitle = `${new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}`;
      break;
    case 'tomorrow':
      filterTasks = filterTasks.filter((i) => i.due_date === tomorrowStr);
      filterTitle = 'Tomorrow';
      filterSubtitle = 'Tasks prepared for tomorrow';
      break;
    case 'pinboard':
      filterTasks = filterTasks.filter((i) => i.is_pinned);
      filterTitle = 'Pinboard';
      filterSubtitle = 'Pinned priority tasks across all projects';
      break;
    case 'completed':
      filterTasks = items.filter((i) => i.completed);
      filterTitle = 'Completed Tasks';
      filterSubtitle = 'History of completed tasks and accomplishments';
      break;
    case 'anytime':
      filterTasks = filterTasks.filter((i) => !i.due_date);
      filterTitle = 'Anytime';
      filterSubtitle = 'Tasks with no specific deadline';
      break;
    case 'repeating':
      filterTasks = filterTasks.filter((i) => i.is_recurring);
      filterTitle = 'Repeating Tasks';
      filterSubtitle = 'Daily, weekly, and recurring habits';
      break;
    case 'unlabeled':
      filterTasks = filterTasks.filter((i) => i.labels.length === 0);
      filterTitle = 'Unlabeled';
      filterSubtitle = 'Tasks waiting to be tagged';
      break;
    case 'all':
      filterTitle = 'All Active Tasks';
      filterSubtitle = 'Complete overview of all active items';
      break;
  }

  // Overdue count for Today view
  const overdueCountInToday =
    filterId === 'today'
      ? filterTasks.filter((i) => i.due_date && i.due_date < todayStr).length
      : 0;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <HeaderBar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-4xl mx-auto w-full space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                  {filterTitle}
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                  {filterTasks.length}
                </span>
              </div>
              {filterSubtitle && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {filterSubtitle}
                </p>
              )}
            </div>

            {filterId !== 'completed' && (
              <button
                onClick={() => setIsQuickAddOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs sm:text-sm font-medium shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Task</span>
              </button>
            )}
          </div>

          {/* Overdue alert for Today view */}
          {overdueCountInToday > 0 && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between">
              <span>
                You have {overdueCountInToday} overdue {overdueCountInToday === 1 ? 'task' : 'tasks'} carried over into today.
              </span>
            </div>
          )}

          {/* Task List */}
          {filterTasks.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <CheckCircle2 className="w-12 h-12 mx-auto opacity-20 text-blue-500" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {filterId === 'completed' ? 'No completed tasks yet.' : 'All clear! No tasks in this view.'}
              </p>
              {filterId !== 'completed' && (
                <button
                  onClick={() => setIsQuickAddOpen(true)}
                  className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create a task</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filterTasks.map((t) => (
                <TaskRow key={t.id} task={t} />
              ))}
            </div>
          )}
        </main>
      </div>

      <TaskDetailModal />
      <QuickAddModal />
      <ProductivityModal />
      <ProjectModal />
      <SettingsModal />
    </div>
  );
};
