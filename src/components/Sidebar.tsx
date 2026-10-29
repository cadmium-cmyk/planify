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
    caldav,
    isSyncingCaldav,
    syncCaldavNow,
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
    { id: 'inbox', label: 'Inbox', icon: <Inbox className="w-4 h-4 text-[#88C0D0]" /> },
    { id: 'today', label: 'Today', icon: <Calendar className="w-4 h-4 text-[#A3BE8C]" /> },
    { id: 'scheduled', label: 'Scheduled', icon: <CalendarDays className="w-4 h-4 text-[#B48EAD]" /> },
    { id: 'labels', label: 'Labels', icon: <Tag className="w-4 h-4 text-[#EBCB8B]" /> },
    { id: 'pinboard', label: 'Pinboard', icon: <Pin className="w-4 h-4 text-[#BF616A]" /> },
    { id: 'completed', label: 'Completed', icon: <CheckCircle2 className="w-4 h-4 text-slate-500 dark:text-[#D8DEE9]" /> },
  ];

  const secondaryFilters: { id: FilterId; label: string; icon: React.ReactNode }[] = [
    { id: 'tomorrow', label: 'Tomorrow', icon: <Clock className="w-4 h-4 text-[#8FBCBB]" /> },
    { id: 'anytime', label: 'Anytime', icon: <Layers className="w-4 h-4 text-[#81A1C1]" /> },
    { id: 'repeating', label: 'Repeating', icon: <Repeat className="w-4 h-4 text-[#8FBCBB]" /> },
    { id: 'unlabeled', label: 'Unlabeled', icon: <FileQuestion className="w-4 h-4 text-[#D8DEE9]" /> },
    { id: 'all', label: 'All Tasks', icon: <Layers className="w-4 h-4 text-slate-400 dark:text-[#D8DEE9]" /> },
  ];

  const favoriteProjects = projects.filter((p) => p.is_favorite && !p.is_inbox);
  const regularProjects = projects.filter((p) => !p.is_inbox);

  return (
    <aside className="w-64 sm:w-72 h-full border-r border-slate-200 dark:border-[#4C566A] bg-slate-50/90 dark:bg-[#2E3440] flex flex-col shrink-0 select-none overflow-y-auto transition-colors">
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
                  ? 'bg-[#5E81AC]/15 text-[#5E81AC] dark:bg-[#88C0D0]/20 dark:text-[#88C0D0] font-semibold'
                  : 'text-slate-700 dark:text-[#D8DEE9] hover:bg-slate-200/60 dark:hover:bg-[#3B4252]'
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
                        ? 'bg-[#5E81AC] text-white dark:bg-[#88C0D0] dark:text-[#2E3440]'
                        : 'bg-slate-200 dark:bg-[#434C5E] text-slate-600 dark:text-[#E5E9F0]'
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
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-[#D8DEE9] dark:hover:text-[#ECEFF4] transition-colors"
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
                        ? 'bg-[#5E81AC]/15 text-[#5E81AC] dark:bg-[#88C0D0]/20 dark:text-[#88C0D0] font-semibold'
                        : 'text-slate-600 dark:text-[#D8DEE9] hover:bg-slate-200/60 dark:hover:bg-[#3B4252]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {filter.icon}
                      <span className="truncate">{filter.label}</span>
                    </div>
                    {count > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-[#434C5E] text-slate-600 dark:text-[#ECEFF4]">
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

      <div className="h-px bg-slate-200/80 dark:bg-[#4C566A] mx-3 my-1" />

      {/* Favorites Section */}
      {favoriteProjects.length > 0 && (
        <div className="px-2 py-1">
          <div className="px-3 py-1 text-xs font-semibold text-slate-500 dark:text-[#D8DEE9] uppercase tracking-wider flex items-center gap-1.5">
            <Star className="w-3 h-3 text-[#EBCB8B] fill-[#EBCB8B]" />
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
                      ? 'bg-[#5E81AC]/15 text-[#5E81AC] dark:bg-[#88C0D0]/20 dark:text-[#88C0D0] font-semibold'
                      : 'text-slate-700 dark:text-[#ECEFF4] hover:bg-slate-200/60 dark:hover:bg-[#3B4252]'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <ProjectIcon project={project} />
                    <span className="truncate">{project.name}</span>
                  </div>
                  {count > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-[#434C5E] text-slate-600 dark:text-[#ECEFF4]">
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
          <span className="text-xs font-semibold text-slate-500 dark:text-[#D8DEE9] uppercase tracking-wider">
            Projects
          </span>
          <button
            onClick={() => setIsNewProjectOpen(true)}
            className="p-1 rounded-md text-slate-500 dark:text-[#D8DEE9] hover:text-[#5E81AC] dark:hover:text-[#88C0D0] hover:bg-slate-200/60 dark:hover:bg-[#3B4252] transition-colors"
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
                className="group relative flex items-center justify-between rounded-lg hover:bg-slate-200/60 dark:hover:bg-[#3B4252] transition-colors"
              >
                <button
                  onClick={() => setActiveView({ type: 'project', id: project.id })}
                  className={`flex-1 flex items-center gap-2 px-3 py-1.5 text-sm text-left truncate ${
                    isActive
                      ? 'text-[#5E81AC] dark:text-[#88C0D0] font-semibold'
                      : 'text-slate-700 dark:text-[#ECEFF4]'
                  }`}
                >
                  <ProjectIcon project={project} />
                  <span className="truncate">{project.name}</span>
                </button>

                <div className="flex items-center gap-1 pr-2">
                  {count > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-[#434C5E] text-slate-600 dark:text-[#ECEFF4]">
                      {count}
                    </span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setProjectMenuId(projectMenuId === project.id ? null : project.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-300/60 dark:hover:bg-[#434C5E] text-slate-500 dark:text-[#D8DEE9] transition-opacity"
                    title="Project options"
                  >
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Context Menu */}
                {projectMenuId === project.id && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 top-8 z-30 w-40 bg-white dark:bg-[#3B4252] border border-slate-200 dark:border-[#4C566A] rounded-lg shadow-lg py-1 text-xs"
                  >
                    <button
                      onClick={() => {
                        setEditingProject(project);
                        setProjectMenuId(null);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-slate-700 dark:text-[#ECEFF4] hover:bg-slate-100 dark:hover:bg-[#434C5E]"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Project</span>
                    </button>
                    <button
                      onClick={() => {
                        toggleProjectFavorite(project.id);
                        setProjectMenuId(null);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-slate-700 dark:text-[#ECEFF4] hover:bg-slate-100 dark:hover:bg-[#434C5E]"
                    >
                      <Star className="w-3.5 h-3.5 text-[#EBCB8B]" />
                      <span>{project.is_favorite ? 'Remove Favorite' : 'Add to Favorites'}</span>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${project.name}" and its tasks?`)) {
                          deleteProject(project.id);
                        }
                        setProjectMenuId(null);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-[#BF616A] dark:text-[#BF616A] hover:bg-red-50 dark:hover:bg-[#BF616A]/20"
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

      {/* CalDAV / Account Sync Status */}
      {caldav.enabled && (
        <div
          onClick={() => syncCaldavNow()}
          className="px-3 py-2 border-t border-slate-200/80 dark:border-[#4C566A] bg-slate-100/60 dark:bg-[#3B4252] flex items-center justify-between text-xs cursor-pointer hover:bg-slate-200/60 dark:hover:bg-[#434C5E] transition-colors"
          title={caldav.lastSyncedAt ? `Click to sync. Last synced: ${caldav.lastSyncedAt}` : 'Click to sync now'}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="relative flex items-center justify-center shrink-0">
              <span className={`w-2 h-2 rounded-full ${isSyncingCaldav ? 'bg-amber-400 animate-ping' : 'bg-emerald-500'}`} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-slate-800 dark:text-[#ECEFF4] truncate text-[11px]">
                {caldav.providerPreset === 'gnome' ? 'GNOME Account' :
                 caldav.providerPreset === 'android' ? 'Android Account' :
                 caldav.providerPreset === 'nextcloud' ? 'Nextcloud Sync' :
                 caldav.providerPreset === 'google' ? 'Google Sync' : 'CalDAV Sync'}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-[#D8DEE9] truncate">
                {isSyncingCaldav ? 'Syncing now...' : caldav.lastSyncedAt ? `Synced ${caldav.lastSyncedAt}` : 'Auto-sync active'}
              </span>
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              syncCaldavNow();
            }}
            disabled={isSyncingCaldav}
            className="p-1 rounded text-slate-500 dark:text-[#D8DEE9] hover:text-[#88C0D0] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingCaldav ? 'animate-spin text-[#88C0D0]' : ''}`} />
          </button>
        </div>
      )}

      {/* Bottom Mini Productivity Progress Widget */}
      <div className="p-3 border-t border-slate-200/80 dark:border-[#4C566A] bg-white/50 dark:bg-[#3B4252]/40">
        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-[#D8DEE9] mb-1.5">
          <span className="flex items-center gap-1 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-[#88C0D0]" />
            Daily Goal
          </span>
          <span className="font-semibold text-slate-700 dark:text-[#ECEFF4]">
            {completedTodayCount} / {dailyGoal}
          </span>
        </div>
        <div className="w-full h-1.5 bg-slate-200 dark:bg-[#434C5E] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#5E81AC] dark:bg-[#88C0D0] transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </aside>
  );
};
