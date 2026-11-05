import React from "react";
import { ProviderDiagnostic, UserProfile } from "../types.js";
import {
  Cpu,
  Database,
  Search,
  HelpCircle,
  Grid,
  Shield,
  Award,
  Sparkles,
} from "lucide-react";

interface HeaderProps {
  providers: ProviderDiagnostic[];
  totalDocs: number;
  totalChunks: number;
  currentUser: UserProfile;
  onOpenAuth: () => void;
  onRefreshDiagnostics: () => void;
  onNavigateToEvaluation: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  providers,
  totalDocs,
  totalChunks,
  currentUser,
  onOpenAuth,
  onRefreshDiagnostics,
  onNavigateToEvaluation,
}) => {
  return (
    <header className="bg-surface border-b border-default sticky top-0 z-40 ">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
        {/* Left: Google Cognify Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            {/* Google colored symbol */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center  text-on-accent font-bold">
              <Sparkles className="w-5 h-5 text-on-accent" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-primary font-sans">
                  Cognify <span className="text-accent font-medium">AI</span>
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent-soft text-accent border border-accent">
                  Google Workspace for MCA
                </span>
              </div>
              <p className="text-[11px] text-muted hidden sm:block">
                Multimodal RAG Academic Intelligence System
              </p>
            </div>
          </div>
        </div>

        {/* Center: Google-Style Search Bar */}
        <div className="hidden md:flex flex-1 max-w-xl mx-4">
          <div className="w-full relative flex items-center">
            <Search className="w-4 h-4 text-muted absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              readOnly
              onClick={() => {
                const tutorInput = document.querySelector(
                  'input[placeholder*="Ask an academic"]',
                ) as HTMLInputElement;
                if (tutorInput) tutorInput.focus();
              }}
              placeholder="Search course notes, ask questions, or jump to quizzes (Ctrl + K)..."
              className="ui-field w-full bg-subtle hover:bg-elevated focus:bg-surface text-xs text-primary placeholder-muted rounded-full pl-10 pr-4 py-2 border border-transparent focus:border-accent focus:outline-none transition cursor-pointer"
            />
          </div>
        </div>

        {/* Right: Actions, Providers, and Google Profile Avatar */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Live Providers */}
          <div className="hidden lg:flex items-center gap-1.5">
            {providers.map((p) => {
              const isOnline = p.status === "online";
              return (
                <div
                  key={p.id}
                  title={`${p.name} (${p.defaultModel}): ${p.status}`}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                    isOnline
                      ? "bg-success-soft border-success text-success"
                      : "bg-warning-soft border-warning text-warning"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isOnline
                        ? "bg-success-solid animate-pulse"
                        : "bg-warning-solid"
                    }`}
                  />
                  <span>{p.id === "gemini" ? "Gemini 3.8" : "Groq Llama"}</span>
                </div>
              );
            })}
          </div>

          {/* Evaluation Quick Button */}
          <button
            onClick={onNavigateToEvaluation}
            className="ui-control flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-accent-soft hover:bg-accent-soft text-accent border border-accent transition"
          >
            <Award className="w-3.5 h-3.5 text-accent" />
            <span className="hidden sm:inline">MCA Evaluation</span>
          </button>

          {/* Refresh Diagnostics */}
          <button
            aria-label="Refresh system diagnostics"
            onClick={onRefreshDiagnostics}
            title="Refresh system diagnostics"
            className="ui-control w-8 h-8 rounded-full hover:bg-elevated flex items-center justify-center text-muted hover:text-secondary transition"
          >
            <Cpu className="w-4 h-4" />
          </button>

          {/* User Account Avatar (Google Style) */}
          <button
            onClick={onOpenAuth}
            title={`${currentUser.name} (${currentUser.email}) - Click to manage academic account`}
            className="ui-control flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full hover:bg-elevated border border-default transition"
          >
            <div className="w-7 h-7 rounded-full bg-accent-solid text-on-accent font-semibold text-xs flex items-center justify-center ">
              {currentUser.name.charAt(0)}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-semibold text-primary leading-tight">
                {currentUser.name.split(" ")[0]}
              </div>
              <div className="text-[10px] text-muted capitalize leading-none">
                {currentUser.role}
              </div>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
