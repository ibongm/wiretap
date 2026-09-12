import React, { useState } from 'react';
import { X, Search, Plus, Check, Loader2, Globe, Youtube, Tag } from 'lucide-react';
import { ApiDiscoverCandidate } from '@/types/wiretap';

interface AddFeedModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  existingTags: string[];
  onAddFeed: (feedData: {
    title: string;
    feedUrl: string;
    siteUrl: string;
    category: string;
    tags: string[];
    faviconUrl: string;
  }) => Promise<any>;
}

export const AddFeedModal: React.FC<AddFeedModalProps> = ({
  isOpen,
  onClose,
  categories,
  existingTags,
  onAddFeed
}) => {
  const [inputUrl, setInputUrl] = useState('');
  const [discovering, setDiscovering] = useState(false);
  const [candidates, setCandidates] = useState<ApiDiscoverCandidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<ApiDiscoverCandidate | null>(null);
  const [customTitle, setCustomTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categories[0] || 'General');
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleDiscover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;

    setDiscovering(true);
    setError(null);
    setCandidates([]);
    setSelectedCandidate(null);

    try {
      const res = await fetch('/api/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: inputUrl.trim() })
      });
      const data = await res.json();
      if (!data.ok || !data.feeds || data.feeds.length === 0) {
        throw new Error(data.error || 'No RSS or Atom feeds could be discovered at this URL.');
      }
      setCandidates(data.feeds);
      setSelectedCandidate(data.feeds[0]);
      setCustomTitle(data.feeds[0].title || '');
    } catch (err: any) {
      setError(err.message || 'Failed to discover feed');
    } finally {
      setDiscovering(false);
    }
  };

  const handleAddTag = () => {
    const clean = tagInput.trim().toLowerCase();
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (t: string) => {
    setTags(tags.filter((x) => x !== t));
  };

  const handleSubmit = async () => {
    if (!selectedCandidate) return;
    setIsSubmitting(true);
    setError(null);

    const finalCategory = isCreatingCategory && newCategoryInput.trim()
      ? newCategoryInput.trim()
      : selectedCategory;

    try {
      await onAddFeed({
        title: customTitle.trim() || selectedCandidate.title,
        feedUrl: selectedCandidate.url,
        siteUrl: selectedCandidate.siteUrl || inputUrl,
        category: finalCategory,
        tags,
        faviconUrl: selectedCandidate.faviconUrl || ''
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save feed subscription');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100 max-h-[90vh] overflow-y-auto custom-scrollbar">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <h2 className="text-xl font-bold text-white tracking-tight">Smart Feed Discovery</h2>
          <p className="text-xs text-slate-400 mt-1">
            Input any blog URL, YouTube channel (`@name`), or Reddit (`r/sub`)
          </p>
        </div>

        {/* URL Input Bar */}
        <form onSubmit={handleDiscover} className="mb-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://example.com, youtube.com/@veritasium, r/science"
                className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              type="submit"
              disabled={discovering || !inputUrl.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors shrink-0"
            >
              {discovering ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Discover</span>}
            </button>
          </div>
        </form>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
            {error}
          </div>
        )}

        {/* Discovered Candidates List */}
        {candidates.length > 0 && (
          <div className="space-y-4 mb-6 animate-in fade-in">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Select Feed Endpoint ({candidates.length} found)
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {candidates.map((c, i) => (
                <div
                  key={i}
                  onClick={() => {
                    setSelectedCandidate(c);
                    setCustomTitle(c.title);
                  }}
                  className={`p-3 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                    selectedCandidate?.url === c.url
                      ? 'bg-indigo-950/60 border-indigo-500 text-white'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0 flex-1 mr-2">
                    {c.url.includes('youtube.com') ? (
                      <Youtube className="w-4 h-4 text-red-500 shrink-0" />
                    ) : (
                      <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold truncate">{c.title || 'Untitled Feed'}</p>
                      <p className="text-[11px] text-slate-400 font-mono truncate">{c.url}</p>
                    </div>
                  </div>
                  {selectedCandidate?.url === c.url && <Check className="w-4 h-4 text-indigo-400 shrink-0" />}
                </div>
              ))}
            </div>

            {/* Title override */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Feed Display Title</label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Category selection */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Category</label>
              {isCreatingCategory ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategoryInput}
                    onChange={(e) => setNewCategoryInput(e.target.value)}
                    placeholder="New category name"
                    className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setIsCreatingCategory(false)}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-xl text-xs text-slate-200"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setIsCreatingCategory(true)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs text-indigo-400 font-medium flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New</span>
                  </button>
                </div>
              )}
            </div>

            {/* Tag assignment */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Tags</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="e.g. ai, investigative, hardware"
                  className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs text-slate-300"
                >
                  Add
                </button>
              </div>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs"
                    >
                      <Tag className="w-2.5 h-2.5" />
                      <span>{t}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t)}
                        className="hover:text-white"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full mt-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center space-x-2"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Subscribe & Save Feed</span>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
