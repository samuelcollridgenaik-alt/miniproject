import React, { useEffect, useState } from 'react';
import { NotionSidebar, NavTabId } from './components/NotionSidebar.js';
import { NotionTopbar } from './components/NotionTopbar.js';
import { CommandPalette } from './components/CommandPalette.js';
import { DiagnosticsBanner } from './components/DiagnosticsBanner.js';
import { LoginPage } from './components/LoginPage.js';
import { TutorView } from './components/TutorView.js';
import { DocumentsView } from './components/DocumentsView.js';
import { StudyMaterialView } from './components/StudyMaterialView.js';
import { QuizView } from './components/QuizView.js';
import { MasteryView } from './components/MasteryView.js';
import { ComparisonView } from './components/ComparisonView.js';
import { ReviewView } from './components/ReviewView.js';
import { StudyPlannerView } from './components/StudyPlannerView.js';
import { EvaluationView } from './components/EvaluationView.js';
import { ModelSettingsModal } from './components/ModelSettingsModal.js';
import { DocumentMeta, LLMProviderId, ProviderDiagnostic, UserProfile } from './types.js';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTabId>('tutor');
  const [providers, setProviders] = useState<ProviderDiagnostic[]>([]);
  const [documents, setDocuments] = useState<DocumentMeta[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isModelSettingsOpen, setIsModelSettingsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeProvider, setActiveProvider] = useState<LLMProviderId>(() => {
    return (localStorage.getItem('cognify_preferred_provider') as LLMProviderId) || 'gemini';
  });
  const [geminiKey, setGeminiKey] = useState<string>(() => {
    return localStorage.getItem('cognify_gemini_key') || '';
  });
  const [groqKey, setGroqKey] = useState<string>(() => {
    return localStorage.getItem('cognify_groq_key') || '';
  });
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('cognify_theme') as 'light' | 'dark') || 'light';
  });
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Handle Theme switching
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('cognify_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const fetchDiagnostics = async (userId?: string) => {
    try {
      const activeId = userId || currentUser?.id || localStorage.getItem('cognify_user_id') || '';
      const headers: Record<string, string> = {};
      if (activeId) headers['x-user-id'] = activeId;
      if (geminiKey) headers['x-gemini-key'] = geminiKey;
      if (groqKey) headers['x-groq-key'] = groqKey;

      const res = await fetch('/api/diagnostics', { headers });
      const data = await res.json();
      if (data.success) {
        setProviders(data.providers || []);
      }
    } catch (e) {
      console.error('Failed to fetch diagnostics', e);
    }
  };

  const fetchDocuments = async (userId?: string) => {
    try {
      const activeId = userId || currentUser?.id || localStorage.getItem('cognify_user_id') || '';
      const headers: Record<string, string> = {};
      if (activeId) headers['x-user-id'] = activeId;

      const res = await fetch('/api/documents', { headers });
      const data = await res.json();
      if (data.success) {
        setDocuments(data.documents || []);

        // Preload sample MCA lecture notes if empty
        if ((!data.documents || data.documents.length === 0) && !localStorage.getItem('cognify_seeded')) {
          handleSeedSample(false, activeId);
          localStorage.setItem('cognify_seeded', 'true');
        }
      }
    } catch (e) {
      console.error('Failed to fetch documents', e);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const savedUserId = localStorage.getItem('cognify_user_id') || 'usr_default_samuel';
      const headers: Record<string, string> = {};
      if (savedUserId) headers['x-user-id'] = savedUserId;

      const res = await fetch('/api/auth/me', { headers });
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (data.success && data.user) {
          setCurrentUser(data.user);
          return data.user;
        }
      }
    } catch (e) {
      console.warn('Safe fallback to default profile:', e);
    }
    const fallbackProfile: UserProfile = {
      id: 'usr_default_samuel',
      name: 'Samuel Collridge Naik',
      email: 'samuelcollridgenaik@gmail.com',
      studentId: 'MCA-2025-084',
      institution: 'School of Computer Science & Applications',
      program: 'Master of Computer Applications (MCA)',
      semester: 'IV Semester',
      role: 'student',
      createdAt: new Date().toISOString(),
      hasGeminiKey: true,
    };
    setCurrentUser(fallbackProfile);
    return fallbackProfile;
  };

  const handleSeedSample = async (showNotification: boolean = true, userId?: string) => {
    try {
      const activeId = userId || currentUser?.id || '';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (activeId) headers['x-user-id'] = activeId;

      const res = await fetch('/api/seed-sample-doc', {
        method: 'POST',
        headers,
      });
      const data = await res.json();
      if (data.success) {
        await fetchDocuments(activeId);
      }
    } catch (e: any) {
      console.error('Seed sample failed', e);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('cognify_user_id');
    localStorage.removeItem('cognify_auth_token');
    setCurrentUser(null);
    setIsAuthOpen(false);
  };

  const handleLoginSuccess = async (user: UserProfile) => {
    setCurrentUser(user);
    localStorage.setItem('cognify_user_id', user.id);
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
    localStorage.setItem('cognify_gemini_key', key);
  };

  const handleSaveGroqKey = (key: string) => {
    setGroqKey(key);
    localStorage.setItem('cognify_groq_key', key);
  };

  const handleSelectProvider = (prov: LLMProviderId) => {
    setActiveProvider(prov);
    localStorage.setItem('cognify_preferred_provider', prov);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFD] dark:bg-[#131314] text-[#1F1F1F] dark:text-[#E3E3E3] font-sans antialiased transition-colors duration-150 selection:bg-indigo-500/20 selection:text-indigo-600">
      {/* Collapsible Notion Sidebar */}
      <NotionSidebar
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        currentUser={
          currentUser || {
            id: 'usr_default_samuel',
            name: 'Samuel Collridge Naik',
            email: 'samuelcollridgenaik@gmail.com',
            role: 'student',
            program: 'MCA',
            semester: 'IV Semester',
            studentId: 'MCA-2025-084',
            institution: 'School of Computer Science & Applications',
            createdAt: new Date().toISOString(),
          }
        }
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        docsCount={documents.length}
      />

      {/* Main Page Area */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto min-w-0">
        {/* Top Notion Action & Breadcrumb Bar */}
        <NotionTopbar
          activeTab={activeTab}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenSearch={() => setIsSearchOpen(true)}
          onSelectTab={setActiveTab}
          providers={providers}
          totalDocs={documents.length}
          onOpenModelSettings={() => setIsModelSettingsOpen(true)}
        />

        {/* Diagnostics / Configuration Alert */}
        <DiagnosticsBanner
          providers={providers}
          onOpenModelSettings={() => setIsModelSettingsOpen(true)}
        />

        {/* Notion Page Workspace Content */}
        <main className="flex-1 px-4 sm:px-8 py-6 max-w-5xl w-full mx-auto">
          {loadingInitial ? (
            <div className="p-20 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-semibold text-slate-800 dark:text-white">
                Opening Cognify Academic Workspace...
              </p>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Grounding lecture notes and syllabus models...
              </p>
            </div>
          ) : (
            <>
              {activeTab === 'tutor' && (
                <TutorView
                  documents={documents}
                  onSeedSample={() => handleSeedSample(true)}
                  onNavigateToDocuments={() => setActiveTab('documents')}
                />
              )}
              {activeTab === 'documents' && (
                <DocumentsView
                  documents={documents}
                  onRefresh={() => fetchDocuments(currentUser?.id)}
                  onSeedSample={() => handleSeedSample(true)}
                />
              )}
              {activeTab === 'study' && <StudyMaterialView documents={documents} />}
              {activeTab === 'quiz' && (
                <QuizView
                  documents={documents}
                  onQuizCompleted={() => fetchDocuments(currentUser?.id)}
                  onOpenModelSettings={() => setIsModelSettingsOpen(true)}
                />
              )}
              {activeTab === 'mastery' && (
                <MasteryView onNavigateToPlanner={() => setActiveTab('planner')} />
              )}
              {activeTab === 'comparison' && <ComparisonView documents={documents} />}
              {activeTab === 'review' && <ReviewView documents={documents} />}
              {activeTab === 'planner' && <StudyPlannerView />}
              {activeTab === 'evaluation' && (
                <EvaluationView
                  providers={providers}
                  onRefreshProviders={() => fetchDiagnostics(currentUser?.id)}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Command Palette (⌘K) */}
      <CommandPalette
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={(tab) => setActiveTab(tab)}
        onQuickAsk={(_q) => {
          setActiveTab('tutor');
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

