import React, { useState, useEffect } from 'react';
import {
  X,
  Folder,
  Star,
  Kanban,
  LayoutList,
  Briefcase,
  Home,
  Code,
  Sparkles,
  Book,
  Target,
  Hash,
  Heart,
  Wrench,
  Globe,
  Compass,
  Bookmark,
} from 'lucide-react';
import { usePlanify } from '../context/PlanifyContext';
import { PLANIFY_COLORS, SYMBOLIC_ICONS } from '../types/planify';

const EMOJI_OPTIONS = ['🚀', '💼', '🌿', '📚', '🎯', '🎨', '💡', '⚡', '🏠', '🛠', '✨', '☕', '🔥', '💻', '📈'];

export const ProjectModal: React.FC = () => {
  const {
    isNewProjectOpen,
    setIsNewProjectOpen,
    editingProject,
    setEditingProject,
    addProject,
    updateProject,
  } = usePlanify();

  const isOpen = isNewProjectOpen || !!editingProject;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(PLANIFY_COLORS[11].hex);
  const [iconType, setIconType] = useState<'symbolic' | 'emoji' | 'none'>('symbolic');
  const [iconSymbolic, setIconSymbolic] = useState('folder');
  const [emoji, setEmoji] = useState('💼');
  const [isFavorite, setIsFavorite] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');

  useEffect(() => {
    if (editingProject) {
      setName(editingProject.name);
      setDescription(editingProject.description);
      setColor(editingProject.color);
      setIconType(editingProject.icon_type || (editingProject.emoji ? 'emoji' : 'symbolic'));
      setIconSymbolic(editingProject.icon_symbolic || 'folder');
      setEmoji(editingProject.emoji || '📁');
      setIsFavorite(editingProject.is_favorite);
      setViewMode(editingProject.view_mode);
    } else if (isNewProjectOpen) {
      setName('');
      setDescription('');
      setColor(PLANIFY_COLORS[Math.floor(Math.random() * PLANIFY_COLORS.length)].hex);
      setIconType('symbolic');
      setIconSymbolic('folder');
      setEmoji('💼');
      setIsFavorite(false);
      setViewMode('list');
    }
  }, [editingProject, isNewProjectOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    setIsNewProjectOpen(false);
    setEditingProject(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingProject) {
      updateProject(editingProject.id, {
        name: name.trim(),
        description: description.trim(),
        color,
        icon_type: iconType,
        icon_symbolic: iconSymbolic,
        emoji: iconType === 'emoji' ? emoji : undefined,
        is_favorite: isFavorite,
        view_mode: viewMode,
      });
    } else {
      addProject({
        name: name.trim(),
        description: description.trim(),
        color,
        icon_type: iconType,
        icon_symbolic: iconSymbolic,
        emoji: iconType === 'emoji' ? emoji : undefined,
        is_favorite: isFavorite,
        view_mode: viewMode,
      });
    }

    handleClose();
  };

  const renderSymbolicIconPreview = (iconId: string) => {
    const props = { className: 'w-4 h-4' };
    switch (iconId) {
      case 'briefcase': return <Briefcase {...props} />;
      case 'home': return <Home {...props} />;
      case 'code': return <Code {...props} />;
      case 'sparkles': return <Sparkles {...props} />;
      case 'book': return <Book {...props} />;
      case 'target': return <Target {...props} />;
      case 'hash': return <Hash {...props} />;
      case 'star': return <Star {...props} />;
      case 'heart': return <Heart {...props} />;
      case 'wrench': return <Wrench {...props} />;
      case 'globe': return <Globe {...props} />;
      case 'compass': return <Compass {...props} />;
      case 'bookmark': return <Bookmark {...props} />;
      case 'folder':
      default: return <Folder {...props} />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-[#3B4252] rounded-2xl shadow-xl border border-slate-200 dark:border-[#4C566A] p-5 space-y-4 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-base text-slate-800 dark:text-[#ECEFF4] flex items-center gap-2">
            <Folder className="w-5 h-5 text-[#5E81AC] dark:text-[#88C0D0]" />
            <span>{editingProject ? 'Edit Project' : 'New Project'}</span>
          </h3>
          <button
            onClick={handleClose}
            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-[#ECEFF4]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-[#D8DEE9] mb-1">
              Project Name
            </label>
            <input
              type="text"
              autoFocus
              placeholder="e.g. Website Launch, Home Maintenance"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-[#4C566A] bg-slate-50 dark:bg-[#2E3440] text-slate-900 dark:text-[#ECEFF4] outline-none focus:border-[#88C0D0]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-[#D8DEE9] mb-1">
              Description (optional)
            </label>
            <input
              type="text"
              placeholder="Goal, timeline, or notes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-[#4C566A] bg-slate-50 dark:bg-[#2E3440] text-slate-900 dark:text-[#ECEFF4] outline-none focus:border-[#88C0D0]"
            />
          </div>

          {/* Icon Type Selection */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-[#D8DEE9] mb-1.5">
              Icon Style
            </label>
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 dark:bg-[#2E3440] text-xs mb-2">
              <button
                type="button"
                onClick={() => setIconType('symbolic')}
                className={`flex-1 py-1 rounded-md transition-colors ${
                  iconType === 'symbolic'
                    ? 'bg-white dark:bg-[#434C5E] font-semibold text-slate-900 dark:text-[#ECEFF4] shadow-xs'
                    : 'text-slate-500 dark:text-[#D8DEE9]'
                }`}
              >
                Symbolic Icon
              </button>
              <button
                type="button"
                onClick={() => setIconType('emoji')}
                className={`flex-1 py-1 rounded-md transition-colors ${
                  iconType === 'emoji'
                    ? 'bg-white dark:bg-[#434C5E] font-semibold text-slate-900 dark:text-[#ECEFF4] shadow-xs'
                    : 'text-slate-500 dark:text-[#D8DEE9]'
                }`}
              >
                Emoji
              </button>
              <button
                type="button"
                onClick={() => setIconType('none')}
                className={`flex-1 py-1 rounded-md transition-colors ${
                  iconType === 'none'
                    ? 'bg-white dark:bg-[#434C5E] font-semibold text-slate-900 dark:text-[#ECEFF4] shadow-xs'
                    : 'text-slate-500 dark:text-[#D8DEE9]'
                }`}
              >
                Color Dot
              </button>
            </div>

            {/* Symbolic Icon Choices */}
            {iconType === 'symbolic' && (
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1 border border-slate-200 dark:border-[#4C566A] rounded-xl bg-slate-50 dark:bg-[#2E3440]">
                {SYMBOLIC_ICONS.map((iconItem) => (
                  <button
                    key={iconItem.id}
                    type="button"
                    onClick={() => setIconSymbolic(iconItem.id)}
                    title={iconItem.name}
                    className={`p-2 rounded-lg flex items-center justify-center transition-colors ${
                      iconSymbolic === iconItem.id
                        ? 'bg-[#5E81AC] text-white font-medium shadow-2xs'
                        : 'text-slate-600 dark:text-[#ECEFF4] hover:bg-slate-200 dark:hover:bg-[#434C5E]'
                    }`}
                  >
                    {renderSymbolicIconPreview(iconItem.id)}
                  </button>
                ))}
              </div>
            )}

            {/* Optional Emoji Picker */}
            {iconType === 'emoji' && (
              <div className="flex flex-wrap gap-1.5 p-1 border border-slate-200 dark:border-[#4C566A] rounded-xl bg-slate-50 dark:bg-[#2E3440]">
                {EMOJI_OPTIONS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEmoji(e)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm border transition-colors ${
                      emoji === e
                        ? 'border-[#88C0D0] bg-[#5E81AC]/20 ring-1 ring-[#88C0D0]'
                        : 'border-slate-200 dark:border-[#4C566A] hover:bg-slate-100 dark:hover:bg-[#434C5E]'
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-[#D8DEE9] mb-1.5">
              Theme Color
            </label>
            <div className="grid grid-cols-10 gap-2">
              {PLANIFY_COLORS.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => setColor(c.hex)}
                  title={c.name}
                  className={`w-6 h-6 rounded-full transition-transform ${
                    color === c.hex ? 'scale-125 ring-2 ring-offset-2 ring-[#88C0D0]' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          </div>

          {/* View Mode & Favorite toggles */}
          <div className="pt-2 border-t border-slate-100 dark:border-[#4C566A] grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-[#D8DEE9] mb-1">
                Default Layout
              </label>
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 dark:bg-[#2E3440] text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-md transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-[#434C5E] font-medium text-slate-900 dark:text-[#ECEFF4] shadow-xs'
                      : 'text-slate-500 dark:text-[#D8DEE9]'
                  }`}
                >
                  <LayoutList className="w-3.5 h-3.5" />
                  <span>List</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('board')}
                  className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-md transition-colors ${
                    viewMode === 'board'
                      ? 'bg-white dark:bg-[#434C5E] font-medium text-slate-900 dark:text-[#ECEFF4] shadow-xs'
                      : 'text-slate-500 dark:text-[#D8DEE9]'
                  }`}
                >
                  <Kanban className="w-3.5 h-3.5" />
                  <span>Board</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer pb-2">
                <input
                  type="checkbox"
                  checked={isFavorite}
                  onChange={(e) => setIsFavorite(e.target.checked)}
                  className="rounded text-[#5E81AC]"
                />
                <span className="text-xs text-slate-700 dark:text-[#ECEFF4] flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-[#EBCB8B] fill-[#EBCB8B]" />
                  Add to Favorites
                </span>
              </label>
            </div>
          </div>

          {/* Footer Submit */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#4C566A]">
            <button
              type="button"
              onClick={handleClose}
              className="px-3 py-1.5 text-xs text-slate-600 dark:text-[#D8DEE9]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-4 py-1.5 bg-[#5E81AC] hover:bg-[#81A1C1] disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              {editingProject ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
