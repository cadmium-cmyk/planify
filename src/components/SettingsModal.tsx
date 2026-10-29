import React, { useState, useRef } from 'react';
import {
  X,
  Settings,
  Sun,
  Moon,
  CloudMoon,
  Volume2,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  Check,
  RefreshCw,
  Server,
  Key,
  User,
  Calendar as CalendarIcon,
  Plus,
} from 'lucide-react';
import { usePlanify } from '../context/PlanifyContext';
import { testCaldavConnection, PROVIDER_PRESETS } from '../services/caldav';
import { playCompleteSound } from '../services/store';

export const SettingsModal: React.FC = () => {
  const {
    isSettingsOpen,
    setIsSettingsOpen,
    appearance,
    setAppearance,
    dailyGoal,
    setDailyGoal,
    soundEnabled,
    setSoundEnabled,
    exportBackupJSON,
    importBackupJSON,
    resetToDefaults,
    caldav,
    setCaldavConfig,
    syncCaldavNow,
    isSyncingCaldav,
    calendarFeeds,
    toggleCalendarFeed,
    addCalendarFeed,
    importIcsEvents,
  } = usePlanify();

  const [importNotice, setImportNotice] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState<{ loading: boolean; message?: string; success?: boolean }>({
    loading: false,
  });

  const [isAddingFeed, setIsAddingFeed] = useState(false);
  const [newFeedName, setNewFeedName] = useState('');
  const [newFeedColor, setNewFeedColor] = useState('#3584e4');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const icsInputRef = useRef<HTMLInputElement>(null);
  const [targetIcsCalId, setTargetIcsCalId] = useState<string>('');

  if (!isSettingsOpen) return null;

  const handleDownloadBackup = () => {
    const jsonStr = exportBackupJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `planify-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importBackupJSON(content);
      if (success) {
        setImportNotice('Backup successfully restored!');
        setTimeout(() => setImportNotice(null), 3000);
      } else {
        alert('Invalid JSON backup file.');
      }
    };
    reader.readAsText(file);
  };

  const handleIcsUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetIcsCalId) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const count = importIcsEvents(targetIcsCalId, content);
      setImportNotice(`Imported ${count} calendar events!`);
      setTimeout(() => setImportNotice(null), 3000);
    };
    reader.readAsText(file);
  };

  const handleTestCaldav = async () => {
    setTestStatus({ loading: true });
    const res = await testCaldavConnection(caldav);
    setTestStatus({ loading: false, message: res.message, success: res.success });
  };

  const handleCreateFeed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeedName.trim()) return;
    addCalendarFeed({
      name: newFeedName.trim(),
      color: newFeedColor,
      enabled: true,
      type: 'local_ics',
    });
    setNewFeedName('');
    setIsAddingFeed(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={() => setIsSettingsOpen(false)}
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            <h2 className="font-bold text-base text-slate-800 dark:text-slate-100">
              Preferences & CalDAV Sync
            </h2>
          </div>
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {importNotice && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{importNotice}</span>
            </div>
          )}

          {/* Theme / Appearance Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Appearance
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setAppearance('light')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                  appearance === 'light'
                    ? 'border-blue-600 bg-blue-50/50 text-blue-700 shadow-2xs font-semibold ring-1 ring-blue-500'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Sun className="w-5 h-5 text-amber-500" />
                <span className="text-xs">Light</span>
              </button>

              <button
                type="button"
                onClick={() => setAppearance('dark')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                  appearance === 'dark'
                    ? 'border-blue-500 bg-slate-800 text-white shadow-2xs font-semibold ring-1 ring-blue-500'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Moon className="w-5 h-5 text-blue-400" />
                <span className="text-xs">Dark</span>
              </button>

              <button
                type="button"
                onClick={() => setAppearance('dark-blue')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                  appearance === 'dark-blue'
                    ? 'border-cyan-500 bg-slate-800 text-cyan-300 shadow-2xs font-semibold ring-1 ring-cyan-500'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <CloudMoon className="w-5 h-5 text-cyan-400" />
                <span className="text-xs">Nord Blue</span>
              </button>
            </div>
          </div>

          {/* CalDAV Calendar & Task Sync Section */}
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <CalendarIcon className="w-4 h-4 text-purple-500" />
                <span>Account & CalDAV Sync Engine</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={caldav.enabled}
                  onChange={(e) => setCaldavConfig({ enabled: e.target.checked })}
                  className="rounded text-purple-600"
                />
                <span>Enable Automatic Sync</span>
              </label>
            </div>

            {caldav.enabled && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-4">
                {/* Provider Presets */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                    Account Type / Preset
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {PROVIDER_PRESETS.map((preset) => {
                      const isSelected = caldav.providerPreset === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            setCaldavConfig({
                              providerPreset: preset.id as any,
                              serverUrl: caldav.serverUrl || preset.defaultUrl,
                            });
                          }}
                          className={`p-2.5 rounded-xl border text-left transition-all ${
                            isSelected
                              ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/60 text-purple-900 dark:text-purple-200 font-medium shadow-xs ring-1 ring-purple-500'
                              : 'border-slate-200 dark:border-slate-700 bg-slate-100/60 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 text-xs font-bold mb-0.5">
                            <span>{preset.icon}</span>
                            <span className="truncate">{preset.name}</span>
                          </div>
                          <p className="text-[10px] opacity-75 line-clamp-2 leading-tight">
                            {preset.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Account Helper Notice */}
                <div className="p-2.5 rounded-lg bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-800/50 text-[11px] text-purple-900 dark:text-purple-200">
                  <p className="font-semibold mb-0.5">
                    {caldav.providerPreset === 'gnome' && '🖥️ GNOME Online Accounts Integration'}
                    {caldav.providerPreset === 'android' && '📱 Android Device Accounts (DAVx⁵)'}
                    {caldav.providerPreset === 'nextcloud' && '☁️ Nextcloud / ownCloud Sync'}
                    {caldav.providerPreset === 'google' && '🌐 Google Tasks & Calendar'}
                    {caldav.providerPreset === 'custom' && '⚙️ Custom CalDAV Protocol'}
                  </p>
                  <p className="opacity-90">
                    {caldav.providerPreset === 'gnome' &&
                      'Use the CalDAV URL from GNOME Settings → Online Accounts. Planify will automatically fetch and sync your tasks and calendar events.'}
                    {caldav.providerPreset === 'android' &&
                      'Enter your DAVx⁵ or Nextcloud server URL used on your Android device. Auto-sync will keep tasks in lockstep with your phone.'}
                    {caldav.providerPreset === 'nextcloud' &&
                      'Use your Nextcloud Server URL and App Password (generated in Nextcloud Security Settings) for secure synchronization.'}
                    {caldav.providerPreset === 'google' &&
                      'Enter your Google account CalDAV endpoint and App Password to sync Google Tasks and Calendar.'}
                    {caldav.providerPreset === 'custom' &&
                      'Enter your custom CalDAV server address and user credentials.'}
                  </p>
                </div>

                {/* CalDAV Server URL */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                    <Server className="w-3 h-3 text-slate-400" />
                    <span>CalDAV Server URL</span>
                  </label>
                  <input
                    type="text"
                    placeholder="https://cloud.example.com/remote.php/dav/calendars/username/"
                    value={caldav.serverUrl}
                    onChange={(e) => setCaldavConfig({ serverUrl: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-purple-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Username */}
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      <span>Username / Email</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. user@example.com"
                      value={caldav.username}
                      onChange={(e) => setCaldavConfig({ username: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-purple-500"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                      <Key className="w-3 h-3 text-slate-400" />
                      <span>Password / App Token</span>
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••••••"
                      value={caldav.password}
                      onChange={(e) => setCaldavConfig({ password: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                {/* Auto Sync & Component Settings */}
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-700 dark:text-slate-300">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={caldav.autoSync}
                        onChange={(e) => setCaldavConfig({ autoSync: e.target.checked })}
                        className="rounded text-purple-600"
                      />
                      <span className="font-medium">Background Auto-Sync</span>
                    </label>

                    {caldav.autoSync && (
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <span className="text-slate-500">Sync Interval:</span>
                        <select
                          value={caldav.autoSyncIntervalMinutes || 15}
                          onChange={(e) =>
                            setCaldavConfig({ autoSyncIntervalMinutes: Number(e.target.value) })
                          }
                          className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none"
                        >
                          <option value={5}>Every 5 minutes</option>
                          <option value={15}>Every 15 minutes</option>
                          <option value={30}>Every 30 minutes</option>
                          <option value={60}>Every 1 hour</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-700 dark:text-slate-300 pt-1">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={caldav.syncTasks}
                        onChange={(e) => setCaldavConfig({ syncTasks: e.target.checked })}
                        className="rounded text-purple-600"
                      />
                      <span>Sync Tasks (VTODO)</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={caldav.syncEvents}
                        onChange={(e) => setCaldavConfig({ syncEvents: e.target.checked })}
                        className="rounded text-purple-600"
                      />
                      <span>Sync Calendar Events (VEVENT)</span>
                    </label>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleTestCaldav}
                    disabled={testStatus.loading}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    {testStatus.loading ? 'Testing...' : 'Test Connection'}
                  </button>

                  <div className="flex items-center gap-2">
                    {caldav.lastSyncedAt && (
                      <span className="text-[10px] text-slate-400">
                        Last synced: {caldav.lastSyncedAt}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={async () => {
                        const res = await syncCaldavNow();
                        setTestStatus({ loading: false, message: res.message, success: res.success });
                      }}
                      disabled={isSyncingCaldav}
                      className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncingCaldav ? 'animate-spin' : ''}`} />
                      <span>Sync Now</span>
                    </button>
                  </div>
                </div>

                {testStatus.message && (
                  <p
                    className={`text-xs p-2 rounded-lg ${
                      testStatus.success
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                    }`}
                  >
                    {testStatus.message}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Active Calendars */}
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <CalendarIcon className="w-4 h-4 text-purple-500" />
                <span>Calendar Feeds</span>
              </label>

              <button
                onClick={() => setIsAddingFeed(true)}
                className="text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Calendar</span>
              </button>
            </div>

            <div className="space-y-2">
              {calendarFeeds.map((feed) => (
                <div
                  key={feed.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700"
                >
                  <label className="flex items-center gap-2.5 cursor-pointer min-w-0">
                    <input
                      type="checkbox"
                      checked={feed.enabled}
                      onChange={() => toggleCalendarFeed(feed.id)}
                      className="rounded text-purple-600"
                    />
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: feed.color }}
                    />
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {feed.name}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {feed.eventsCount} events
                    </span>
                  </label>

                  <button
                    onClick={() => {
                      setTargetIcsCalId(feed.id);
                      icsInputRef.current?.click();
                    }}
                    className="flex items-center gap-1 text-[11px] text-purple-600 dark:text-purple-400 hover:underline font-medium"
                    title="Import .ics calendar file"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Import .ics</span>
                  </button>
                </div>
              ))}

              <input
                ref={icsInputRef}
                type="file"
                accept=".ics,text/calendar"
                onChange={handleIcsUpload}
                className="hidden"
              />
            </div>

            {isAddingFeed && (
              <form
                onSubmit={handleCreateFeed}
                className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] text-slate-500 mb-0.5">Calendar Name</label>
                    <input
                      type="text"
                      autoFocus
                      placeholder="e.g. Work Calendar, Family"
                      value={newFeedName}
                      onChange={(e) => setNewFeedName(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Color</label>
                    <input
                      type="color"
                      value={newFeedColor}
                      onChange={(e) => setNewFeedColor(e.target.value)}
                      className="w-full h-8 rounded-lg cursor-pointer border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingFeed(false)}
                    className="px-2.5 py-1 text-xs text-slate-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newFeedName.trim()}
                    className="px-3 py-1 bg-purple-600 text-white rounded-lg text-xs font-medium"
                  >
                    Add Feed
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Daily Goal Slider */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                Daily Goal
              </label>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                {dailyGoal} tasks / day
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              value={dailyGoal}
              onChange={(e) => setDailyGoal(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
          </div>

          {/* Sound Effects */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-slate-500" />
                Completion Sound
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => playCompleteSound(true)}
                  className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Test sound
                </button>
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                  className="rounded text-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Data Backup & Reset */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Data Management & Backup
            </label>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleDownloadBackup}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-blue-500" />
                <span>Export JSON Backup</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-500" />
                <span>Restore from JSON</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => {
                  if (confirm('Clear all tasks and projects?')) {
                    resetToDefaults();
                    setIsSettingsOpen(false);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-medium text-rose-600 dark:text-rose-400 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear All Data</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
