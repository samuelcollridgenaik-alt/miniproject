import React, { useEffect, useState } from "react";
import { NavTabId } from "./components/NotionSidebar.js";
import { CommandPalette } from "./components/CommandPalette.js";
import { LoginPage } from "./components/LoginPage.js";
import { Workspace } from "./components/Workspace.js";
import { DocumentsView } from "./components/DocumentsView.js";
import { StudyMaterialView } from "./components/StudyMaterialView.js";
import { QuizView } from "./components/QuizView.js";
import { MasteryView } from "./components/MasteryView.js";
import { ComparisonView } from "./components/ComparisonView.js";
import { ReviewView } from "./components/ReviewView.js";
import { StudyPlannerView } from "./components/StudyPlannerView.js";
import { EvaluationView } from "./components/EvaluationView.js";
import { ModelSettingsModal } from "./components/ModelSettingsModal.js";
import {
  DocumentMeta,
  LLMProviderId,
  ProviderDiagnostic,
  UserProfile,
} from "./types.js";

export default function App() {
  const [quickAsk, setQuickAsk] = useState<{ text: string; id: number } | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<NavTabId>("tutor");
  const [providers, setProviders] = useState<ProviderDiagnostic[]>([]);
  const [documents, setDocuments] = useState<DocumentMeta[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isModelSettingsOpen, setIsModelSettingsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeProvider, setActiveProvider] = useState<LLMProviderId>(() => {
    return (
      (localStorage.getItem("cognify_preferred_provider") as LLMProviderId) ||
      "gemini"
    );
  });
  const [geminiKey, setGeminiKey] = useState<string>(() => {
    return localStorage.getItem("cognify_gemini_key") || "";
  });
  const [groqKey, setGroqKey] = useState<string>(() => {
    return localStorage.getItem("cognify_groq_key") || "";
  });
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return (
      (localStorage.getItem("cognify_theme") as "light" | "dark") || "dark"
    );
  });
  const [loadingInitial, setLoadingInitial] = useState(true);

  useEffect(() => {
    const openSearch = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsSearchOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", openSearch);
    return () => window.removeEventListener("keydown", openSearch);
  }, []);

  // Handle Theme switching
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("cognify_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const fetchDiagnostics = async (userId?: string) => {
    try {
      const activeId =
        userId ||
        currentUser?.id ||
        localStorage.getItem("cognify_user_id") ||
        "";
      const headers: Record<string, string> = {};
      if (activeId) headers["x-user-id"] = activeId;
      if (geminiKey) headers["x-gemini-key"] = geminiKey;
      if (groqKey) headers["x-groq-key"] = groqKey;

      const res = await fetch("/api/diagnostics", { headers });
      const data = await res.json();
      if (data.success) {
        setProviders(data.providers || []);
      }
    } catch (e) {
      console.error("Failed to fetch diagnostics", e);
    }
  };

  const fetchDocuments = async (userId?: string) => {
    try {
      const activeId =
        userId ||
        currentUser?.id ||
        localStorage.getItem("cognify_user_id") ||
        "";
      const headers: Record<string, string> = {};
      if (activeId) headers["x-user-id"] = activeId;

      const res = await fetch("/api/documents", { headers });
      const data = await res.json();
      if (data.success) {
        setDocuments(data.documents || []);

        // Preload sample MCA lecture notes if empty
        if (
          (!data.documents || data.documents.length === 0) &&
          !localStorage.getItem("cognify_seeded")
        ) {
          handleSeedSample(false, activeId);
          localStorage.setItem("cognify_seeded", "true");
        }
      }
    } catch (e) {
      console.error("Failed to fetch documents", e);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const savedUserId = localStorage.getItem("cognify_user_id") || "";
      const headers: Record<string, string> = {};
      if (savedUserId) headers["x-user-id"] = savedUserId;

      const res = await fetch("/api/auth/me", { headers });
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await res.json();
        if (data.success && data.user) {
          setCurrentUser(data.user);
          return data.user;
        }
      }
    } catch (e) {
      console.warn("Safe fallback to default profile:", e);
    }
    setCurrentUser(null);
    return null;
  };

  const handleSeedSample = async (
    showNotification: boolean = true,
    userId?: string,
  ) => {
    try {
      const activeId = userId || currentUser?.id || "";
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (activeId) headers["x-user-id"] = activeId;

      const res = await fetch("/api/seed-sample-doc", {
        method: "POST",
        headers,
      });
      const data = await res.json();
      if (data.success) {
        await fetchDocuments(activeId);
      }
    } catch (e: any) {
      console.error("Seed sample failed", e);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("cognify_user_id");
    localStorage.removeItem("cognify_auth_token");
    setCurrentUser(null);
    setIsAuthOpen(false);
  };

  const handleLoginSuccess = async (user: UserProfile) => {
    setCurrentUser(user);
    localStorage.setItem("cognify_user_id", user.id);
    setIsAuthOpen(false);
    await Promise.all([fetchDiagnostics(user.id), fetchDocuments(user.id)]);
  };

  useEffect(() => {
    fetchCurrentUser().then((user) => {
      const id = user?.id;
      Promise.all([fetchDiagnostics(id), fetchDocuments(id)]).finally(() => {
        setLoadingInitial(false);
      });
    });
  }, []);

  // If user is logged out, present the dedicated Login Page
  if (!loadingInitial && !currentUser) {
    return (
      <LoginPage
        currentUser={null}
        onLoginSuccess={handleLoginSuccess}
        isModal={false}
      />
    );
  }

  const handleSaveGeminiKey = (key: string) => {
    setGeminiKey(key);
    localStorage.setItem("cognify_gemini_key", key);
  };

  const handleSaveGroqKey = (key: string) => {
    setGroqKey(key);
    localStorage.setItem("cognify_groq_key", key);
  };

  const handleSelectProvider = (prov: LLMProviderId) => {
    setActiveProvider(prov);
    localStorage.setItem("cognify_preferred_provider", prov);
  };

  return (
    <div className="application-root">
      {loadingInitial ? (
        <div className="workspace-loading" role="status">
          Opening Cognify workspace…
        </div>
      ) : (
        currentUser && (
          <Workspace
            key={currentUser.id}
            user={currentUser}
            quickAsk={quickAsk}
            activeTab={activeTab}
            onTab={setActiveTab}
            documents={documents}
            providers={providers}
            provider={activeProvider}
            onProvider={handleSelectProvider}
            theme={theme}
            onTheme={toggleTheme}
            onAuth={() => setIsAuthOpen(true)}
            onSearch={() => setIsSearchOpen(true)}
            onSettings={() => setIsModelSettingsOpen(true)}
            onSeed={() => handleSeedSample(true)}
          >
            {activeTab === "documents" && (
              <DocumentsView
                documents={documents}
                onRefresh={() => fetchDocuments(currentUser?.id)}
                onSeedSample={() => handleSeedSample(true)}
              />
            )}
            {activeTab === "study" && (
              <StudyMaterialView documents={documents} />
            )}
            {activeTab === "quiz" && (
              <QuizView
                documents={documents}
                onQuizCompleted={() => fetchDocuments(currentUser?.id)}
                onOpenModelSettings={() => setIsModelSettingsOpen(true)}
              />
            )}
            {activeTab === "mastery" && (
              <MasteryView
                onNavigateToPlanner={() => setActiveTab("planner")}
              />
            )}
            {activeTab === "comparison" && (
              <ComparisonView documents={documents} />
            )}
            {activeTab === "review" && <ReviewView documents={documents} />}
            {activeTab === "planner" && <StudyPlannerView />}
            {activeTab === "evaluation" && (
              <EvaluationView
                providers={providers}
                onRefreshProviders={() => fetchDiagnostics(currentUser?.id)}
              />
            )}
          </Workspace>
        )
      )}

      {/* Command Palette (⌘K) */}
      <CommandPalette
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={(tab) => setActiveTab(tab)}
        onQuickAsk={(text) => {
          setQuickAsk({ text, id: Date.now() });
          setActiveTab("tutor");
        }}
      />

      {/* User Management & Profile Modal */}
      {isAuthOpen && (
        <LoginPage
          currentUser={currentUser}
          onLoginSuccess={handleLoginSuccess}
          onLogout={handleLogout}
          isModal={true}
          onCloseModal={() => setIsAuthOpen(false)}
        />
      )}

      {/* Model & API Key Settings Modal */}
      <ModelSettingsModal
        isOpen={isModelSettingsOpen}
        onClose={() => setIsModelSettingsOpen(false)}
        activeProvider={activeProvider}
        onSelectProvider={handleSelectProvider}
        geminiKey={geminiKey}
        onSaveGeminiKey={handleSaveGeminiKey}
        groqKey={groqKey}
        onSaveGroqKey={handleSaveGroqKey}
        providers={providers}
        onRefreshDiagnostics={() => fetchDiagnostics(currentUser?.id)}
      />
    </div>
  );
}
