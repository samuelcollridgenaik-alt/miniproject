import React, { useState, useEffect } from 'react';
import { Search, BookOpen, Layers, Award, TrendingUp, GitCompare, ShieldCheck, Calendar, Terminal, Github, X, ArrowRight } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tabId: any) => void;
  onQuickAsk?: (question: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onQuickAsk,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actions = [
    { id: 'tutor', title: 'Ask Academic AI Tutor (RAG)', category: 'Learning', icon: BookOpen, desc: 'Ground questions with verified lecture notes' },
    { id: 'documents', title: 'Course Materials & Document Vault', category: 'Vault', icon: BookOpen, desc: 'View uploaded syllabus, PDF/PPTX chunk index' },
    { id: 'study', title: 'Active Recall Hub & Flashcards', category: 'Learning', icon: Layers, desc: '3D flashcards, chapter summaries, key concepts' },
    { id: 'quiz', title: 'Take Adaptive Quiz & Assessments', category: 'Assessment', icon: Award, desc: 'Evaluate understanding with instant scoring' },
    { id: 'mastery', title: 'View Topic Mastery Analytics', category: 'Analytics', icon: TrendingUp, desc: 'Weak-topic analysis, radar score & formulas' },
    { id: 'planner', title: 'Generate Personalized Revision Plan', category: 'Planning', icon: Calendar, desc: 'Time-constrained schedule before exams' },
    { id: 'comparison', title: 'Multi-Model Arena (Gemini vs Groq)', category: 'Lab', icon: GitCompare, desc: 'Side-by-side latency, token & answer comparison' },
    { id: 'review', title: 'Fact-Check & Consistency Audit', category: 'Verification', icon: ShieldCheck, desc: 'Audit generated answers against ground truth' },
    { id: 'evaluation', title: 'MCA Viva & Project Evaluator Lab', category: 'Evaluation', icon: Terminal, desc: 'Run empirical tests, metrics (Recall, Faithfulness)' },
  ];

  const filtered = actions.filter(
    (a) =>
      a.title.toLowerCase().includes(query.toLowerCase()) ||
      a.desc.toLowerCase().includes(query.toLowerCase()) ||
      a.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white dark:bg-[#202020] rounded-xl shadow-2xl border border-[#e9e9e7] dark:border-[#333333] overflow-hidden flex flex-col">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#e9e9e7] dark:border-[#2f2f2f]">
          <Search className="w-4 h-4 text-[#787774] shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages, topics, or type a command... (e.g. 'quiz', 'mastery', 'raft')"
            autoFocus
            className="flex-1 bg-transparent text-sm text-[#37352f] dark:text-[#e3e2e0] placeholder-[#9b9a97] outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-[#9b9a97] hover:text-[#37352f] dark:hover:text-white p-1 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-[#787774] dark:text-[#9b9a97] bg-black/5 dark:bg-white/5 rounded border border-[#e9e9e7] dark:border-[#333333]">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-black/5 dark:divide-white/5">
          {filtered.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-xs text-[#787774] dark:text-[#9b9a97]">
                No matching pages or tools found for "{query}".
              </p>
              {query && onQuickAsk && (
                <button
                  onClick={() => {
                    onClose();
                    onNavigate('tutor');
                    onQuickAsk(query);
                  }}
                  className="mt-3 px-3 py-1.5 rounded-md text-xs font-medium bg-[#2383e2] text-white hover:bg-[#1d6fc2] inline-flex items-center gap-1.5"
                >
                  Ask AI Tutor about "{query}" <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          ) : (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    onClose();
                  }}
                  className="w-full text-left p-2.5 rounded-lg hover:bg-[#f1f1ef] dark:hover:bg-[#252525] flex items-center justify-between gap-3 group transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-md bg-[#e9e9e7] dark:bg-[#2a2a2a] flex items-center justify-center text-[#37352f] dark:text-[#e3e2e0] group-hover:bg-[#2383e2] group-hover:text-white transition">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#37352f] dark:text-[#e3e2e0]">
                          {item.title}
                        </span>
                        <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-black/5 dark:bg-white/5 text-[#787774] dark:text-[#9b9a97]">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#787774] dark:text-[#9b9a97]">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[#9b9a97] opacity-0 group-hover:opacity-100 transition" />
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-[#fbfbfa] dark:bg-[#1e1e1e] border-t border-[#e9e9e7] dark:border-[#2f2f2f] text-[11px] text-[#787774] dark:text-[#9b9a97] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>Navigation:</span>
            <span className="font-mono bg-black/5 dark:bg-white/5 px-1 rounded">↑↓</span>
            <span>Select:</span>
            <span className="font-mono bg-black/5 dark:bg-white/5 px-1 rounded">↵</span>
          </div>
          <span>Cognify Second Brain · MCA Intelligence</span>
        </div>
      </div>
    </div>
  );
};
