import React, { useEffect, useState, useRef } from "react";
import {
  MessageCircle,
  Plus,
  X,
  Search,
  Settings2,
  Sun,
  Moon,
} from "lucide-react";
import type { Conversation } from "../hooks/useConversations.js";
import { modules, type NavTabId } from "./NotionSidebar.js";
import { PomodoroTimer } from "./PomodoroTimer.js";
import type { ProviderDiagnostic } from "../types.js";
interface Props {
  providers: ProviderDiagnostic[];
  activeTab: NavTabId;
  conversations: Conversation[];
  open: string[];
  active: string;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  onNew: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onOpenSearch: () => void;
  onSettings: () => void;
}
export function NotionTopbar(p: Props) {
  const [controls, setControls] = useState(false);
  const controlRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!controls) return;
    const outside = (e: PointerEvent) => {
      if (!controlRef.current?.contains(e.target as Node)) setControls(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [controls]);
  useEffect(() => {
    const revealActive = () => {
      if (p.activeTab === "tutor")
        document
          .getElementById(`tab-${p.active}`)
          ?.scrollIntoView({ block: "nearest", inline: "nearest" });
      else document.querySelector(".conversation-tabs")?.scrollTo({ left: 0 });
    };
    revealActive();
    window.addEventListener("resize", revealActive);
    return () => window.removeEventListener("resize", revealActive);
  }, [p.active, p.activeTab]);
  const opened = p.open
    .map((id) => p.conversations.find((c) => c.id === id)!)
    .filter(Boolean);
  return (
    <header className="workspace-topbar">
      <div
        className="conversation-tabs"
        role="tablist"
        aria-label="Open conversations"
        onKeyDown={(e) => {
          const index = opened.findIndex((c) => c.id === p.active);
          const next =
            e.key === "ArrowRight"
              ? (index + 1) % opened.length
              : e.key === "ArrowLeft"
                ? (index - 1 + opened.length) % opened.length
                : e.key === "Home"
                  ? 0
                  : e.key === "End"
                    ? opened.length - 1
                    : -1;
          if (next >= 0) {
            e.preventDefault();
            p.onSelect(opened[next].id);
            document.getElementById(`tab-${opened[next].id}`)?.focus();
          }
        }}
      >
        {p.activeTab !== "tutor" && (
          <span className="module-tab">
            {modules.find((m) => m.id === p.activeTab)?.label}
          </span>
        )}
        {opened.map((c) => (
          <div
            className={`conversation-tab ${p.activeTab === "tutor" && p.active === c.id ? "active" : ""}`}
            key={c.id}
          >
            <button
              id={`tab-${c.id}`}
              role="tab"
              aria-selected={p.activeTab === "tutor" && p.active === c.id}
              aria-controls="conversation-panel"
              tabIndex={c.id === p.active ? 0 : -1}
              onClick={() => p.onSelect(c.id)}
              title={c.title}
            >
              <MessageCircle size={14} />
              <span>
                {c.title}
                {c.draft ? " •" : ""}
              </span>
            </button>
            <button
              aria-label={`Close tab ${c.title}`}
              title="Close tab (keeps history and draft)"
              onClick={() => p.onClose(c.id)}
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
      <button
        className="icon-button"
        title="New conversation"
        aria-label="New conversation"
        onClick={p.onNew}
      >
        <Plus size={17} />
      </button>
      <div className="topbar-tools">
        <button
          className="icon-button"
          title="Search modules (Ctrl+K)"
          aria-label="Search modules"
          onClick={p.onOpenSearch}
        >
          <Search size={16} />
        </button>
        <div
          ref={controlRef}
          className="workspace-controls"
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setControls(false);
              controlRef.current
                ?.querySelector<HTMLButtonElement>("button")
                ?.focus();
            }
          }}
        >
          <button
            className="icon-button"
            aria-expanded={controls}
            title="Workspace controls"
            aria-label="Workspace controls"
            onClick={() => setControls(!controls)}
          >
            <Settings2 size={16} />
          </button>
          <div className="workspace-controls-panel" hidden={!controls}>
            <strong>Workspace controls</strong>
            <div className="provider-status">
              {p.providers.map((provider) => (
                <p key={provider.id}>
                  {provider.name}
                  <span>{provider.status}</span>
                </p>
              ))}
            </div>
            <button
              className="new-conversation"
              onClick={() => {
                setControls(false);
                p.onSettings();
              }}
            >
              Model settings
            </button>
            <PomodoroTimer compact />
          </div>
        </div>
        <button
          className="icon-button"
          title="Toggle theme"
          aria-label="Toggle theme"
          onClick={p.onToggleTheme}
        >
          {p.theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  );
}
