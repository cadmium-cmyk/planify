import React, { useState } from 'react';
import { Tag, Plus, Edit2, Trash2, ArrowRight } from 'lucide-react';
import { usePlanify } from '../context/PlanifyContext';
import { PLANIFY_COLORS, Label } from '../types/planify';

export const LabelsView: React.FC = () => {
  const {
    labels,
    addLabel,
    updateLabel,
    deleteLabel,
    setActiveView,
    getTaskCountForLabel,
  } = usePlanify();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLabel, setEditingLabel] = useState<Label | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState(PLANIFY_COLORS[0].hex);

  const openCreate = () => {
    setEditingLabel(null);
    setName('');
    setColor(PLANIFY_COLORS[Math.floor(Math.random() * PLANIFY_COLORS.length)].hex);
    setIsModalOpen(true);
  };

  const openEdit = (lbl: Label) => {
    setEditingLabel(lbl);
    setName(lbl.name);
    setColor(lbl.color);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingLabel) {
      updateLabel(editingLabel.id, { name: name.trim(), color });
    } else {
      addLabel(name.trim(), color);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Tag className="w-5 h-5 text-amber-500" />
            Labels & Tags
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Organize tasks with customizable colored tags
          </p>
        </div>

        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs sm:text-sm font-medium shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Label</span>
        </button>
      </div>

      {/* Grid of Labels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {labels.map((lbl) => {
          const count = getTaskCountForLabel(lbl.id);

          return (
            <div
              key={lbl.id}
              onClick={() => setActiveView({ type: 'label', id: lbl.id })}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 shadow-2xs hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs"
                    style={{ backgroundColor: lbl.color }}
                  />
                  <span className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">
                    @{lbl.name}
                  </span>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEdit(lbl);
                    }}
                    className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    title="Edit Label"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete label "@${lbl.name}"?`)) {
                        deleteLabel(lbl.id);
                      }
                    }}
                    className="p-1 rounded text-slate-400 hover:text-red-500"
                    title="Delete Label"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <span>{count} active {count === 1 ? 'task' : 'tasks'}</span>
                <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium group-hover:translate-x-0.5 transition-transform">
                  View tasks <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Label Edit / Create Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold text-base text-slate-800 dark:text-slate-100">
              {editingLabel ? 'Edit Label' : 'Create New Label'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Label Name
                </label>
                <input
                  type="text"
                  autoFocus
                  placeholder="e.g. Work, Urgent, Bug"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                  Label Color
                </label>
                <div className="grid grid-cols-10 gap-2">
                  {PLANIFY_COLORS.map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => setColor(c.hex)}
                      title={c.name}
                      className={`w-6 h-6 rounded-full transition-transform ${
                        color === c.hex ? 'scale-125 ring-2 ring-offset-2 ring-blue-500' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!name.trim()}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium shadow-xs"
                >
                  {editingLabel ? 'Save Changes' : 'Create Label'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
