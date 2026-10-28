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
import { DocumentMeta, ProviderDiagnostic, UserProfile } from './types.js';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTabId>('tutor');
  const [providers, setProviders] = useState<ProviderDiagnostic[]>([]);
  const [documents, setDocuments] = useState<DocumentMeta[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
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
      const savedUserId = localStorage.getItem('cognify_user_id');
      const headers: Record<string, string> = {};
      if (savedUserId) headers['x-user-id'] = savedUserId;

      const res = await fetch('/api/auth/me', { headers });
      const data = await res.json();
      if (data.success && data.user) {
        setCurrentUser(data.user);
        return data.user;
      }
    } catch (e) {
      console.error('Failed to load user', e);
    }
    return null;
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

  return (
    <div className="min-h-screen bg-[#ffffff] dark:bg-[#191919] text-[#37352f] dark:text-[#e3e2e0] flex font-sans antialiased selection:bg-[#2383e2]/20 selection:text-[#2383e2]">
      {/* Notion Collapsible Sidebar */}
      {currentUser && (
        <NotionSidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          currentUser={currentUser}
          onOpenAuth={() => setIsAuthOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
          docsCount={documents.length}
        />
      )}

      {/* Main Notion Canvas */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
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
        />

        {/* Diagnostics / Configuration Alert */}
        <DiagnosticsBanner providers={providers} />

        {/* Notion Page Workspace Content */}
        <main className="flex-1 px-4 sm:px-8 py-6 max-w-5xl w-full mx-auto">
          {loadingInitial ? (
            <div className="p-20 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-[#2383e2] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-semibold text-[#37352f] dark:text-white">
                Opening Cognify Academic Workspace...
              </p>
              <p className="text-xs text-[#787774] dark:text-[#9b9a97]">
                Connecting to Google Gemini 3.8 and Groq Llama with user key vault...
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

      {/* User Management & API Key Vault Modal */}
      {isAuthOpen && (
        <LoginPage
          currentUser={currentUser}
          onLoginSuccess={handleLoginSuccess}
          onLogout={handleLogout}
          isModal={true}
          onCloseModal={() => setIsAuthOpen(false)}
        />
      )}
    </div>
  );
}
