import React, { useState } from 'react';
import { ProviderDiagnostic } from '../types.js';
import { Sparkles, X, Settings2 } from 'lucide-react';

interface DiagnosticsBannerProps {
  providers: ProviderDiagnostic[];
  onOpenModelSettings?: () => void;
}

export const DiagnosticsBanner: React.FC<DiagnosticsBannerProps> = ({ providers, onOpenModelSettings }) => {
  const [dismissed, setDismissed] = useState(false);
  const gemini = providers.find((p) => p.id === 'gemini');
  const geminiLite = providers.find((p) => p.id === 'gemini-lite');
  const hasHealthyGemini = (gemini && gemini.status === 'online') || (geminiLite && geminiLite.status === 'online');

  // If Google Gemini is configured and live, or user dismissed, don't show banner
  if (hasHealthyGemini || dismissed) {
    return null;
  }

  return (
    <div className="bg-indigo-50/90 dark:bg-zinc-800/90 border-b border-indigo-100 dark:border-zinc-700/80 px-4 py-2 text-xs text-indigo-950 dark:text-zinc-200 backdrop-blur-xs transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span className="truncate">
            Running on <strong>Cognify Academic Syllabus Engine</strong> (Zero-cost built-in mode).
          </span>
          <span aria-hidden="true" className="text-indigo-300 dark:text-zinc-600 hidden sm:inline">·</span>
          <span className="text-slate-600 dark:text-zinc-400 hidden md:inline">
            Connect your free Google AI Studio Gemini key for live frontier reasoning.
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onOpenModelSettings && (
            <button
              onClick={onOpenModelSettings}
              className="px-2.5 py-1 text-[11px] font-medium bg-white dark:bg-zinc-700 border border-indigo-200 dark:border-zinc-600 rounded-md text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 transition shadow-2xs flex items-center gap-1"
            >
              <Settings2 className="w-3 h-3" />
              <span>Model Settings</span>
            </button>
          )}
          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
