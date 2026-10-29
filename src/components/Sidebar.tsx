import React, { useState } from 'react';
import {
  Inbox,
  Calendar,
  Clock,
  Tag,
  Pin,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Plus,
  MoreVertical,
  CalendarDays,
  Repeat,
  Layers,
  FileQuestion,
  Star,
  Edit2,
  Trash2,
  Sparkles,
  Cloud,
  RefreshCw,
} from 'lucide-react';
import { usePlanify } from '../context/PlanifyContext';
import { FilterId } from '../types/planify';
import { ProjectIcon } from './ProjectIcon';

export const Sidebar: React.FC = () => {
  const {
    activeView,
    setActiveView,
    projects,
    sidebarOpen,
    getTaskCountForFilter,
    getTaskCountForProject,
    setIsNewProjectOpen,
    setEditingProject,
    deleteProject,
    toggleProjectFavorite,
    items,
    dailyGoal,
    nextcloud,
    isSyncingNextcloud,
    syncNextcloudNow,
  } = usePlanify();

  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  const [projectMenuId, setProjectMenuId] = useState<string | null>(null);

  if (!sidebarOpen) return null;

  const todayDate = new Date().toISOString().split('T')[0];
  const completedTodayCount = items.filter(
    (i) => i.completed && i.completed_at && i.completed_at.startsWith(todayDate)
  ).length;
  const progressPercent = Math.min(Math.round((completedTodayCount / dailyGoal) * 100), 100);

  const mainFilters: { id: FilterId; label: string; icon: React.ReactNode }[] = [
    { id: 'inbox', label: 'Inbox', icon: <Inbox className="w-4 h-4 text-blue-500" /> },
    { id: 'today', label: 'Today', icon: <Calendar className="w-4 h-4 text-emerald-500" /> },
    { id: 'scheduled', label: 'Scheduled', icon: <CalendarDays className="w-4 h-4 text-purple-500" /> },
    { id: 'labels', label: 'Labels', icon: <Tag className="w-4 h-4 text-amber-500" /> },
    { id: 'pinboard', label: 'Pinboard', icon: <Pin className="w-4 h-4 text-rose-500" /> },
    { id: 'completed', label: 'Completed', icon: <CheckCircle2 className="w-4 h-4 text-slate-500" /> },
  ];

  const secondaryFilters: { id: FilterId; label: string; icon: React.ReactNode }[] = [
    { id: 'tomorrow', label: 'Tomorrow', icon: <Clock className="w-4 h-4 text-cyan-500" /> },
    { id: 'anytime', label: 'Anytime', icon: <Layers className="w-4 h-4 text-indigo-500" /> },
    { id: 'repeating', label: 'Repeating', icon: <Repeat className="w-4 h-4 text-teal-500" /> },
    { id: 'unlabeled', label: 'Unlabeled', icon: <FileQuestion className="w-4 h-4 text-stone-500" /> },
    { id: 'all', label: 'All Tasks', icon: <Layers className="w-4 h-4 text-slate-400" /> },
  ];

  const favoriteProjects = projects.filter((p) => p.is_favorite && !p.is_inbox);
  const regularProjects = projects.filter((p) => !p.is_inbox);

  return (
    <aside className="w-64 sm:w-72 h-full border-r border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 flex flex-col shrink-0 select-none overflow-y-auto">
      <div className="p-2 pt-3" />

      {/* Main Navigation Filters */}
      <div className="p-2 space-y-0.5">
        {mainFilters.map((filter) => {
          const isActive = activeView.type === 'filter' && activeView.id === filter.id;
          const count = getTaskCountForFilter(filter.id);

          return (
            <button
              key={filter.id}
              onClick={() => setActiveView({ type: 'filter', id: filter.id })}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 font-medium'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {filter.icon}
                <span className="truncate">{filter.label}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {count > 0 && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      isActive
                        ? 'bg-blue-600 text-white dark:bg-blue-500'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </div>
            </button>
          );
        })}

        {/* More Filters Expandable */}
        <div>
          <button
            onClick={() => setMoreFiltersOpen(!moreFiltersOpen)}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              {moreFiltersOpen ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
              More Views
            </span>
          </button>

          {moreFiltersOpen && (
            <div className="pl-2 space-y-0.5 mt-0.5">
              {secondaryFilters.map((filter) => {
                const isActive = activeView.type === 'filter' && activeView.id === filter.id;
                const count = getTaskCountForFilter(filter.id);
                return (
                  <button
                    key={filter.id}
                    onClick={() => setActiveView({ type: 'filter', id: filter.id })}
                    className={`w-full flex items-center justify-between px-3 py-1 rounded-lg text-xs transition-colors ${
                      isActive
                        ? 'bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 font-medium'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {filter.icon}
                      <span className="truncate">{filter.label}</span>
                    </div>
                    {count > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="h-px bg-slate-200/80 dark:bg-slate-800/80 mx-3 my-1" />

      {/* Favorites Section */}
      {favoriteProjects.length > 0 && (
        <div className="px-2 py-1">
          <div className="px-3 py-1 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
            <span>Favorites</span>
          </div>
          <div className="space-y-0.5">
            {favoriteProjects.map((project) => {
              const isActive = activeView.type === 'project' && activeView.id === project.id;
              const count = getTaskCountForProject(project.id);
              return (
                <button
                  key={project.id}
                  onClick={() => setActiveView({ type: 'project', id: project.id })}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 font-medium'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <ProjectIcon project={project} />
                    <span className="truncate">{project.name}</span>
                  </div>
                  {count > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Projects Section */}
      <div className="px-2 py-1 flex-1">
        <div className="px-3 py-1 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Projects
          </span>
          <button
            onClick={() => setIsNewProjectOpen(true)}
            className="p-1 rounded-md text-slate-500 hover:text-blue-600 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors"
            title="Create Project"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-0.5 relative">
          {regularProjects.map((project) => {
            const isActive = activeView.type === 'project' && activeView.id === project.id;
            const count = getTaskCountForProject(project.id);

            return (
              <div
                key={project.id}
                className="group relative flex items-center justify-between rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors"
              >
                <button
                  onClick={() => setActiveView({ type: 'project', id: project.id })}
                  className={`flex-1 flex items-center gap-2 px-3 py-1.5 text-sm text-left truncate ${
                    isActive
                      ? 'text-blue-600 dark:text-blue-400 font-medium'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <ProjectIcon project={project} />
                  <span className="truncate">{project.name}</span>
                </button>

                <div className="flex items-center gap-1 pr-2">
                  {count > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {count}
                    </span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setProjectMenuId(projectMenuId === project.id ? null : project.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-300/60 dark:hover:bg-slate-700 text-slate-500 transition-opacity"
                    title="Project options"
                  >
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Context Menu */}
                {projectMenuId === project.id && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 top-8 z-30 w-40 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg py-1 text-xs"
                  >
                    <button
                      onClick={() => {
                        setEditingProject(project);
                        setProjectMenuId(null);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Project</span>
                    </button>
                    <button
                      onClick={() => {
                        toggleProjectFavorite(project.id);
                        setProjectMenuId(null);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      <Star className="w-3.5 h-3.5 text-amber-500" />
                      <span>{project.is_favorite ? 'Remove Favorite' : 'Add to Favorites'}</span>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${project.name}" and its tasks?`)) {
                          deleteProject(project.id);
                        }
                        setProjectMenuId(null);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Nextcloud Sync Quick Bar */}
      {nextcloud.enabled && (
        <div className="px-3 py-2 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-100/50 dark:bg-slate-850/50 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 truncate">
            <Cloud className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
            <span className="truncate">Nextcloud Sync</span>
          </div>
          <button
            onClick={() => syncNextcloudNow()}
            disabled={isSyncingNextcloud}
            className="p-1 text-slate-500 hover:text-blue-600 transition-colors disabled:opacity-50"
            title={nextcloud.lastSyncedAt ? `Last synced at ${nextcloud.lastSyncedAt}` : 'Sync with Nextcloud'}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingNextcloud ? 'animate-spin text-blue-500' : ''}`} />
          </button>
        </div>
      )}

      {/* Bottom Mini Productivity Progress Widget */}
      <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/40">
        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-1.5">
          <span className="flex items-center gap-1 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            Daily Goal
          </span>
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {completedTodayCount} / {dailyGoal}
          </span>
        </div>
        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </aside>
  );
};
