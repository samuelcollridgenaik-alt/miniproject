import { ModuleErrorBoundary } from "./ui/Primitives.js";
import React, { useEffect, useRef, useState } from "react";
import { NotionSidebar, type NavTabId } from "./NotionSidebar.js";
import { NotionTopbar } from "./NotionTopbar.js";
import { TutorView } from "./TutorView.js";

import { useConversations } from "../hooks/useConversations.js";
import type {
  DocumentMeta,
  LLMProviderId,
  ProviderDiagnostic,
  UserProfile,
} from "../types.js";
interface Props {
  quickAsk: { text: string; id: number } | null;
  user: UserProfile;
  activeTab: NavTabId;
  onTab: (tab: NavTabId) => void;
  documents: DocumentMeta[];
  providers: ProviderDiagnostic[];
  provider: LLMProviderId;
  onProvider: (p: LLMProviderId) => void;
  theme: "dark" | "light";
  onTheme: () => void;
  onAuth: () => void;
  onSearch: () => void;
  onSettings: () => void;
  onSeed: () => void;
  children: React.ReactNode;
}
export function Workspace(p: Props) {
  const chat = useConversations(p.user.id);
  const lastQuickAsk = useRef<number | null>(null);
  useEffect(() => {
    if (p.quickAsk && lastQuickAsk.current !== p.quickAsk.id) {
      lastQuickAsk.current = p.quickAsk.id;
      chat.create(p.quickAsk.text);
    }
  }, [p.quickAsk]);
  const [sidebar, setSidebar] = useState(() => window.innerWidth >= 1024);
  const [width, setWidth] = useState(() => {
    const w = Number(localStorage.getItem("cognify_sidebar_width"));
    return w >= 220 && w <= 380 ? w : 290;
  });
  const tab = (id: NavTabId) => {
    p.onTab(id);
    if (window.innerWidth < 1024) setSidebar(false);
  };
  const select = (id: string) => {
    chat.select(id);
    tab("tutor");
  };
  const create = () => {
    chat.create();
    tab("tutor");
  };
  return (
    <div className="app-shell">
      <a className="skip-link" href="#workspace-main">
        Skip to workspace
      </a>
      <NotionSidebar
        activeTab={p.activeTab}
        onSelectTab={tab}
        isOpen={sidebar}
        onToggle={() => setSidebar(!sidebar)}
        currentUser={p.user}
        onOpenAuth={p.onAuth}
        width={width}
        onWidth={(w) => {
          setWidth(w);
          try {
            localStorage.setItem("cognify_sidebar_width", String(w));
          } catch {
            /* Resize remains available in memory. */
          }
        }}
        conversations={chat.conversations}
        activeConversation={chat.active}
        onSelectConversation={select}
        onNew={create}
        onRename={(id, title) => chat.update(id, { title })}
        onDelete={chat.remove}
        onSettings={p.onSettings}
      />
      <div className="main-workspace">
        <NotionTopbar
          activeTab={p.activeTab}
          conversations={chat.conversations}
          open={chat.open}
          active={chat.active}
          onSelect={select}
          onClose={chat.close}
          onNew={create}
          theme={p.theme}
          onToggleTheme={p.onTheme}
          onOpenSearch={p.onSearch}
          onSettings={p.onSettings}
          providers={p.providers}
        />
        {chat.storageError && (
          <div role="alert" className="storage-warning">
            {chat.storageError}
          </div>
        )}
        <main
          id="workspace-main"
          tabIndex={-1}
          className={p.activeTab === "tutor" ? "chat-main" : "module-main"}
        >
          <ModuleErrorBoundary key={p.activeTab}>
            {p.activeTab === "tutor" ? (
              <TutorView
                key={chat.active}
                documents={p.documents}
                conversation={chat.current}
                onUpdate={chat.update}
                onSeedSample={p.onSeed}
                onNavigateToDocuments={() => tab("documents")}
                provider={p.provider}
                onProvider={p.onProvider}
                providers={p.providers}
                userId={p.user.id}
              />
            ) : (
              <div className="module-content ui-word-wrap">{p.children}</div>
            )}
          </ModuleErrorBoundary>
        </main>
      </div>
    </div>
  );
}
