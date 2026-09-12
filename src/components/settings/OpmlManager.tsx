import React, { useState } from 'react';
import { SubscribedFeed } from '@/types/wiretap';
import { Download, Upload, Check, AlertCircle, Loader2 } from 'lucide-react';

interface OpmlManagerProps {
  feeds: SubscribedFeed[];
  onBatchAddFeeds: (
    newFeeds: Array<Omit<SubscribedFeed, 'id' | 'healthStatus' | 'lastFetchedAt' | 'lastError'>>
  ) => Promise<void>;
}

export const OpmlManager: React.FC<OpmlManagerProps> = ({ feeds, onBatchAddFeeds }) => {
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Export OPML
  const handleExport = async () => {
    setExporting(true);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/opml', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'export', feeds })
      });
      const data = await res.json();
      if (!data.ok || !data.opml) {
        throw new Error(data.error || 'Failed to export OPML');
      }

      // Trigger download
      const blob = new Blob([data.opml], { type: 'text/xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `wiretap-subscriptions-${new Date().toISOString().slice(0, 10)}.opml`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setStatusMessage(`Exported ${feeds.length} feeds successfully.`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  // Import OPML File
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const content = await file.text();
      const res = await fetch('/api/opml', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'import', opmlContent: content })
      });

      const data = await res.json();
      if (!data.ok || !Array.isArray(data.feeds)) {
        throw new Error(data.error || 'Invalid or unreadable OPML file');
      }

      const existingUrls = new Set(feeds.map((f) => f.feedUrl.toLowerCase().trim()));
      const uniqueNewFeeds = data.feeds
        .filter((f: any) => !existingUrls.has(f.feedUrl.toLowerCase().trim()))
        .map((f: any) => ({
          title: f.title || 'Untitled Feed',
          feedUrl: f.feedUrl,
          siteUrl: f.siteUrl || '',
          category: f.category || 'Imported',
          tags: ['imported'],
          faviconUrl: f.siteUrl ? `${new URL(f.siteUrl).origin}/favicon.ico` : ''
        }));

      if (uniqueNewFeeds.length === 0) {
        setStatusMessage('All feeds in OPML file already exist in your subscriptions.');
      } else {
        await onBatchAddFeeds(uniqueNewFeeds);
        setStatusMessage(`Successfully imported ${uniqueNewFeeds.length} new feeds!`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to parse OPML file');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Export Button */}
        <button
          onClick={handleExport}
          disabled={exporting || feeds.length === 0}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
        >
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 text-indigo-400" />}
          <span>Export OPML ({feeds.length} feeds)</span>
        </button>

        {/* Import Button with Hidden File Input */}
        <label className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-colors cursor-pointer">
          {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 text-emerald-400" />}
          <span>{importing ? 'Importing...' : 'Import OPML File'}</span>
          <input
            type="file"
            accept=".opml,.xml"
            onChange={handleFileUpload}
            disabled={importing}
            className="hidden"
          />
        </label>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 flex items-center space-x-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
