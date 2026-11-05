import { useOverlayFocus } from "../hooks/useOverlayFocus.js";
import React, { useState, useEffect } from "react";
import {
  Search,
  BookOpen,
  Layers,
  Award,
  TrendingUp,
  GitCompare,
  ShieldCheck,
  Calendar,
  Terminal,
  Github,
  X,
  ArrowRight,
} from "lucide-react";

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
  const [query, setQuery] = useState("");
  const overlayRef = useOverlayFocus(isOpen, onClose);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actions = [
    {
      id: "tutor",
      title: "Ask Academic AI Tutor (RAG)",
      category: "Learning",
      icon: BookOpen,
      desc: "Ground questions with verified lecture notes",
    },
    {
      id: "documents",
      title: "Course Materials & Document Vault",
      category: "Vault",
      icon: BookOpen,
      desc: "View uploaded syllabus, PDF/PPTX chunk index",
    },
    {
      id: "study",
      title: "Active Recall Hub & Flashcards",
      category: "Learning",
      icon: Layers,
      desc: "3D flashcards, chapter summaries, key concepts",
    },
    {
      id: "quiz",
      title: "Take Adaptive Quiz & Assessments",
      category: "Assessment",
      icon: Award,
      desc: "Evaluate understanding with instant scoring",
    },
    {
      id: "mastery",
      title: "View Topic Mastery Analytics",
      category: "Analytics",
      icon: TrendingUp,
      desc: "Weak-topic analysis, radar score & formulas",
    },
    {
      id: "planner",
      title: "Generate Personalized Revision Plan",
      category: "Planning",
      icon: Calendar,
      desc: "Time-constrained schedule before exams",
    },
    {
      id: "comparison",
      title: "Multi-Model Arena (Gemini vs Groq)",
      category: "Lab",
      icon: GitCompare,
      desc: "Side-by-side latency, token & answer comparison",
    },
    {
      id: "review",
      title: "Fact-Check & Consistency Audit",
      category: "Verification",
      icon: ShieldCheck,
      desc: "Audit generated answers against ground truth",
    },
    {
      id: "evaluation",
      title: "MCA Viva & Project Evaluator Lab",
      category: "Evaluation",
      icon: Terminal,
      desc: "Run empirical tests, metrics (Recall, Faithfulness)",
    },
  ];

  const filtered = actions.filter(
    (a) =>
      a.title.toLowerCase().includes(query.toLowerCase()) ||
      a.desc.toLowerCase().includes(query.toLowerCase()) ||
      a.category.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div
      ref={overlayRef}
      onKeyDown={(event) => {
        if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
        const items = Array.from(
          event.currentTarget.querySelectorAll<HTMLButtonElement>(
            '[role="list"] button',
          ),
        );
        if (!items.length) return;
        event.preventDefault();
        const index = items.indexOf(
          document.activeElement as HTMLButtonElement,
        );
        const next =
          event.key === "ArrowDown"
            ? (index + 1) % items.length
            : (index - 1 + items.length) % items.length;
        items[next]?.focus();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Search academic modules"
      className="command-palette fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="w-full max-w-xl bg-surface rounded-xl shadow-2xl border border-default overflow-hidden flex flex-col">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-default">
          <Search className="w-4 h-4 text-muted shrink-0" />
          <input
            aria-label="Search academic modules"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages, topics, or type a command... (e.g. 'quiz', 'mastery', 'raft')"
            autoFocus
            className="ui-field flex-1 bg-transparent text-sm text-primary placeholder-default outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="ui-control text-muted hover:text-primary p-1 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-muted bg-black/5 bg-surface rounded border border-default">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div
          role="list"
          className="max-h-80 overflow-y-auto p-2 divide-y divide-black/5 divide-default"
        >
          {filtered.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-xs text-muted">
                No matching pages or tools found for "{query}".
              </p>
              {query && onQuickAsk && (
                <button
                  onClick={() => {
                    onClose();
                    onNavigate("tutor");
                    onQuickAsk(query);
                  }}
                  className="ui-control mt-3 px-3 py-1.5 rounded-md text-xs font-medium bg-subtle text-on-accent hover:bg-elevated inline-flex items-center gap-1.5"
                >
                  Ask AI Tutor about "{query}"{" "}
                  <ArrowRight className="w-3 h-3" />
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
                  className="ui-control w-full text-left p-2.5 rounded-lg hover:bg-elevated flex items-center justify-between gap-3 group transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-md bg-subtle flex items-center justify-center text-primary group-hover:bg-elevated group-hover:text-on-accent transition">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-primary">
                          {item.title}
                        </span>
                        <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-black/5 bg-surface text-muted">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted">{item.desc}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-muted opacity-0 group-hover:opacity-100 transition" />
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-surface bg-subtle border-t border-default text-[11px] text-muted flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>Navigation:</span>
            <span className="font-mono bg-black/5 bg-surface px-1 rounded">
              ↑↓
            </span>
            <span>Select:</span>
            <span className="font-mono bg-black/5 bg-surface px-1 rounded">
              ↵
            </span>
          </div>
          <span>Cognify Second Brain · MCA Intelligence</span>
        </div>
      </div>
    </div>
  );
};
