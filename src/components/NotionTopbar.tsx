import React from 'react';
import {
  PanelLeft,
  Sun,
  Moon,
  Github,
  Sparkles,
  Search,
  CheckCircle2,
  AlertCircle,
  Zap,
} from 'lucide-react';
import { ProviderDiagnostic, UserProfile } from '../types.js';
import { NavTabId } from './NotionSidebar.js';
import { PomodoroTimer } from './PomodoroTimer.js';
import { Settings2 } from 'lucide-react';

interface NotionTopbarProps {
  activeTab: NavTabId;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenSearch: () => void;
  onSelectTab: (tab: NavTabId) => void;
  providers: ProviderDiagnostic[];
  totalDocs: number;
  onOpenModelSettings?: () => void;
}

export const NotionTopbar: React.FC<NotionTopbarProps> = ({
  activeTab,
  onToggleSidebar,
  isSidebarOpen,
  theme,
  onToggleTheme,
  onOpenSearch,
  onSelectTab,
  providers,
  totalDocs,
  onOpenModelSettings,
}) => {
  const tabNames: Record<NavTabId, { emoji: string; title: string }> = {
    tutor: { emoji: '🧠', title: 'Academic AI Tutor' },
    documents: { emoji: '📚', title: 'Course Notes & Vault' },
    study: { emoji: '⚡', title: 'Active Recall & Flashcards' },
    quiz: { emoji: '🎯', title: 'Adaptive Quizzer' },
    mastery: { emoji: '📊', title: 'Topic Mastery Analytics' },
    planner: { emoji: '🗓️', title: 'Revision & Exam Planner' },
    comparison: { emoji: '⚖️', title: 'Multi-Model Lab' },
    review: { emoji: '🛡️', title: 'Fact-Check & Audit' },
    evaluation: { emoji: '🧪', title: 'MCA Viva & Evaluator Lab' },
  };

  const current = tabNames[activeTab] || { emoji: '📄', title: 'Workspace' };
  const geminiProvider = providers.find((p) => p.id === 'gemini');
  const geminiLiteProvider = providers.find((p) => p.id === 'gemini-lite');
  const isGeminiOnline = geminiProvider?.status === 'online' || geminiLiteProvider?.status === 'online';

  return (
    <header className="h-12 border-b border-[#e9e9e7] dark:border-[#2f2f2f] bg-white/80 dark:bg-[#191919]/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between px-3 md:px-4 select-none">
      {/* Left: Breadcrumbs & Sidebar Toggle */}
      <div className="flex items-center gap-2 min-w-0">
        {!isSidebarOpen && (
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 text-[#787774] hover:text-[#37352f] dark:hover:text-white transition"
            title="Open Sidebar"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        )}

        <div className="flex items-center gap-1.5 text-xs text-[#787774] dark:text-[#9b9a97] truncate">
          <span className="hidden sm:inline hover:underline cursor-pointer" onClick={() => onSelectTab('tutor')}>
            Cognify Workspace
          </span>
          <span className="hidden sm:inline">/</span>
          <span className="hidden md:inline font-mono text-[11px]">MCA-IV</span>
          <span className="hidden md:inline">/</span>
          <div className="flex items-center gap-1 font-semibold text-[#37352f] dark:text-white truncate">
            <span>{current.emoji}</span>
            <span className="truncate">{current.title}</span>
          </div>
        </div>
      </div>

      {/* Center: Live Engine Status (Clickable to open Model Settings) */}
      <button
        type="button"
        onClick={onOpenModelSettings}
        className="hidden lg:flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white p-1 rounded-lg transition"
        title="Configure AI Models & API Keys"
      >
        <span className="flex items-center gap-1.5 font-medium text-indigo-600 dark:text-indigo-400">
          <span className={`w-2 h-2 rounded-full ${isGeminiOnline ? 'bg-emerald-500 animate-pulse' : 'bg-indigo-400'}`} />
          <span>{isGeminiOnline ? 'Google Gemini AI' : 'Cognify Curriculum'}</span>
        </span>
        <span aria-hidden="true" className="text-slate-300 dark:text-zinc-700">·</span>
        <span className="text-[11px] text-slate-600 dark:text-zinc-400">Grounded RAG</span>
        <span aria-hidden="true" className="text-slate-300 dark:text-zinc-700">·</span>
        <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">Free Tier</span>
        <Settings2 className="w-3 h-3 text-slate-400 hover:text-indigo-500" />
      </button>

      {/* Right Controls: Pomodoro, Theme, Search, Model Settings */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Compact Pomodoro in topbar */}
        <div className="hidden sm:block">
          <PomodoroTimer compact={true} />
        </div>

        {/* Model Settings Button */}
        <button
          onClick={onOpenModelSettings}
          className="p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 text-[#787774] hover:text-[#37352f] dark:hover:text-white transition"
          title="AI Model & Key Settings"
        >
          <Settings2 className="w-4 h-4" />
        </button>

        {/* Quick Search trigger */}
        <button
          onClick={onOpenSearch}
          className="p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 text-[#787774] hover:text-[#37352f] dark:hover:text-white transition"
          title="Search or jump to page (⌘K)"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 text-[#787774] hover:text-[#37352f] dark:hover:text-white transition"
          title={theme === 'dark' ? 'Switch to Light Notion Theme' : 'Switch to Dark Notion Theme'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
