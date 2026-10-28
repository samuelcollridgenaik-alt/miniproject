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
  const groqProvider = providers.find((p) => p.id === 'groq');

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

      {/* Center: Multi-LLM Live Status Badges */}
      <div className="hidden lg:flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-800/40 text-[11px] text-blue-700 dark:text-blue-300 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
          <span>Gemini 3.8 Flash (Grounded RAG)</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 text-[11px] text-amber-700 dark:text-amber-300 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          <span>Groq Llama 3.3 (Cards & Quizzes)</span>
        </div>
      </div>

      {/* Right Controls: Pomodoro, Theme, Search, Quick Action */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Compact Pomodoro in topbar */}
        <div className="hidden sm:block">
          <PomodoroTimer compact={true} />
        </div>

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

        {/* Quick Action: Start Tutor / Quiz */}
        <button
          onClick={() => onSelectTab(activeTab === 'quiz' ? 'tutor' : 'quiz')}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#2383e2] text-white hover:bg-[#1d6fc2] shadow-2xs transition"
        >
          <Zap className="w-3.5 h-3.5" />
          <span className="hidden md:inline">{activeTab === 'quiz' ? 'Ask Tutor' : 'Practice Quiz'}</span>
        </button>
      </div>
    </header>
  );
};
