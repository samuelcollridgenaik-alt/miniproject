import { useOverlayFocus } from "../hooks/useOverlayFocus.js";
import { useMediaQuery } from "../hooks/useMediaQuery.js";
import React, { useState, useEffect, useRef } from "react";
import {
  BrainCircuit,
  Library,
  Zap,
  Target,
  ChartNoAxesCombined,
  CalendarDays,
  Scale,
  ShieldCheck,
  FlaskConical,
  Home,
  Settings2,
  Search,
  PanelLeftClose,
  PanelLeft,
  SquarePen,
  ChevronDown,
  Pencil,
  Trash2,
  Ellipsis,
} from "lucide-react";
import type { UserProfile } from "../types.js";
import type { Conversation } from "../hooks/useConversations.js";
export type NavTabId =
  | "tutor"
  | "documents"
  | "study"
  | "quiz"
  | "mastery"
  | "comparison"
  | "review"
  | "planner"
  | "evaluation";
export const modules = [
  {
    id: "tutor",
    label: "Academic AI Tutor",
    icon: BrainCircuit,
    group: "Learning workspace",
  },
  {
    id: "documents",
    label: "Course Notes & Vault",
    icon: Library,
    group: "Learning workspace",
  },
  {
    id: "study",
    label: "Active Recall & Cards",
    icon: Zap,
    group: "Study & revision",
  },
  {
    id: "quiz",
    label: "Adaptive Quizzer",
    icon: Target,
    group: "Study & revision",
  },
  {
    id: "mastery",
    label: "Topic Mastery & Radar",
    icon: ChartNoAxesCombined,
    group: "Intelligence & labs",
  },
  {
    id: "planner",
    label: "Exam Revision Planner",
    icon: CalendarDays,
    group: "Study & revision",
  },
  {
    id: "comparison",
    label: "Multi-Model Lab",
    icon: Scale,
    group: "Intelligence & labs",
  },
  {
    id: "review",
    label: "Fact-Check & Audit",
    icon: ShieldCheck,
    group: "Intelligence & labs",
  },
  {
    id: "evaluation",
    label: "MCA Viva & Evaluator Lab",
    icon: FlaskConical,
    group: "Intelligence & labs",
  },
] as const;
interface Props {
  activeTab: NavTabId;
  onSelectTab: (tab: NavTabId) => void;
  isOpen: boolean;
  onToggle: () => void;
  currentUser: UserProfile;
  onOpenAuth: () => void;
  width: number;
  onWidth: (width: number) => void;
  conversations: Conversation[];
  activeConversation: string;
  onSelectConversation: (id: string) => void;
  onNew: () => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onSettings: () => void;
}
export function NotionSidebar(p: Props) {
  const [hiddenTooltip, setHiddenTooltip] = useState<string | null>(null);
  const mobile = useMediaQuery("(max-width: 1023px)");
  const drawerRef = useOverlayFocus<HTMLElement>(
    mobile && p.isOpen,
    p.onToggle,
  );
  const [search, setSearch] = useState("");
  const searchInput = useRef<HTMLInputElement>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [searchOpen, setSearchOpen] = useState(false);
  const [dialog, setDialog] = useState<{
    conversation: Conversation;
    action: "rename" | "delete";
  } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menu, setMenu] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  useEffect(() => {
    if (!menu) return;
    const close = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenu(null);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [menu]);
  const closeDialog = () => {
    const id = dialog?.conversation.id;
    setDialog(null);
    requestAnimationFrame(() => {
      const target =
        document.getElementById(`history-actions-${id}`) ||
        document.querySelector<HTMLButtonElement>(".new-conversation");
      target?.focus();
    });
  };
  useEffect(() => {
    if (searchOpen) searchInput.current?.focus();
  }, [searchOpen]);
  const initials = p.currentUser.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");
  const recent = [...p.conversations]
    .filter((c) => c.turns.length || c.draft)
    .filter((c) => c.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.updatedAt - a.updatedAt);
  return (
    <>
      <nav className="primary-rail" aria-label="Workspace areas">
        {modules.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            className="rail-module"
            aria-label={label}
            aria-describedby={`rail-tooltip-${id}`}
            onMouseEnter={() => setHiddenTooltip(null)}
            onFocus={() => setHiddenTooltip(null)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setHiddenTooltip(id);
            }}
            aria-current={p.activeTab === id ? "page" : undefined}
            onClick={() => p.onSelectTab(id)}
          >
            {id === "tutor" ? <Home /> : <Icon />}
            <span
              id={`rail-tooltip-${id}`}
              className={`rail-tooltip ${hiddenTooltip === id ? "dismissed" : ""}`}
              role="tooltip"
            >
              {label}
            </span>
          </button>
        ))}
        <div className="rail-bottom">
          <button
            aria-label={p.isOpen ? "Collapse sidebar" : "Open sidebar"}
            title={p.isOpen ? "Collapse sidebar" : "Open sidebar"}
            aria-expanded={p.isOpen}
            onClick={p.onToggle}
          >
            {p.isOpen ? <PanelLeftClose /> : <PanelLeft />}
          </button>
          <button
            title="Model settings"
            aria-label="Model settings"
            onClick={p.onSettings}
          >
            <Settings2 />
          </button>
          <button
            className="avatar"
            title="Account"
            aria-label="Account"
            onClick={p.onOpenAuth}
          >
            {initials}
          </button>
        </div>
      </nav>
      <>
        {p.isOpen && (
          <button
            className="sidebar-backdrop"
            tabIndex={-1}
            aria-label="Close navigation"
            onClick={p.onToggle}
          />
        )}
        <aside
          hidden={!p.isOpen}
          ref={drawerRef}
          role={mobile && !dialog ? "dialog" : undefined}
          aria-modal={mobile && !dialog ? true : undefined}
          className="workspace-sidebar"
          style={{ "--sidebar-width": `${p.width}px` } as React.CSSProperties}
          aria-label="Conversations"
          onKeyDown={(e) => {
            if (!mobile && e.key === "Escape") p.onToggle();
          }}
        >
          <div className="sidebar-heading">
            <span>
              Cognify <span className="muted">AI</span>
            </span>
            <button
              className="icon-button"
              title="Search conversations"
              aria-label="Search conversations"
              onClick={() => {
                setSearchOpen(!searchOpen);
                if (searchOpen) setSearch("");
              }}
            >
              <Search size={16} />
            </button>
            <button
              className="icon-button mobile-close"
              title="Close navigation"
              aria-label="Close navigation"
              onClick={p.onToggle}
            >
              <PanelLeftClose size={16} />
            </button>
          </div>
          <button className="new-conversation" onClick={p.onNew}>
            <SquarePen size={16} />
            New conversation<span className="shortcut">+</span>
          </button>
          <div className="sidebar-scroll">
            <section className="recents">
              <h2>
                Recents <span title="Stored in this browser only">Local</span>
              </h2>
              <label className="history-search" hidden={!searchOpen}>
                <Search size={13} />
                <input
                  ref={searchInput}
                  aria-label="Search conversations"
                  placeholder="Search conversations"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
              {!recent.length && (
                <p className="empty-history">
                  {search
                    ? "No matching conversations."
                    : "Your conversations will appear here."}
                </p>
              )}
              {recent.slice(0, showAll ? undefined : 5).map((c) => (
                <div
                  key={c.id}
                  className={`history-row ${p.activeTab === "tutor" && c.id === p.activeConversation ? "selected" : ""}`}
                >
                  <button
                    onClick={() => p.onSelectConversation(c.id)}
                    title={c.title}
                  >
                    <span>{c.title}</span>
                  </button>
                  <div
                    ref={menu === c.id ? menuRef : undefined}
                    className="history-actions"
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        e.stopPropagation();
                        setMenu(null);
                        document
                          .getElementById(`history-actions-${c.id}`)
                          ?.focus();
                      }
                    }}
                  >
                    <button
                      id={`history-actions-${c.id}`}
                      aria-label={`Actions for ${c.title}`}
                      aria-expanded={menu === c.id}
                      aria-haspopup="true"
                      onClick={(e) => {
                        const r = e.currentTarget.getBoundingClientRect();
                        setMenuPosition({
                          top: Math.min(r.bottom, window.innerHeight - 95),
                          left: Math.max(8, r.right - 130),
                        });
                        setMenu(menu === c.id ? null : c.id);
                      }}
                    >
                      <Ellipsis size={15} />
                    </button>
                    {menu === c.id && (
                      <div
                        className="history-menu"
                        style={{
                          position: "fixed",
                          top: menuPosition.top,
                          left: menuPosition.left,
                          right: "auto",
                        }}
                      >
                        <button
                          onClick={() => {
                            setDialog({ conversation: c, action: "rename" });
                            setMenu(null);
                          }}
                        >
                          <Pencil size={13} />
                          Rename
                        </button>
                        <button
                          onClick={() => {
                            setDialog({ conversation: c, action: "delete" });
                            setMenu(null);
                          }}
                        >
                          <Trash2 size={13} />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {recent.length > 5 && (
                <button
                  className="show-more"
                  onClick={() => setShowAll(!showAll)}
                >
                  {showAll ? "Show less" : "Show more"}
                </button>
              )}
            </section>
          </div>
          <button className="profile-row" onClick={p.onOpenAuth}>
            <span className="avatar">{initials}</span>
            <span>
              <strong>{p.currentUser.name}</strong>
              <small>{p.currentUser.studentId || p.currentUser.email}</small>
            </span>
            <ChevronDown size={14} />
          </button>
          <div
            role="separator"
            aria-label="Resize navigation"
            aria-orientation="vertical"
            aria-valuemin={220}
            aria-valuemax={380}
            aria-valuenow={p.width}
            tabIndex={0}
            className="sidebar-resize"
            onKeyDown={(e) => {
              if (e.key === "Home" || e.key === "End") {
                e.preventDefault();
                p.onWidth(e.key === "Home" ? 220 : 380);
              }
              if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                e.preventDefault();
                p.onWidth(
                  Math.max(
                    220,
                    Math.min(
                      380,
                      p.width +
                        (e.key === "ArrowRight" ? 1 : -1) *
                          (e.shiftKey ? 10 : 1),
                    ),
                  ),
                );
              }
            }}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              document.documentElement.style.userSelect = "none";
            }}
            onPointerMove={(e) => {
              if (e.currentTarget.hasPointerCapture(e.pointerId))
                p.onWidth(Math.max(220, Math.min(380, e.clientX - 52)));
            }}
            onLostPointerCapture={() => {
              document.documentElement.style.userSelect = "";
            }}
            onPointerCancel={() => {
              document.documentElement.style.userSelect = "";
            }}
            onPointerUp={(e) =>
              e.currentTarget.releasePointerCapture(e.pointerId)
            }
          />
        </aside>
        {dialog && (
          <ConversationDialog
            conversation={dialog.conversation}
            action={dialog.action}
            onClose={closeDialog}
            onSubmit={(title) => {
              if (dialog.action === "rename")
                p.onRename(dialog.conversation.id, title);
              else p.onDelete(dialog.conversation.id);
              setDialog(null);
            }}
          />
        )}
      </>
    </>
  );
}
function ConversationDialog({
  conversation,
  action,
  onClose,
  onSubmit,
}: {
  conversation: Conversation;
  action: "rename" | "delete";
  onClose: () => void;
  onSubmit: (title: string) => void;
}) {
  const ref = useOverlayFocus<HTMLDivElement>(true, onClose);
  const [title, setTitle] = useState(conversation.title);
  return (
    <div
      className="ui-confirm-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="conversation-dialog-title"
        className="ui-panel ui-confirm-panel"
      >
        <h2 id="conversation-dialog-title">
          {action === "rename" ? "Rename conversation" : "Delete conversation?"}
        </h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (title.trim()) onSubmit(title.trim());
          }}
        >
          {action === "rename" ? (
            <label className="conversation-title-field">
              Conversation title
              <input
                className="ui-field"
                value={title}
                maxLength={120}
                required
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>
          ) : (
            <p>
              This removes �{conversation.title}� and its draft from this
              browser. This cannot be undone.
            </p>
          )}
          <div className="conversation-dialog-actions">
            <button type="button" className="ui-button" onClick={onClose}>
              Cancel
            </button>
            <button className="ui-button" disabled={!title.trim()}>
              {action === "rename" ? "Save name" : "Delete conversation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
