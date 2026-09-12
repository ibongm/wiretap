import React, { useState } from 'react';
import {
  X,
  Sliders,
  Filter,
  Palette,
  Layout,
  Command,
  Plus,
  Trash2,
  Keyboard,
  FileCode
} from 'lucide-react';
import { UserPreferences, SubscribedFeed } from '@/types/wiretap';
import { ThemeMode } from '@/context/ThemeContext';
import { OpmlManager } from './OpmlManager';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  onUpdatePreferences: (partial: Partial<UserPreferences>) => Promise<void>;
  feeds: SubscribedFeed[];
  onBatchAddFeeds: (
    newFeeds: Array<Omit<SubscribedFeed, 'id' | 'healthStatus' | 'lastFetchedAt' | 'lastError'>>
  ) => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onUpdatePreferences,
  feeds,
  onBatchAddFeeds
}) => {
  const [activeTab, setActiveTab] = useState<'filter' | 'appearance' | 'opml' | 'shortcuts'>('filter');
  const [keywordInput, setKeywordInput] = useState('');

  if (!isOpen) return null;

  const handleAddKeyword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = keywordInput.trim().toLowerCase();
    if (!clean) return;

    const current = preferences.mutedKeywords || [];
    if (!current.includes(clean)) {
      await onUpdatePreferences({ mutedKeywords: [...current, clean] });
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = async (term: string) => {
    const current = preferences.mutedKeywords || [];
    await onUpdatePreferences({
      mutedKeywords: current.filter((k) => k !== term)
    });
  };

  const handleThemeSelect = async (theme: ThemeMode) => {
    await onUpdatePreferences({ theme });
  };

  const handleDensitySelect = async (density: 'cards' | 'compact' | 'minimal') => {
    await onUpdatePreferences({ density });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100 max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center space-x-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">System Preferences</h2>
            <p className="text-xs text-slate-400">Configure editorial curation, typography & data mobility</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-2 border-b border-slate-800 pb-3 mb-5 overflow-x-auto">
          <button
            onClick={() => setActiveTab('filter')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === 'filter'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Bullshit Filter</span>
          </button>

          <button
            onClick={() => setActiveTab('appearance')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === 'appearance'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Appearance & Theme</span>
          </button>

          <button
            onClick={() => setActiveTab('opml')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === 'opml'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>OPML Sync</span>
          </button>

          <button
            onClick={() => setActiveTab('shortcuts')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === 'shortcuts'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>Keybindings</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
          {/* 1. BULLSHIT FILTER TAB */}
          {activeTab === 'filter' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-white mb-1">Keyword Mute Engine</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Articles matching any of these regex terms in their headline or snippet will be silently scrubbed from your Firehose view.
                </p>
              </div>

              <form onSubmit={handleAddKeyword} className="flex gap-2">
                <input
                  type="text"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  placeholder="e.g. crypto, kardashian, sponsored, rumor"
                  className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!keywordInput.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center space-x-1 transition-colors shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Mute</span>
                </button>
              </form>

              {/* Muted Terms List */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span>Currently Muted ({(preferences.mutedKeywords || []).length})</span>
                </div>

                {(preferences.mutedKeywords || []).length === 0 ? (
                  <p className="text-xs text-slate-500 italic p-4 bg-slate-800/40 rounded-xl border border-slate-800 text-center">
                    No keywords muted. Your firehose receives all raw syndicated signals.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {preferences.mutedKeywords.map((term) => (
                      <span
                        key={term}
                        className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs"
                      >
                        <span className="font-mono">{term}</span>
                        <button
                          onClick={() => handleRemoveKeyword(term)}
                          className="text-slate-400 hover:text-rose-400 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. APPEARANCE & THEME TAB */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              {/* Theme selection */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                  Color Palette
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'oled', label: 'OLED Pitch', bg: 'bg-black', border: 'border-zinc-800', text: 'text-white' },
                    { id: 'slate', label: 'Dark Slate', bg: 'bg-slate-900', border: 'border-slate-700', text: 'text-slate-100' },
                    { id: 'editorial', label: 'Warm Editorial', bg: 'bg-[#FAF8F5]', border: 'border-stone-300', text: 'text-stone-900' },
                    { id: 'light', label: 'Pure Light', bg: 'bg-white', border: 'border-zinc-200', text: 'text-zinc-900' }
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleThemeSelect(t.id as ThemeMode)}
                      className={`p-3 rounded-xl border text-left flex flex-col justify-between h-20 transition-all ${
                        t.bg
                      } ${
                        preferences.theme === t.id
                          ? 'ring-2 ring-indigo-500 border-indigo-500 scale-[1.02]'
                          : `${t.border} opacity-80 hover:opacity-100`
                      }`}
                    >
                      <span className={`text-xs font-bold ${t.text}`}>{t.label}</span>
                      <div className="flex space-x-1">
                        <div className="w-3 h-3 rounded-full bg-indigo-500" />
                        <div className="w-3 h-3 rounded-full bg-slate-500/30" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Default Density */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                  Default Density Mode
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'cards', label: 'Magazine Cards', desc: 'Hero imagery & snippet' },
                    { id: 'compact', label: 'Compact Scan', desc: 'Single row thumbnail' },
                    { id: 'minimal', label: 'Minimalist Headlines', desc: 'Ultra-dense headlines' }
                  ].map((d) => (
                    <button
                      key={d.id}
                      onClick={() => handleDensitySelect(d.id as any)}
                      className={`p-3 rounded-xl border text-left transition-colors ${
                        preferences.density === d.id
                          ? 'bg-indigo-950/60 border-indigo-500 text-white'
                          : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <p className="text-xs font-bold">{d.label}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{d.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 3. OPML SYNC TAB */}
          {activeTab === 'opml' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-white mb-1">Syndication Mobility</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Import feeds from Feedly, Inoreader, NetNewsWire, or export your full Wiretap collection as standard OPML 2.0.
                </p>
              </div>

              <OpmlManager feeds={feeds} onBatchAddFeeds={onBatchAddFeeds} />
            </div>
          )}

          {/* 4. KEYBINDINGS TAB */}
          {activeTab === 'shortcuts' && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-white mb-2">Power-User Keyboard Shortcuts</h3>
              <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden bg-slate-800/40 text-xs">
                {[
                  { key: 'j', desc: 'Move selection down through firehose' },
                  { key: 'k', desc: 'Move selection up through firehose' },
                  { key: 'Enter / Space', desc: 'Open selected article in Reader Drawer' },
                  { key: 'b', desc: 'Toggle bookmark for offline reading' },
                  { key: 'o', desc: 'Open original article in new tab' },
                  { key: 'm', desc: 'Toggle read / mark read' },
                  { key: 'Esc', desc: 'Close open Reader Drawer or Modal' }
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-2.5">
                    <span className="text-slate-300">{item.desc}</span>
                    <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-indigo-300 font-mono text-xs font-semibold">
                      {item.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
