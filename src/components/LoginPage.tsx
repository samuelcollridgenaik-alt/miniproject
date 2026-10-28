import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types.js';
import {
  Key,
  Shield,
  User,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  RefreshCw,
  LogOut,
  Building2,
  BookOpen,
  Zap,
} from 'lucide-react';

interface LoginPageProps {
  currentUser: UserProfile | null;
  onLoginSuccess: (user: UserProfile) => void;
  onLogout?: () => void;
  isModal?: boolean;
  onCloseModal?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  currentUser,
  onLoginSuccess,
  onLogout,
  isModal = false,
  onCloseModal,
}) => {
  const [tab, setTab] = useState<'signin' | 'register' | 'switch' | 'vault'>('signin');
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);

  // Sign in form state
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('password123');
  const [regRole, setRegRole] = useState<'student' | 'evaluator'>('student');
  const [regStudentId, setRegStudentId] = useState('');
  const [regInstitution, setRegInstitution] = useState('School of Computer Science & Applications');
  const [regGeminiKey, setRegGeminiKey] = useState('');
  const [regGroqKey, setRegGroqKey] = useState('');

  // Key Vault state
  const [vaultGeminiKey, setVaultGeminiKey] = useState('');
  const [vaultGroqKey, setVaultGroqKey] = useState('');

  // Testing Key states
  const [testResult, setTestResult] = useState<{
    provider: 'gemini' | 'groq';
    status: 'testing' | 'success' | 'error';
    message: string;
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Safe JSON parsing helper to prevent Unexpected Token errors on HTML 404/500 responses
  const parseJson = async (res: Response) => {
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      if (res.status === 404) {
        throw new Error('Backend API endpoint not found (404). Serverless function is initializing.');
      }
      throw new Error(`Server returned non-JSON response (${res.status} ${res.statusText || 'Error'}).`);
    }
    return res.json();
  };

  // Fetch registered users
  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/auth/users');
      const data = await parseJson(res);
      if (data.success && Array.isArray(data.users)) {
        setAllUsers(data.users);
      }
    } catch (e) {
      console.warn('Failed to fetch user list:', e);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const clearMessages = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setTestResult(null);
  };

  // Handle Sign In
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: signInEmail, password: signInPassword }),
      });
      const data = await parseJson(res);
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Login failed. Please verify credentials.');
        return;
      }

      localStorage.setItem('cognify_user_id', data.user.id);
      if (data.token) localStorage.setItem('cognify_auth_token', data.token);
      onLoginSuccess(data.user);
      if (isModal && onCloseModal) onCloseModal();
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error during login.');
    } finally {
      setLoading(false);
    }
  };

  // Quick Sign In for Presets
  const handleQuickSignIn = async (email: string) => {
    clearMessages();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'password123' }),
      });
      const data = await parseJson(res);
      if (data.success) {
        localStorage.setItem('cognify_user_id', data.user.id);
        if (data.token) localStorage.setItem('cognify_auth_token', data.token);
        onLoginSuccess(data.user);
        if (isModal && onCloseModal) onCloseModal();
      } else {
        setErrorMsg(data.error);
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          password: regPassword,
          role: regRole,
          studentId: regStudentId || `MCA-2025-${Math.floor(100 + Math.random() * 900)}`,
          institution: regInstitution,
          geminiApiKey: regGeminiKey.trim() || undefined,
          groqApiKey: regGroqKey.trim() || undefined,
        }),
      });

      const data = await parseJson(res);
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Registration failed.');
        return;
      }

      localStorage.setItem('cognify_user_id', data.user.id);
      if (data.token) localStorage.setItem('cognify_auth_token', data.token);
      await fetchUsers();
      onLoginSuccess(data.user);
      if (isModal && onCloseModal) onCloseModal();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating account.');
    } finally {
      setLoading(false);
    }
  };

  // Switch Active User
  const handleSwitchUser = async (user: UserProfile) => {
    clearMessages();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await parseJson(res);
      if (data.success) {
        localStorage.setItem('cognify_user_id', user.id);
        onLoginSuccess(data.user);
        if (isModal && onCloseModal) onCloseModal();
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Update Vault API Keys
  const handleSaveVaultKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    clearMessages();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({
          geminiApiKey: vaultGeminiKey.trim() || undefined,
          groqApiKey: vaultGroqKey.trim() || undefined,
        }),
      });
      const data = await parseJson(res);
      if (data.success) {
        setSuccessMsg('Your personal API keys have been saved to your account vault.');
        onLoginSuccess(data.user);
        await fetchUsers();
      } else {
        setErrorMsg(data.error || 'Failed to save keys.');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Test an API key on the fly
  const handleTestKey = async (provider: 'gemini' | 'groq', key: string) => {
    if (!key || !key.trim()) {
      setTestResult({
        provider,
        status: 'error',
        message: `Please enter a ${provider === 'gemini' ? 'Gemini' : 'Groq'} API key to test.`,
      });
      return;
    }

    setTestResult({
      provider,
      status: 'testing',
      message: `Connecting to ${provider === 'gemini' ? 'Google Gemini 3.8' : 'Groq Llama 3.3'}...`,
    });

    try {
      const res = await fetch('/api/auth/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey: key.trim() }),
      });
      const data = await res.json();
      if (data.success && data.result?.ok) {
        setTestResult({
          provider,
          status: 'success',
          message: `Success! Model responded in ${data.result.latencyMs}ms. Validated.`,
        });
      } else {
        setTestResult({
          provider,
          status: 'error',
          message: data.result?.message || data.error || 'Key validation failed.',
        });
      }
    } catch (err: any) {
      setTestResult({
        provider,
        status: 'error',
        message: err.message || 'Key connection error.',
      });
    }
  };

  const containerClasses = isModal
    ? 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs'
    : 'min-h-screen bg-[#f7f6f3] dark:bg-[#181818] flex items-center justify-center p-4 sm:p-6';

  return (
    <div className={containerClasses}>
      <div className="bg-white dark:bg-[#202020] rounded-2xl shadow-xl border border-[#e9e9e7] dark:border-[#2e2e2e] w-full max-w-xl overflow-hidden text-[#37352f] dark:text-[#e3e2e0] transition-all">
        {/* Top Header */}
        <div className="p-6 pb-4 border-b border-[#e9e9e7] dark:border-[#2b2b2b] bg-slate-50/50 dark:bg-[#242424]/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xl shadow-md">
                🧠
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-[#37352f] dark:text-white">Cognify AI</h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 font-bold">
                    Multi-User & Keys
                  </span>
                </div>
                <p className="text-xs text-[#787774] dark:text-[#9b9a97]">
                  Academic Second Brain with Isolated User Vaults
                </p>
              </div>
            </div>

            {isModal && onCloseModal && (
              <button
                onClick={onCloseModal}
                className="text-[#787774] hover:text-[#37352f] dark:hover:text-white p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition"
              >
                ✕
              </button>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 mt-5 border-b border-[#e9e9e7] dark:border-[#2e2e2e] pb-1">
            <button
              onClick={() => {
                setTab('signin');
                clearMessages();
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                tab === 'signin'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-[#787774] dark:text-[#9b9a97] hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              🔑 Sign In
            </button>
            <button
              onClick={() => {
                setTab('register');
                clearMessages();
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                tab === 'register'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-[#787774] dark:text-[#9b9a97] hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              ✨ Create Account
            </button>
            <button
              onClick={() => {
                setTab('switch');
                clearMessages();
                fetchUsers();
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                tab === 'switch'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-[#787774] dark:text-[#9b9a97] hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              👥 Switch User ({allUsers.length})
            </button>
            <button
              onClick={() => {
                setTab('vault');
                clearMessages();
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                tab === 'vault'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-[#787774] dark:text-[#9b9a97] hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              🔐 My API Keys
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: SIGN IN */}
          {tab === 'signin' && (
            <div className="space-y-5">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#5f5e5b] dark:text-[#9b9a97] mb-1">
                    Academic Email
                  </label>
                  <input
                    type="email"
                    required
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    placeholder="student@university.edu"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#e9e9e7] dark:border-[#383838] bg-white dark:bg-[#191919] text-[#37352f] dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-[#5f5e5b] dark:text-[#9b9a97]">
                      Password
                    </label>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400">Default: password123</span>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[#e9e9e7] dark:border-[#383838] bg-white dark:bg-[#191919] text-[#37352f] dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2.5 text-[#787774]"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  <span>Sign In to Workspace</span>
                </button>
              </form>

              {/* 1-Click Fast Student Demo Profiles */}
              <div className="pt-3 border-t border-[#e9e9e7] dark:border-[#2e2e2e]">
                <p className="text-[11px] font-semibold text-[#787774] dark:text-[#9b9a97] mb-2 uppercase tracking-wider">
                  One-Click Demo Profiles (For Viva / Evaluation)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickSignIn('samuelcollridgenaik@gmail.com')}
                    className="p-2.5 rounded-xl border border-[#e9e9e7] dark:border-[#333] hover:border-blue-500 text-left transition bg-slate-50 dark:bg-[#252525] hover:bg-white dark:hover:bg-[#2c2c2c] group"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                        S
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate">Samuel C. Naik</div>
                        <div className="text-[10px] text-[#787774] dark:text-[#9b9a97] truncate">
                          MCA Final Year Student
                        </div>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickSignIn('examiner.mca@university.edu')}
                    className="p-2.5 rounded-xl border border-[#e9e9e7] dark:border-[#333] hover:border-indigo-500 text-left transition bg-slate-50 dark:bg-[#252525] hover:bg-white dark:hover:bg-[#2c2c2c] group"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                        R
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate">Dr. R. Ramanathan</div>
                        <div className="text-[10px] text-[#787774] dark:text-[#9b9a97] truncate">
                          MCA Viva Examiner
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: REGISTER WITH OWN API KEYS */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#5f5e5b] dark:text-[#9b9a97] mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Samuel Collridge"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#e9e9e7] dark:border-[#383838] bg-white dark:bg-[#191919] text-[#37352f] dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5f5e5b] dark:text-[#9b9a97] mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="student@mca.edu"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#e9e9e7] dark:border-[#383838] bg-white dark:bg-[#191919] text-[#37352f] dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#5f5e5b] dark:text-[#9b9a97] mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#e9e9e7] dark:border-[#383838] bg-white dark:bg-[#191919] text-[#37352f] dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5f5e5b] dark:text-[#9b9a97] mb-1">
                    Academic Role
                  </label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#e9e9e7] dark:border-[#383838] bg-white dark:bg-[#191919] text-[#37352f] dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="student">Student / Scholar</option>
                    <option value="evaluator">MCA Faculty / Viva Evaluator</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#5f5e5b] dark:text-[#9b9a97] mb-1">
                    Student / Faculty ID
                  </label>
                  <input
                    type="text"
                    value={regStudentId}
                    onChange={(e) => setRegStudentId(e.target.value)}
                    placeholder="e.g. MCA-2025-099"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#e9e9e7] dark:border-[#383838] bg-white dark:bg-[#191919] text-[#37352f] dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5f5e5b] dark:text-[#9b9a97] mb-1">
                    Institution
                  </label>
                  <input
                    type="text"
                    value={regInstitution}
                    onChange={(e) => setRegInstitution(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#e9e9e7] dark:border-[#383838] bg-white dark:bg-[#191919] text-[#37352f] dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Individual API Keys Box */}
              <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900 dark:text-blue-200">
                  <Key className="w-3.5 h-3.5" />
                  <span>Personal API Keys Vault (Optional per user)</span>
                </div>
                <p className="text-[11px] text-[#787774] dark:text-[#9b9a97]">
                  Each user can provide their own API keys. If left blank, server defaults will be used.
                </p>

                {/* Gemini Key */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-[#37352f] dark:text-white">
                      Google Gemini API Key
                    </label>
                    <button
                      type="button"
                      onClick={() => handleTestKey('gemini', regGeminiKey)}
                      className="text-[10px] text-blue-600 hover:underline font-mono"
                    >
                      Test Key
                    </button>
                  </div>
                  <input
                    type="password"
                    value={regGeminiKey}
                    onChange={(e) => setRegGeminiKey(e.target.value)}
                    placeholder="AIzaSy... (leave blank to use shared server key)"
                    className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-[#e9e9e7] dark:border-[#383838] bg-white dark:bg-[#191919]"
                  />
                </div>

                {/* Groq Key */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-[#37352f] dark:text-white">
                      Groq Llama API Key
                    </label>
                    <button
                      type="button"
                      onClick={() => handleTestKey('groq', regGroqKey)}
                      className="text-[10px] text-amber-600 hover:underline font-mono"
                    >
                      Test Key
                    </button>
                  </div>
                  <input
                    type="password"
                    value={regGroqKey}
                    onChange={(e) => setRegGroqKey(e.target.value)}
                    placeholder="gsk_... (leave blank to use shared server key)"
                    className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-[#e9e9e7] dark:border-[#383838] bg-white dark:bg-[#191919]"
                  />
                </div>

                {testResult && (
                  <div
                    className={`p-2 rounded-lg text-xs flex items-center gap-2 ${
                      testResult.status === 'success'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : testResult.status === 'testing'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                    }`}
                  >
                    {testResult.status === 'testing' ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : testResult.status === 'success' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    )}
                    <span className="font-mono text-[11px]">{testResult.message}</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>Create Student Account & Enter</span>
              </button>
            </form>
          )}

          {/* TAB 3: SWITCH USER */}
          {tab === 'switch' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#787774] dark:text-[#9b9a97]">
                  Registered Academic Accounts
                </span>
                <button
                  onClick={fetchUsers}
                  className="text-[11px] text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline"
                >
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
              </div>

              <div className="space-y-2">
                {allUsers.map((u) => {
                  const isCurrent = currentUser?.id === u.id;
                  return (
                    <div
                      key={u.id}
                      onClick={() => handleSwitchUser(u)}
                      className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                        isCurrent
                          ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                          : 'border-[#e9e9e7] dark:border-[#333] hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {u.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#37352f] dark:text-white truncate">
                              {u.name}
                            </span>
                            {isCurrent && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-600 text-white font-mono">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#787774] dark:text-[#9b9a97] truncate">
                            {u.email} · {u.role === 'evaluator' ? '🎓 Evaluator' : '📚 Student'}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                                u.hasGeminiKey
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200'
                                  : 'bg-black/5 dark:bg-white/5 text-[#787774]'
                              }`}
                            >
                              Gemini: {u.hasGeminiKey ? 'User Key' : 'Server Default'}
                            </span>
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                                u.hasGroqKey
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200'
                                  : 'bg-black/5 dark:bg-white/5 text-[#787774]'
                              }`}
                            >
                              Groq: {u.hasGroqKey ? 'User Key' : 'Server Default'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        className={`text-xs px-2.5 py-1 rounded-md font-semibold ${
                          isCurrent
                            ? 'bg-blue-600 text-white'
                            : 'bg-black/5 dark:bg-white/10 hover:bg-black/10'
                        }`}
                      >
                        {isCurrent ? 'Current' : 'Select'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: API KEY VAULT (ACTIVE USER) */}
          {tab === 'vault' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#252525] border border-[#e9e9e7] dark:border-[#333]">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-[#37352f] dark:text-white">
                    Vault for: {currentUser?.name || 'Active Account'}
                  </span>
                </div>
                <p className="text-[11px] text-[#787774] dark:text-[#9b9a97]">
                  Configure your private LLM credentials. When set, all academic inquiries, flashcard synthesis, and quiz generation are executed against your personal quota.
                </p>
              </div>

              <form onSubmit={handleSaveVaultKeys} className="space-y-4">
                {/* Gemini Input */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-[#37352f] dark:text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-600" />
                      Google Gemini API Key
                    </label>
                    <div className="flex items-center gap-2">
                      {currentUser?.hasGeminiKey && (
                        <span className="text-[10px] text-emerald-600 font-mono font-bold">
                          ✓ Key configured
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleTestKey('gemini', vaultGeminiKey)}
                        className="text-[10px] text-blue-600 hover:underline font-mono"
                      >
                        Ping Test
                      </button>
                    </div>
                  </div>
                  <input
                    type="password"
                    value={vaultGeminiKey}
                    onChange={(e) => setVaultGeminiKey(e.target.value)}
                    placeholder={currentUser?.geminiKeyMasked || 'Enter Gemini API key (AIzaSy...)'}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-[#e9e9e7] dark:border-[#383838] bg-white dark:bg-[#191919] text-[#37352f] dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[10px] text-[#787774] dark:text-[#9b9a97] mt-1">
                    Powers Workflow A (Grounded Tutor) and Content Audit.
                  </p>
                </div>

                {/* Groq Input */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-[#37352f] dark:text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      Groq Llama API Key
                    </label>
                    <div className="flex items-center gap-2">
                      {currentUser?.hasGroqKey && (
                        <span className="text-[10px] text-emerald-600 font-mono font-bold">
                          ✓ Key configured
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleTestKey('groq', vaultGroqKey)}
                        className="text-[10px] text-amber-600 hover:underline font-mono"
                      >
                        Ping Test
                      </button>
                    </div>
                  </div>
                  <input
                    type="password"
                    value={vaultGroqKey}
                    onChange={(e) => setVaultGroqKey(e.target.value)}
                    placeholder={currentUser?.groqKeyMasked || 'Enter Groq API key (gsk_...)'}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-[#e9e9e7] dark:border-[#383838] bg-white dark:bg-[#191919] text-[#37352f] dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[10px] text-[#787774] dark:text-[#9b9a97] mt-1">
                    Powers Workflow B (Active Recall Summaries, Flashcards, and Quizzes).
                  </p>
                </div>

                {testResult && (
                  <div
                    className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                      testResult.status === 'success'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : testResult.status === 'testing'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                    }`}
                  >
                    {testResult.status === 'testing' ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : testResult.status === 'success' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    )}
                    <span className="font-mono text-[11px]">{testResult.message}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                  <span>Save Keys to Account Vault</span>
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Footer info & Logout */}
        <div className="p-3 border-t border-[#e9e9e7] dark:border-[#2b2b2b] bg-slate-50/50 dark:bg-[#242424]/50 flex items-center justify-between text-xs text-[#787774] dark:text-[#9b9a97]">
          <span>Logged in as: <strong className="text-[#37352f] dark:text-white">{currentUser?.name || 'Guest'}</strong></span>
          {onLogout && currentUser && (
            <button
              onClick={onLogout}
              className="text-red-600 hover:text-red-700 text-xs font-semibold flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
