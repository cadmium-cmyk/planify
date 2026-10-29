import React, { useState } from 'react';
import { Plus, MoreHorizontal, Edit2, Trash2, ChevronRight } from 'lucide-react';
import { Project, Section, Item } from '../types/planify';
import { usePlanify } from '../context/PlanifyContext';
import { TaskRow } from './TaskRow';

interface TaskBoardProps {
  project: Project;
  tasks: Item[];
  sections: Section[];
}

export const TaskBoard: React.FC<TaskBoardProps> = ({ project, tasks, sections }) => {
  const {
    addTask,
    addSection,
    updateSection,
    deleteSection,
    moveTaskToSection,
    setSelectedTaskId,
  } = usePlanify();

  const [newSectionName, setNewSectionName] = useState('');
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [quickTaskContent, setQuickTaskContent] = useState<Record<string, string>>({});
  const [activeTaskInputSection, setActiveTaskInputSection] = useState<string | null>(null);

  // Filter tasks belonging to project
  const projectTasks = tasks.filter((t) => t.project_id === project.id && !t.completed);

  // Group into columns
  const unsectionedTasks = projectTasks.filter((t) => !t.section_id);
  const projectSections = sections
    .filter((s) => s.project_id === project.id)
    .sort((a, b) => a.order - b.order);

  const handleCreateSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectionName.trim()) return;
    addSection(project.id, newSectionName.trim());
    setNewSectionName('');
    setIsAddingSection(false);
  };

  const handleQuickAddTask = (sectionId?: string) => {
    const key = sectionId || 'no_section';
    const content = quickTaskContent[key]?.trim();
    if (!content) return;

    addTask({
      content,
      project_id: project.id,
      section_id: sectionId,
    });

    setQuickTaskContent((prev) => ({ ...prev, [key]: '' }));
    setActiveTaskInputSection(null);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetSectionId?: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      moveTaskToSection(taskId, targetSectionId);
    }
  };

  return (
    <div className="flex-1 overflow-x-auto p-4 sm:p-6 flex items-start gap-4 h-[calc(100vh-3.5rem)]">
      {/* "No Section" Column if any tasks or sections exist */}
      {(unsectionedTasks.length > 0 || projectSections.length === 0) && (
        <div
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, undefined)}
          className="w-72 sm:w-80 shrink-0 flex flex-col max-h-full rounded-2xl bg-slate-100/80 dark:bg-[#3B4252] border border-slate-200/80 dark:border-[#4C566A] p-3"
        >
          {/* Column Header */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/60 dark:border-[#4C566A]">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs uppercase tracking-wider text-slate-700 dark:text-[#ECEFF4]">
                General
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-[#434C5E] text-slate-600 dark:text-[#ECEFF4] font-medium">
                {unsectionedTasks.length}
              </span>
            </div>
            <button
              onClick={() => setActiveTaskInputSection('no_section')}
              className="p-1 rounded-md hover:bg-slate-200/60 dark:hover:bg-[#434C5E] text-slate-500 dark:text-[#D8DEE9] hover:text-[#5E81AC] dark:hover:text-[#88C0D0] transition-colors"
              title="Add task to General"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Task List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {unsectionedTasks.map((task) => (
              <div
                key={task.id}
                draggable
                onDragStart={(e) => handleDragStart(e, task.id)}
                className="cursor-grab active:cursor-grabbing"
              >
                <TaskRow task={task} showProjectBadge={false} />
              </div>
            ))}

            {/* Quick add input in column */}
            {activeTaskInputSection === 'no_section' ? (
              <div className="bg-white dark:bg-[#2E3440] p-2 rounded-xl border border-[#88C0D0] shadow-sm">
                <input
                  type="text"
                  autoFocus
                  placeholder="Task title..."
                  value={quickTaskContent['no_section'] || ''}
                  onChange={(e) =>
                    setQuickTaskContent((prev) => ({ ...prev, no_section: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleQuickAddTask(undefined);
                    if (e.key === 'Escape') setActiveTaskInputSection(null);
                  }}
                  className="w-full text-xs text-slate-800 dark:text-[#ECEFF4] bg-transparent outline-none"
                />
                <div className="flex items-center justify-end gap-1.5 mt-2">
                  <button
                    onClick={() => setActiveTaskInputSection(null)}
                    className="px-2 py-1 text-xs text-slate-500 dark:text-[#D8DEE9] hover:text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleQuickAddTask(undefined)}
                    className="px-2.5 py-1 text-xs bg-[#5E81AC] text-white rounded-md font-medium"
                  >
                    Add
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setActiveTaskInputSection('no_section')}
                className="w-full py-2 flex items-center justify-center gap-1 text-xs font-medium text-slate-500 dark:text-[#D8DEE9] hover:text-[#5E81AC] dark:hover:text-[#88C0D0] hover:bg-slate-200/50 dark:hover:bg-[#434C5E] rounded-xl transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Task</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Sections Columns */}
      {projectSections.map((section) => {
        const sectionTasks = projectTasks.filter((t) => t.section_id === section.id);

        return (
          <div
            key={section.id}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, section.id)}
            className="w-72 sm:w-80 shrink-0 flex flex-col max-h-full rounded-2xl bg-slate-100/80 dark:bg-[#3B4252] border border-slate-200/80 dark:border-[#4C566A] p-3"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/60 dark:border-[#4C566A]">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-semibold text-xs uppercase tracking-wider text-slate-700 dark:text-[#ECEFF4] truncate">
                  {section.name}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-[#434C5E] text-slate-600 dark:text-[#ECEFF4] font-medium">
                  {sectionTasks.length}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveTaskInputSection(section.id)}
                  className="p-1 rounded-md hover:bg-slate-200/60 dark:hover:bg-[#434C5E] text-slate-500 dark:text-[#D8DEE9] hover:text-[#5E81AC] dark:hover:text-[#88C0D0] transition-colors"
                  title="Add task to section"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    const newName = prompt('Rename section:', section.name);
                    if (newName && newName.trim()) {
                      updateSection(section.id, { name: newName.trim() });
                    }
                  }}
                  className="p-1 rounded-md hover:bg-slate-200/60 dark:hover:bg-[#434C5E] text-slate-500 dark:text-[#D8DEE9] hover:text-slate-700 dark:hover:text-[#ECEFF4] transition-colors"
                  title="Rename section"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete section "${section.name}"? Tasks will become unsectioned.`)) {
                      deleteSection(section.id);
                    }
                  }}
                  className="p-1 rounded-md hover:bg-slate-200/60 dark:hover:bg-[#434C5E] text-slate-500 dark:text-[#D8DEE9] hover:text-[#BF616A] transition-colors"
                  title="Delete section"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Task List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {sectionTasks.map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  className="cursor-grab active:cursor-grabbing"
                >
                  <TaskRow task={task} showProjectBadge={false} />
                </div>
              ))}

              {/* Quick add in section */}
              {activeTaskInputSection === section.id ? (
                <div className="bg-white dark:bg-[#2E3440] p-2 rounded-xl border border-[#88C0D0] shadow-sm">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Task title..."
                    value={quickTaskContent[section.id] || ''}
                    onChange={(e) =>
                      setQuickTaskContent((prev) => ({ ...prev, [section.id]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleQuickAddTask(section.id);
                      if (e.key === 'Escape') setActiveTaskInputSection(null);
                    }}
                    className="w-full text-xs text-slate-800 dark:text-[#ECEFF4] bg-transparent outline-none"
                  />
                  <div className="flex items-center justify-end gap-1.5 mt-2">
                    <button
                      onClick={() => setActiveTaskInputSection(null)}
                      className="px-2 py-1 text-xs text-slate-500 dark:text-[#D8DEE9] hover:text-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleQuickAddTask(section.id)}
                      className="px-2.5 py-1 text-xs bg-[#5E81AC] text-white rounded-md font-medium"
                    >
                      Add
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setActiveTaskInputSection(section.id)}
                  className="w-full py-2 flex items-center justify-center gap-1 text-xs font-medium text-slate-500 dark:text-[#D8DEE9] hover:text-[#5E81AC] dark:hover:text-[#88C0D0] hover:bg-slate-200/50 dark:hover:bg-[#434C5E] rounded-xl transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Task</span>
                </button>
              )}
            </div>
          </div>
        );
      })}

      {/* Add New Section Column */}
      <div className="w-72 sm:w-80 shrink-0">
        {isAddingSection ? (
          <form
            onSubmit={handleCreateSection}
            className="rounded-2xl bg-white dark:bg-[#3B4252] border border-slate-200 dark:border-[#4C566A] p-3 shadow-xs"
          >
            <input
              type="text"
              autoFocus
              placeholder="Section name..."
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              className="w-full text-xs sm:text-sm px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#4C566A] bg-slate-50 dark:bg-[#2E3440] text-slate-800 dark:text-[#ECEFF4] outline-none focus:border-[#88C0D0]"
            />
            <div className="flex items-center justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={() => {
                  setIsAddingSection(false);
                  setNewSectionName('');
                }}
                className="px-3 py-1 text-xs text-slate-600 dark:text-[#D8DEE9] hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 text-xs bg-[#5E81AC] hover:bg-[#81A1C1] text-white font-medium rounded-lg"
              >
                Add Section
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsAddingSection(true)}
            className="w-full py-3 px-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-[#4C566A] text-slate-500 dark:text-[#D8DEE9] hover:text-[#5E81AC] dark:hover:text-[#88C0D0] hover:border-[#88C0D0] dark:hover:border-[#88C0D0] flex items-center justify-center gap-2 text-xs sm:text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Section</span>
          </button>
        )}
      </div>
    </div>
  );
};
