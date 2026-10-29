import React from 'react';
import {
  Menu,
  Plus,
  Search,
  LayoutList,
  Kanban,
  BarChart3,
  Sun,
  Moon,
  CloudMoon,
  Settings,
  X,
  RefreshCw,
  Calendar,
} from 'lucide-react';
import { usePlanify } from '../context/PlanifyContext';
import { ProjectIcon } from './ProjectIcon';

export const HeaderBar: React.FC = () => {
  const {
    activeView,
    projects,
    labels,
    searchQuery,
    setSearchQuery,
    sidebarOpen,
    setSidebarOpen,
    setIsQuickAddOpen,
    setIsProductivityOpen,
    setIsSettingsOpen,
    setProjectViewMode,
    appearance,
    setAppearance,
    caldav,
    isSyncingCaldav,
    syncCaldavNow,
  } = usePlanify();

  let currentTitle = 'Tasks';
  let isProjectView = false;
  let currentProject = null;

  if (activeView.type === 'filter') {
    const titles: Record<string, string> = {
      inbox: 'Inbox',
      today: 'Today',
      tomorrow: 'Tomorrow',
      scheduled: 'Scheduled',
      labels: 'Labels',
      pinboard: 'Pinboard',
      completed: 'Completed',
      anytime: 'Anytime',
      repeating: 'Repeating',
      unlabeled: 'Unlabeled',
      all: 'All Tasks',
    };
    currentTitle = titles[activeView.id] || 'Tasks';
  } else if (activeView.type === 'project') {
    isProjectView = true;
    currentProject = projects.find((p) => p.id === activeView.id);
    currentTitle = currentProject ? currentProject.name : 'Project';
  } else if (activeView.type === 'label') {
    const lbl = labels.find((l) => l.id === activeView.id);
    currentTitle = lbl ? `@${lbl.name}` : 'Label';
  }

  const cycleAppearance = () => {
    if (appearance === 'light') setAppearance('dark');
    else if (appearance === 'dark') setAppearance('dark-blue');
    else setAppearance('light');
  };

  return (
    <header className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-3 sm:px-4 flex items-center justify-between gap-2 shrink-0 select-none z-20">
      {/* Left: Sidebar toggle & Title */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          title="Toggle Sidebar"
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 truncate">
          {currentProject && <ProjectIcon project={currentProject} className="w-5 h-5" />}
          <h1 className="font-semibold text-base sm:text-lg text-slate-800 dark:text-slate-100 truncate">
            {currentTitle}
          </h1>
        </div>

        {/* List / Board switcher for projects */}
        {isProjectView && currentProject && (
          <div className="hidden sm:flex items-center ml-2 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs">
            <button
              onClick={() => setProjectViewMode(currentProject.id, 'list')}
              className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
                currentProject.view_mode === 'list'
                  ? 'bg-white dark:bg-slate-700 font-medium text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="List View"
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
            <button
              onClick={() => setProjectViewMode(currentProject.id, 'board')}
              className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
                currentProject.view_mode === 'board'
                  ? 'bg-white dark:bg-slate-700 font-medium text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Board (Kanban) View"
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Board</span>
            </button>
          </div>
        )}
      </div>

      {/* Middle: Search bar */}
      <div className="flex-1 max-w-md mx-2 relative hidden md:block">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            id="planify-quick-find"
            type="text"
            placeholder="Quick Find tasks... (Ctrl+K)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 text-xs sm:text-sm rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 transition-all outline-hidden"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Productivity Report */}
        <button
          onClick={() => setIsProductivityOpen(true)}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Productivity Summary"
        >
          <BarChart3 className="w-4 h-4" />
        </button>

        {/* Appearance Toggle */}
        <button
          onClick={cycleAppearance}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={`Appearance: ${appearance === 'dark-blue' ? 'Nord Blue' : appearance}`}
        >
          {appearance === 'light' && <Sun className="w-4 h-4 text-amber-500" />}
          {appearance === 'dark' && <Moon className="w-4 h-4 text-blue-400" />}
          {appearance === 'dark-blue' && <CloudMoon className="w-4 h-4 text-cyan-400" />}
        </button>

        {/* Preferences / Settings */}
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Settings & Accounts Sync"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
