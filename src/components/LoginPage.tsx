import { useOverlayFocus } from "../hooks/useOverlayFocus.js";
import React, { useState, useEffect } from "react";
import { UserProfile } from "../types.js";
import {
  BrainCircuit,
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
} from "lucide-react";

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
  const AccountTitle = isModal ? "h2" : "h1";
  const overlayRef = useOverlayFocus(!!isModal, () => onCloseModal?.());
  const [tab, setTab] = useState<"signin" | "register" | "switch" | "vault">(
    "signin",
  );
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);

  // Sign in form state
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  // Register form state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState<"student" | "evaluator">("student");
  const [regStudentId, setRegStudentId] = useState("");
  const [regInstitution, setRegInstitution] = useState(
    "School of Computer Science & Applications",
  );
  const [regGeminiKey, setRegGeminiKey] = useState("");
  const [regGroqKey, setRegGroqKey] = useState("");

  // Key Vault state
  const [vaultGeminiKey, setVaultGeminiKey] = useState("");
  const [vaultGroqKey, setVaultGroqKey] = useState("");

  // Testing Key states
  const [testResult, setTestResult] = useState<{
    provider: "gemini" | "groq";
    status: "testing" | "success" | "error";
    message: string;
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Safe JSON parsing helper to prevent Unexpected Token errors on HTML 404/500 responses
  const parseJson = async (res: Response) => {
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      if (res.status === 404) {
        throw new Error(
          "Backend API endpoint not found (404). Serverless function is initializing.",
        );
      }
      throw new Error(
        `Server returned non-JSON response (${res.status} ${res.statusText || "Error"}).`,
      );
    }
    return res.json();
  };

  // Fetch registered users
  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/auth/users");
      const data = await parseJson(res);
      if (data.success && Array.isArray(data.users)) {
        setAllUsers(data.users);
      }
    } catch (e) {
      setErrorMsg("Unable to load registered accounts. Use Refresh to retry.");
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
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: signInEmail, password: signInPassword }),
      });
      const data = await parseJson(res);
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || "Login failed. Please verify credentials.");
        return;
      }

      localStorage.setItem("cognify_user_id", data.user.id);
      if (data.token) localStorage.setItem("cognify_auth_token", data.token);
      onLoginSuccess(data.user);
      if (isModal && onCloseModal) onCloseModal();
    } catch (err: any) {
      setErrorMsg(err.message || "Network error during login.");
    } finally {
      setLoading(false);
    }
  };

  // Quick Sign In for Presets
  const handleQuickSignIn = async (email: string) => {
    clearMessages();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: "password123" }),
      });
      const data = await parseJson(res);
      if (data.success) {
        localStorage.setItem("cognify_user_id", data.user.id);
        if (data.token) localStorage.setItem("cognify_auth_token", data.token);
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
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          password: regPassword,
          role: regRole,
          studentId:
            regStudentId || `MCA-2025-${Math.floor(100 + Math.random() * 900)}`,
          institution: regInstitution,
          geminiApiKey: regGeminiKey.trim() || undefined,
          groqApiKey: regGroqKey.trim() || undefined,
        }),
      });

      const data = await parseJson(res);
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || "Registration failed.");
        return;
      }

      localStorage.setItem("cognify_user_id", data.user.id);
      if (data.token) localStorage.setItem("cognify_auth_token", data.token);
      await fetchUsers();
      onLoginSuccess(data.user);
      if (isModal && onCloseModal) onCloseModal();
    } catch (err: any) {
      setErrorMsg(err.message || "Error creating account.");
    } finally {
      setLoading(false);
    }
  };

  // Switch Active User
  const handleSwitchUser = async (user: UserProfile) => {
    clearMessages();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await parseJson(res);
      if (data.success) {
        localStorage.setItem("cognify_user_id", user.id);
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
      const res = await fetch("/api/auth/keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": currentUser.id,
        },
        body: JSON.stringify({
          geminiApiKey: vaultGeminiKey.trim() || undefined,
          groqApiKey: vaultGroqKey.trim() || undefined,
        }),
      });
      const data = await parseJson(res);
      if (data.success) {
        setSuccessMsg(
          "Your personal API keys have been saved to your account vault.",
        );
        onLoginSuccess(data.user);
        await fetchUsers();
      } else {
        setErrorMsg(data.error || "Failed to save keys.");
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Test an API key on the fly
  const handleTestKey = async (provider: "gemini" | "groq", key: string) => {
    if (!key || !key.trim()) {
      setTestResult({
        provider,
        status: "error",
        message: `Please enter a ${provider === "gemini" ? "Gemini" : "Groq"} API key to test.`,
      });
      return;
    }

    setTestResult({
      provider,
      status: "testing",
      message: `Connecting to ${provider === "gemini" ? "Google Gemini 3.8" : "Groq Llama 3.3"}...`,
    });

    try {
      const res = await fetch("/api/auth/test-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, apiKey: key.trim() }),
      });
      const data = await res.json();
      if (data.success && data.result?.ok) {
        setTestResult({
          provider,
          status: "success",
          message: `Success! Model responded in ${data.result.latencyMs}ms. Validated.`,
        });
      } else {
        setTestResult({
          provider,
          status: "error",
          message:
            data.result?.message || data.error || "Key validation failed.",
        });
      }
    } catch (err: any) {
      setTestResult({
        provider,
        status: "error",
        message: err.message || "Key connection error.",
      });
    }
  };

  const containerClasses = isModal
    ? "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
    : "ui-auth-page";

  return (
    <div
      ref={overlayRef}
      role={isModal ? "dialog" : undefined}
      aria-modal={isModal ? true : undefined}
      aria-label={isModal ? "Academic account" : undefined}
      className={containerClasses}
    >
      <div className="ui-dialog-panel bg-surface rounded-xl shadow-xl border border-default w-full max-w-xl overflow-hidden text-primary transition-all">
        {/* Top Header */}
        <div className="p-6 pb-4 border-b border-default bg-subtle">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-solid text-on-accent flex items-center justify-center text-xl shadow-md">
                <BrainCircuit size={22} aria-hidden="true" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <AccountTitle className="text-base font-bold text-primary">
                    Cognify AI
                  </AccountTitle>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent-soft text-accent bg-accent-soft text-accent font-bold">
                    Academic account
                  </span>
                </div>
                <p className="text-xs text-muted">
                  Manage your academic workspace account
                </p>
              </div>
            </div>

            {isModal && onCloseModal && (
              <button
                aria-label="Close account"
                onClick={onCloseModal}
                className="ui-control text-muted hover:text-primary p-1 rounded-md hover:bg-black/5 hover:bg-elevated transition"
              >
                ✕
              </button>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="ui-auth-tabs mt-5 border-b border-default pb-1">
            <button
              onClick={() => {
                setTab("signin");
                clearMessages();
              }}
              className={`ui-control px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                tab === "signin"
                  ? "bg-accent-solid text-on-accent "
                  : "text-muted hover:bg-black/5 hover:bg-elevated"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setTab("register");
                clearMessages();
              }}
              className={`ui-control px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                tab === "register"
                  ? "bg-accent-solid text-on-accent "
                  : "text-muted hover:bg-black/5 hover:bg-elevated"
              }`}
            >
              Create Account
            </button>
            <button
              onClick={() => {
                setTab("switch");
                clearMessages();
                fetchUsers();
              }}
              className={`ui-control px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                tab === "switch"
                  ? "bg-accent-solid text-on-accent "
                  : "text-muted hover:bg-black/5 hover:bg-elevated"
              }`}
            >
              Switch User ({allUsers.length})
            </button>
            <button
              onClick={() => {
                setTab("vault");
                clearMessages();
              }}
              className={`ui-control px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                tab === "vault"
                  ? "bg-accent-solid text-on-accent "
                  : "text-muted hover:bg-black/5 hover:bg-elevated"
              }`}
            >
              My API Keys
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="ui-dialog-body p-6">
          {errorMsg && (
            <div
              role="alert"
              className="mb-4 p-3 rounded-lg bg-danger-soft border border-danger text-xs text-danger flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-danger" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-lg bg-success-soft border border-success text-xs text-success flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-success" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: SIGN IN */}
          {tab === "signin" && (
            <div className="space-y-5">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">
                    Academic Email
                  </label>
                  <input
                    aria-label="Academic Email"
                    type="email"
                    required
                    autoComplete="username"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    placeholder="student@university.edu"
                    className="ui-field w-full px-3 py-2 text-xs rounded-lg border border-default bg-surface bg-subtle text-primary focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-muted">
                      Password
                    </label>
                    <span className="text-[10px] text-accent">
                      Default: password123
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      aria-label="Password"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      placeholder="••••••••"
                      className="ui-field w-full px-3 py-2 text-xs rounded-lg border border-default bg-surface bg-subtle text-primary focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      onClick={() => setShowPassword(!showPassword)}
                      className="ui-control absolute right-2.5 top-2.5 text-muted"
                    >
                      {showPassword ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="ui-control w-full py-2.5 rounded-lg bg-accent-solid hover:bg-accent-hover text-on-accent font-semibold text-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                  <span>
                    {loading ? "Signing in…" : "Sign In to Workspace"}
                  </span>
                </button>
              </form>

              {/* 1-Click Fast Student Demo Profiles */}
              <div className="pt-3 border-t border-default">
                <p className="text-[11px] font-semibold text-muted mb-2 uppercase tracking-wider">
                  One-Click Demo Profiles (For Viva / Evaluation)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleQuickSignIn("samuelcollridgenaik@gmail.com")
                    }
                    className="ui-control p-2.5 rounded-xl border border-default hover:border-accent text-left transition bg-subtle hover:bg-elevated group"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-accent-solid text-on-accent text-xs font-bold flex items-center justify-center">
                        S
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate">
                          Samuel C. Naik
                        </div>
                        <div className="text-[10px] text-muted truncate">
                          MCA Final Year Student
                        </div>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleQuickSignIn("examiner.mca@university.edu")
                    }
                    className="ui-control p-2.5 rounded-xl border border-default hover:border-accent text-left transition bg-subtle hover:bg-elevated group"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-accent-solid text-on-accent text-xs font-bold flex items-center justify-center">
                        R
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate">
                          Dr. R. Ramanathan
                        </div>
                        <div className="text-[10px] text-muted truncate">
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
          {tab === "register" && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">
                    Full Name *
                  </label>
                  <input
                    aria-label="Full Name"
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Samuel Collridge"
                    className="ui-field w-full px-3 py-2 text-xs rounded-lg border border-default bg-surface bg-subtle text-primary focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">
                    Email Address *
                  </label>
                  <input
                    aria-label="Email Address"
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="student@mca.edu"
                    className="ui-field w-full px-3 py-2 text-xs rounded-lg border border-default bg-surface bg-subtle text-primary focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">
                    Password *
                  </label>
                  <input
                    aria-label="Create Password"
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="ui-field w-full px-3 py-2 text-xs rounded-lg border border-default bg-surface bg-subtle text-primary focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">
                    Academic Role
                  </label>
                  <select
                    aria-label="Account Role"
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value as any)}
                    className="ui-field w-full px-3 py-2 text-xs rounded-lg border border-default bg-surface bg-subtle text-primary focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="student">Student / Scholar</option>
                    <option value="evaluator">
                      MCA Faculty / Viva Evaluator
                    </option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">
                    Student / Faculty ID
                  </label>
                  <input
                    aria-label="Student ID"
                    type="text"
                    value={regStudentId}
                    onChange={(e) => setRegStudentId(e.target.value)}
                    placeholder="e.g. MCA-2025-099"
                    className="ui-field w-full px-3 py-2 text-xs rounded-lg border border-default bg-surface bg-subtle text-primary focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">
                    Institution
                  </label>
                  <input
                    aria-label="Institution"
                    type="text"
                    value={regInstitution}
                    onChange={(e) => setRegInstitution(e.target.value)}
                    className="ui-field w-full px-3 py-2 text-xs rounded-lg border border-default bg-surface bg-subtle text-primary focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Individual API Keys Box */}
              <div className="p-3.5 rounded-xl border border-accent bg-accent-soft space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-accent">
                  <Key className="w-3.5 h-3.5" />
                  <span>Personal API Keys Vault (Optional per user)</span>
                </div>
                <p className="text-[11px] text-muted">
                  Each user can provide their own API keys. If left blank,
                  server defaults will be used.
                </p>

                {/* Gemini Key */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-primary">
                      Google Gemini API Key
                    </label>
                    <button
                      type="button"
                      onClick={() => handleTestKey("gemini", regGeminiKey)}
                      className="ui-control text-[10px] text-accent hover:underline font-mono"
                    >
                      Test Key
                    </button>
                  </div>
                  <input
                    aria-label="Gemini API key for registration"
                    type="password"
                    value={regGeminiKey}
                    onChange={(e) => setRegGeminiKey(e.target.value)}
                    placeholder="AIzaSy... (leave blank to use shared server key)"
                    className="ui-field w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-default bg-surface bg-subtle"
                  />
                </div>

                {/* Groq Key */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-primary">
                      Groq Llama API Key
                    </label>
                    <button
                      type="button"
                      onClick={() => handleTestKey("groq", regGroqKey)}
                      className="ui-control text-[10px] text-warning hover:underline font-mono"
                    >
                      Test Key
                    </button>
                  </div>
                  <input
                    aria-label="Groq API key for registration"
                    type="password"
                    value={regGroqKey}
                    onChange={(e) => setRegGroqKey(e.target.value)}
                    placeholder="gsk_... (leave blank to use shared server key)"
                    className="ui-field w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-default bg-surface bg-subtle"
                  />
                </div>

                {testResult && (
                  <div
                    className={`p-2 rounded-lg text-xs flex items-center gap-2 ${
                      testResult.status === "success"
                        ? "bg-success-soft text-success bg-success-soft text-success"
                        : testResult.status === "testing"
                          ? "bg-accent-soft text-accent bg-accent-soft text-accent"
                          : "bg-danger-soft text-danger bg-danger-soft text-danger"
                    }`}
                  >
                    {testResult.status === "testing" ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : testResult.status === "success" ? (
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    )}
                    <span className="font-mono text-[11px]">
                      {testResult.message}
                    </span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="ui-control w-full py-2.5 rounded-lg bg-success-solid hover:bg-success-solid text-on-accent font-semibold text-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>Create Student Account & Enter</span>
              </button>
            </form>
          )}

          {/* TAB 3: SWITCH USER */}
          {tab === "switch" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-muted">
                  Registered Academic Accounts
                </span>
                <button
                  onClick={fetchUsers}
                  className="ui-control text-[11px] text-accent flex items-center gap-1 hover:underline"
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
                      className={`p-3 rounded-xl border transition flex items-center justify-between ${
                        isCurrent
                          ? "border-accent bg-accent-soft"
                          : "border-default hover:bg-black/5 hover:bg-elevated"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-accent-solid text-on-accent font-bold text-xs flex items-center justify-center shrink-0">
                          {u.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-primary truncate">
                              {u.name}
                            </span>
                            {isCurrent && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-accent-solid text-on-accent font-mono">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted truncate">
                            {u.email} ·{" "}
                            {u.role === "evaluator"
                              ? "🎓 Evaluator"
                              : "📚 Student"}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                                u.hasGeminiKey
                                  ? "bg-accent-soft text-accent bg-accent-soft text-accent"
                                  : "bg-black/5 bg-surface text-muted"
                              }`}
                            >
                              Gemini:{" "}
                              {u.hasGeminiKey ? "User Key" : "Server Default"}
                            </span>
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                                u.hasGroqKey
                                  ? "bg-warning-soft text-warning bg-warning-soft text-warning"
                                  : "bg-black/5 bg-surface text-muted"
                              }`}
                            >
                              Groq:{" "}
                              {u.hasGroqKey ? "User Key" : "Server Default"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSwitchUser(u)}
                        disabled={loading || isCurrent}
                        aria-label={`Switch to ${u.name}`}
                        className={`ui-control text-xs px-2.5 py-1 rounded-md font-semibold ${
                          isCurrent
                            ? "bg-accent-solid text-on-accent"
                            : "bg-black/5 bg-surface hover:bg-black/10"
                        }`}
                      >
                        {isCurrent ? "Current" : "Select"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: API KEY VAULT (ACTIVE USER) */}
          {tab === "vault" && !currentUser && (
            <p className="text-sm text-muted">
              Sign in to manage account API keys.
            </p>
          )}
          {tab === "vault" && currentUser && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-subtle border border-default">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-4 h-4 text-accent" />
                  <span className="text-xs font-bold text-primary">
                    Vault for: {currentUser?.name || "Active Account"}
                  </span>
                </div>
                <p className="text-[11px] text-muted">
                  Configure provider credentials for supported workflows. Check
                  provider availability and your account usage limits.
                </p>
              </div>

              <form onSubmit={handleSaveVaultKeys} className="space-y-4">
                {/* Gemini Input */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-primary flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-accent-solid" />
                      Google Gemini API Key
                    </label>
                    <div className="flex items-center gap-2">
                      {currentUser?.hasGeminiKey && (
                        <span className="text-[10px] text-success font-mono font-bold">
                          ✓ Key configured
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleTestKey("gemini", vaultGeminiKey)}
                        className="ui-control text-[10px] text-accent hover:underline font-mono"
                      >
                        Ping Test
                      </button>
                    </div>
                  </div>
                  <input
                    aria-label="Gemini account API key"
                    type="password"
                    value={vaultGeminiKey}
                    onChange={(e) => setVaultGeminiKey(e.target.value)}
                    placeholder={
                      currentUser?.geminiKeyMasked ||
                      "Enter Gemini API key (AIzaSy...)"
                    }
                    className="ui-field w-full px-3 py-2 text-xs font-mono rounded-lg border border-default bg-surface bg-subtle text-primary focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[10px] text-muted mt-1">
                    Powers Workflow A (Grounded Tutor) and Content Audit.
                  </p>
                </div>

                {/* Groq Input */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-primary flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-warning-solid" />
                      Groq Llama API Key
                    </label>
                    <div className="flex items-center gap-2">
                      {currentUser?.hasGroqKey && (
                        <span className="text-[10px] text-success font-mono font-bold">
                          ✓ Key configured
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleTestKey("groq", vaultGroqKey)}
                        className="ui-control text-[10px] text-warning hover:underline font-mono"
                      >
                        Ping Test
                      </button>
                    </div>
                  </div>
                  <input
                    aria-label="Groq account API key"
                    type="password"
                    value={vaultGroqKey}
                    onChange={(e) => setVaultGroqKey(e.target.value)}
                    placeholder={
                      currentUser?.groqKeyMasked ||
                      "Enter Groq API key (gsk_...)"
                    }
                    className="ui-field w-full px-3 py-2 text-xs font-mono rounded-lg border border-default bg-surface bg-subtle text-primary focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[10px] text-muted mt-1">
                    Powers Workflow B (Active Recall Summaries, Flashcards, and
                    Quizzes).
                  </p>
                </div>

                {testResult && (
                  <div
                    className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                      testResult.status === "success"
                        ? "bg-success-soft text-success bg-success-soft text-success"
                        : testResult.status === "testing"
                          ? "bg-accent-soft text-accent bg-accent-soft text-accent"
                          : "bg-danger-soft text-danger bg-danger-soft text-danger"
                    }`}
                  >
                    {testResult.status === "testing" ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : testResult.status === "success" ? (
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    )}
                    <span className="font-mono text-[11px]">
                      {testResult.message}
                    </span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="ui-control w-full py-2.5 rounded-lg bg-accent-solid hover:bg-accent-hover text-on-accent font-semibold text-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Key className="w-4 h-4" />
                  )}
                  <span>Save Keys to Account Vault</span>
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Footer info & Logout */}
        <div className="ui-auth-footer p-3 border-t border-default bg-subtle flex items-center justify-between text-xs text-muted">
          <span>
            Logged in as:{" "}
            <strong className="text-primary">
              {currentUser?.name || "Guest"}
            </strong>
          </span>
          {onLogout && currentUser && (
            <button
              onClick={onLogout}
              className="ui-control text-danger hover:text-danger text-xs font-semibold flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
