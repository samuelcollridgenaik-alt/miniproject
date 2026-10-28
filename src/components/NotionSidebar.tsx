import React from 'react';
import {
  BookOpen,
  Database,
  Layers,
  Award,
  TrendingUp,
  GitCompare,
  ShieldCheck,
  Calendar,
  Terminal,
  Search,
  Sparkles,
  ChevronDown,
  Flame,
  User,
  PanelLeftClose,
  PanelLeft,
  Github,
  Zap,
} from 'lucide-react';
import { UserProfile } from '../types.js';
import { PomodoroTimer } from './PomodoroTimer.js';

export type NavTabId =
  | 'tutor'
  | 'documents'
  | 'study'
  | 'quiz'
  | 'mastery'
  | 'comparison'
  | 'review'
  | 'planner'
  | 'evaluation';

interface NotionSidebarProps {
  activeTab: NavTabId;
  onSelectTab: (tab: NavTabId) => void;
  isOpen: boolean;
  onToggle: () => void;
  currentUser: UserProfile;
  onOpenAuth: () => void;
  onOpenSearch: () => void;
  docsCount: number;
}

export const NotionSidebar: React.FC<NotionSidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpen,
  onToggle,
  currentUser,
  onOpenAuth,
  onOpenSearch,
  docsCount,
}) => {
  const sections = [
    {
      title: 'Active Workspace',
      items: [
        { id: 'tutor' as NavTabId, label: 'Academic AI Tutor', emoji: '🧠', tag: 'RAG' },
        { id: 'documents' as NavTabId, label: 'Course Notes & Vault', emoji: '📚', count: docsCount },
        { id: 'study' as NavTabId, label: 'Active Recall & Cards', emoji: '⚡', tag: 'Groq' },
        { id: 'quiz' as NavTabId, label: 'Adaptive Quizzer', emoji: '🎯' },
      ],
    },
    {
      title: 'Academic Intelligence',
      items: [
        { id: 'mastery' as NavTabId, label: 'Topic Mastery & Radar', emoji: '📊' },
        { id: 'planner' as NavTabId, label: 'Exam Revision Planner', emoji: '🗓️' },
        { id: 'comparison' as NavTabId, label: 'Multi-Model Lab', emoji: '⚖️', tag: 'Compare' },
        { id: 'review' as NavTabId, label: 'Fact-Check & Audit', emoji: '🛡️' },
      ],
    },
    {
      title: 'Evaluation & Viva',
      items: [
        { id: 'evaluation' as NavTabId, label: 'MCA Viva & Evaluator Lab', emoji: '🧪', tag: 'Examiner' },
      ],
    },
  ];

  if (!isOpen) {
    return (
      <aside className="hidden md:flex flex-col items-center py-3 w-12 border-r border-[#e9e9e7] dark:border-[#2f2f2f] bg-[#f7f6f3] dark:bg-[#1f1f1f] shrink-0 select-none">
        <button
          onClick={onToggle}
          className="p-2 rounded-md hover:bg-black/5 dark:hover:bg-white/5 text-[#787774] hover:text-[#37352f] dark:hover:text-white mb-4"
          title="Open Notion Sidebar"
        >
          <PanelLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 flex flex-col items-center gap-2">
          {sections.flatMap((s) => s.items).map((item) => (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              title={item.label}
              className={`w-8 h-8 rounded-md flex items-center justify-center text-sm transition ${
                activeTab === item.id
                  ? 'bg-white dark:bg-[#2c2c2c] shadow-2xs text-[#2383e2] border border-[#e9e9e7] dark:border-[#3a3a3a]'
                  : 'hover:bg-black/5 dark:hover:bg-white/5 text-[#787774]'
              }`}
            >
              {item.emoji}
            </button>
          ))}
        </div>
        <button
          onClick={onOpenAuth}
          className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center"
          title={currentUser.name}
        >
          {currentUser.name.charAt(0)}
        </button>
      </aside>
    );
  }

  return (
    <aside className="w-64 border-r border-[#e9e9e7] dark:border-[#2f2f2f] bg-[#f7f6f3] dark:bg-[#202020] flex flex-col h-screen sticky top-0 shrink-0 select-none z-30 transition-all duration-200">
      {/* Workspace Switcher Header */}
      <div className="p-3 border-b border-[#e9e9e7] dark:border-[#2b2b2b] flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-md bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs shrink-0">
            🧠
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-[#37352f] dark:text-white truncate">
                Cognify Studio
              </span>
              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">
                MCA
              </span>
            </div>
            <p className="text-[11px] text-[#787774] dark:text-[#9b9a97] truncate">
              {currentUser.name}
            </p>
          </div>
        </div>
        <button
          onClick={onToggle}
          className="p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 text-[#787774] hover:text-[#37352f] dark:hover:text-white"
          title="Collapse Sidebar"
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Search & Streak Banner */}
      <div className="p-2 space-y-1.5">
        <button
          onClick={onOpenSearch}
          className="w-full px-2.5 py-1.5 rounded-md bg-white dark:bg-[#252525] border border-[#e9e9e7] dark:border-[#333333] hover:border-[#2383e2] text-left flex items-center justify-between text-xs text-[#787774] dark:text-[#9b9a97] shadow-2xs group transition"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 group-hover:text-[#2383e2] transition" />
            <span className="group-hover:text-[#37352f] dark:group-hover:text-white">Quick Find...</span>
          </div>
          <kbd className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/5 dark:bg-white/5 border border-[#e9e9e7] dark:border-[#3a3a3a]">
            ⌘K
          </kbd>
        </button>

        {/* Study Streak Pill */}
        <div className="px-2.5 py-1.5 rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 flex items-center justify-between text-[11px] text-amber-900 dark:text-amber-300">
          <div className="flex items-center gap-1.5 font-medium">
            <Flame className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 fill-amber-500 animate-pulse" />
            <span>4-Day Study Streak</span>
          </div>
          <span className="font-mono text-[10px] font-bold">120m</span>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-4">
        {sections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-0.5">
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#9b9a97] font-mono">
              {section.title}
            </div>
            {section.items.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full px-2.5 py-1.5 rounded-md text-xs font-medium flex items-center justify-between group transition ${
                    isActive
                      ? 'bg-white dark:bg-[#2c2c2c] text-[#37352f] dark:text-white shadow-2xs font-semibold'
                      : 'text-[#5f5e5b] dark:text-[#9b9a97] hover:bg-black/5 dark:hover:bg-white/5 hover:text-[#37352f] dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-sm shrink-0">{item.emoji}</span>
                    <span className="truncate">{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.tag && (
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-mono uppercase tracking-wider ${
                          isActive
                            ? 'bg-[#2383e2] text-white'
                            : 'bg-black/5 dark:bg-white/5 text-[#787774] dark:text-[#9b9a97]'
                        }`}
                      >
                        {item.tag}
                      </span>
                    )}
                    {typeof item.count === 'number' && item.count > 0 && (
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-black/5 dark:bg-white/10 text-[#787774] dark:text-[#9b9a97]">
                        {item.count}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ))}

        {/* Ambient Pomodoro Focus Box in Sidebar */}
        <div className="pt-2">
          <PomodoroTimer />
        </div>
      </div>

      {/* User Profile & Account Footer */}
      <div className="p-2 border-t border-[#e9e9e7] dark:border-[#2b2b2b] bg-[#f7f6f3] dark:bg-[#1d1d1d]">
        <button
          onClick={onOpenAuth}
          className="w-full p-2 rounded-md hover:bg-black/5 dark:hover:bg-white/5 text-left flex items-center justify-between transition group"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
              {currentUser.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-[#37352f] dark:text-white truncate">
                {currentUser.name}
              </div>
              <div className="text-[10px] text-[#787774] dark:text-[#9b9a97] truncate font-mono">
                {currentUser.role === 'evaluator' ? '🎓 Evaluator Mode' : `Student · ${currentUser.studentId || 'MCA'}`}
              </div>
            </div>
          </div>
          <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition">
            Switch
          </span>
        </button>
      </div>
    </aside>
  );
};
