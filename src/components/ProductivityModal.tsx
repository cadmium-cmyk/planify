import React from 'react';
import {
  X,
  Award,
  CheckCircle2,
  ListTodo,
  AlertTriangle,
  Flame,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { usePlanify } from '../context/PlanifyContext';
import { getFormattedDate } from '../services/store';

export const ProductivityModal: React.FC = () => {
  const {
    isProductivityOpen,
    setIsProductivityOpen,
    items,
    dailyGoal,
    toggleTaskCompletion,
  } = usePlanify();

  if (!isProductivityOpen) return null;

  const todayStr = getFormattedDate(0);
  const totalTasks = items.length;
  const completedTasks = items.filter((i) => i.completed);
  const pendingTasks = items.filter((i) => !i.completed);
  const overdueTasks = items.filter((i) => !i.completed && i.due_date && i.due_date < todayStr);

  const completedTodayCount = items.filter(
    (i) => i.completed && i.completed_at && i.completed_at.startsWith(todayStr)
  ).length;

  const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;
  const todayProgressRate = Math.min(Math.round((completedTodayCount / dailyGoal) * 100), 100);

  // Generate 28-day heatmap (4 weeks)
  const heatmapDays = Array.from({ length: 28 }).map((_, idx) => {
    const daysAgo = 27 - idx;
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    const dateStr = d.toISOString().split('T')[0];
    const count = items.filter(
      (i) => i.completed && i.completed_at && i.completed_at.startsWith(dateStr)
    ).length;

    let intensityClass = 'bg-slate-100 dark:bg-slate-800 text-slate-400';
    if (count >= 5) intensityClass = 'bg-emerald-600 text-white';
    else if (count >= 3) intensityClass = 'bg-emerald-500 text-white';
    else if (count >= 1) intensityClass = 'bg-emerald-400 dark:bg-emerald-700 text-white';

    return {
      dateStr,
      dayNum: d.getDate(),
      count,
      intensityClass,
      isToday: daysAgo === 0,
    };
  });

  // Calculate streak: consecutive days with at least 1 completed task
  let currentStreak = 0;
  for (let d = 0; d < 30; d++) {
    const checkDate = getFormattedDate(-d);
    const doneOnDay = items.some(
      (i) => i.completed && i.completed_at && i.completed_at.startsWith(checkDate)
    );
    if (doneOnDay) {
      currentStreak++;
    } else if (d > 0) {
      break;
    }
  }

  // Recent 10 completed tasks
  const recentCompleted = [...completedTasks]
    .sort((a, b) => (b.completed_at || '').localeCompare(a.completed_at || ''))
    .slice(0, 10);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={() => setIsProductivityOpen(false)}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#3B4252] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#4C566A] max-h-[90vh] flex flex-col overflow-hidden transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-[#4C566A] bg-slate-50/60 dark:bg-[#2E3440]">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-[#5E81AC] dark:text-[#88C0D0]" />
            <h2 className="font-bold text-base text-slate-800 dark:text-[#ECEFF4]">
              Productivity & Analytics
            </h2>
          </div>
          <button
            onClick={() => setIsProductivityOpen(false)}
            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-[#ECEFF4]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Top 4 Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#2E3440] border border-slate-200/80 dark:border-[#4C566A] flex flex-col">
              <span className="text-xs text-slate-500 dark:text-[#D8DEE9] flex items-center gap-1">
                <ListTodo className="w-3.5 h-3.5 text-[#88C0D0]" /> Total
              </span>
              <span className="text-xl font-bold text-slate-800 dark:text-[#ECEFF4] mt-1">
                {totalTasks}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#2E3440] border border-slate-200/80 dark:border-[#4C566A] flex flex-col">
              <span className="text-xs text-slate-500 dark:text-[#D8DEE9] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#A3BE8C]" /> Completed
              </span>
              <span className="text-xl font-bold text-[#A3BE8C] dark:text-[#A3BE8C] mt-1">
                {completedTasks.length}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#2E3440] border border-slate-200/80 dark:border-[#4C566A] flex flex-col">
              <span className="text-xs text-slate-500 dark:text-[#D8DEE9] flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-[#EBCB8B]" /> Streak
              </span>
              <span className="text-xl font-bold text-[#D08770] dark:text-[#EBCB8B] mt-1">
                {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#2E3440] border border-slate-200/80 dark:border-[#4C566A] flex flex-col">
              <span className="text-xs text-slate-500 dark:text-[#D8DEE9] flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-[#BF616A]" /> Overdue
              </span>
              <span className="text-xl font-bold text-[#BF616A] dark:text-[#BF616A] mt-1">
                {overdueTasks.length}
              </span>
            </div>
          </div>

          {/* Goal Ring & Completion Rate */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-[#4C566A] bg-slate-50/50 dark:bg-[#2E3440] flex items-center gap-4">
              <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="26"
                    stroke="currentColor"
                    strokeWidth="5"
                    className="text-slate-200 dark:text-[#434C5E]"
                    fill="transparent"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="26"
                    stroke="currentColor"
                    strokeWidth="5"
                    className="text-[#88C0D0] transition-all duration-500"
                    fill="transparent"
                    strokeDasharray={163.36}
                    strokeDashoffset={163.36 - (163.36 * todayProgressRate) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-xs font-bold text-slate-800 dark:text-[#ECEFF4]">
                  {todayProgressRate}%
                </span>
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-800 dark:text-[#ECEFF4] flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#88C0D0]" /> Today's Target
                </span>
                <p className="text-xs text-slate-500 dark:text-[#D8DEE9] mt-0.5">
                  {completedTodayCount} of {dailyGoal} tasks accomplished today
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-[#4C566A] bg-slate-50/50 dark:bg-[#2E3440] flex items-center gap-4">
              <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="26"
                    stroke="currentColor"
                    strokeWidth="5"
                    className="text-slate-200 dark:text-[#434C5E]"
                    fill="transparent"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="26"
                    stroke="currentColor"
                    strokeWidth="5"
                    className="text-[#A3BE8C] transition-all duration-500"
                    fill="transparent"
                    strokeDasharray={163.36}
                    strokeDashoffset={163.36 - (163.36 * completionRate) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-xs font-bold text-slate-800 dark:text-[#ECEFF4]">
                  {completionRate}%
                </span>
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-800 dark:text-[#ECEFF4]">
                  Overall Completion
                </span>
                <p className="text-xs text-slate-500 dark:text-[#D8DEE9] mt-0.5">
                  {completedTasks.length} done across all projects
                </p>
              </div>
            </div>
          </div>

          {/* 4-Week Activity HeatMap */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-[#4C566A] bg-slate-50/50 dark:bg-[#2E3440]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-800 dark:text-[#ECEFF4]">
                4-Week Activity Heatmap
              </span>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-[#D8DEE9]">
                <span>Less</span>
                <span className="w-2.5 h-2.5 rounded-sm bg-slate-200 dark:bg-[#434C5E]" />
                <span className="w-2.5 h-2.5 rounded-sm bg-[#8FBCBB]" />
                <span className="w-2.5 h-2.5 rounded-sm bg-[#A3BE8C]" />
                <span>More</span>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {heatmapDays.map((d) => (
                <div
                  key={d.dateStr}
                  title={`${d.dateStr}: ${d.count} tasks completed`}
                  className={`h-9 rounded-lg flex flex-col items-center justify-center text-[10px] font-medium transition-all ${
                    d.intensityClass
                  } ${d.isToday ? 'ring-2 ring-[#88C0D0] ring-offset-1' : ''}`}
                >
                  <span>{d.dayNum}</span>
                  {d.count > 0 && <span className="text-[9px] opacity-80">✓{d.count}</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Recent Completed Tasks with Restore */}
          <div>
            <h3 className="text-xs font-semibold text-slate-700 dark:text-[#D8DEE9] uppercase tracking-wider mb-2">
              Recently Completed
            </h3>
            <div className="space-y-1.5">
              {recentCompleted.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-[#D8DEE9] py-3 italic">No tasks completed yet.</p>
              ) : (
                recentCompleted.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-[#2E3440] border border-slate-200/80 dark:border-[#4C566A] text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#A3BE8C] shrink-0" />
                      <span className="line-through text-slate-500 dark:text-[#D8DEE9]/70 truncate">
                        {t.content}
                      </span>
                    </div>
                    <button
                      onClick={() => toggleTaskCompletion(t.id)}
                      className="flex items-center gap-1 text-[11px] text-[#5E81AC] dark:text-[#88C0D0] hover:underline shrink-0 font-medium"
                      title="Restore task to active"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Restore</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
