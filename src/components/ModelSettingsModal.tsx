import { useOverlayFocus } from "../hooks/useOverlayFocus.js";
import React, { useEffect, useState } from "react";
import {
  X,
  Sparkles,
  Check,
  Zap,
  ExternalLink,
  ShieldCheck,
  Key,
  RefreshCw,
} from "lucide-react";
import { LLMProviderId, ProviderDiagnostic } from "../types.js";

interface ModelSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProvider: LLMProviderId;
  onSelectProvider: (provider: LLMProviderId) => void;
  geminiKey: string;
  onSaveGeminiKey: (key: string) => void;
  groqKey: string;
  onSaveGroqKey: (key: string) => void;
  providers: ProviderDiagnostic[];
  onRefreshDiagnostics: () => void;
}

export const ModelSettingsModal: React.FC<ModelSettingsModalProps> = ({
  isOpen,
  onClose,
  activeProvider,
  onSelectProvider,
  geminiKey,
  onSaveGeminiKey,
  groqKey,
  onSaveGroqKey,
  providers,
  onRefreshDiagnostics,
}) => {
  const [draftProvider, setDraftProvider] = useState(activeProvider);
  const [inputGeminiKey, setInputGeminiKey] = useState(geminiKey);
  const [inputGroqKey, setInputGroqKey] = useState(groqKey);
  const [testStatus, setTestStatus] = useState<
    Record<
      string,
      {
        testing: boolean;
        success?: boolean;
        latencyMs?: number;
        message?: string;
      }
    >
  >({});
  const [savedNotice, setSavedNotice] = useState(false);

  const overlayRef = useOverlayFocus(isOpen, onClose);

  useEffect(() => {
    if (isOpen) {
      setInputGeminiKey(geminiKey);
      setInputGroqKey(groqKey);
      setDraftProvider(activeProvider);
    }
  }, [isOpen, geminiKey, groqKey, activeProvider]);
  if (!isOpen) return null;

  const geminiDiag = providers.find((p) => p.id === "gemini");
  const geminiLiteDiag = providers.find((p) => p.id === "gemini-lite");
  const isServerGeminiActive =
    geminiDiag?.status === "online" || geminiLiteDiag?.status === "online";

  const handleTestKey = async (provider: "gemini" | "groq") => {
    const keyToTest = provider === "gemini" ? inputGeminiKey : inputGroqKey;
    if (!keyToTest.trim()) {
      setTestStatus((prev) => ({
        ...prev,
        [provider]: {
          testing: false,
          success: false,
          message: "Please enter an API key first",
        },
      }));
      return;
    }

    setTestStatus((prev) => ({ ...prev, [provider]: { testing: true } }));

    try {
      const res = await fetch("/api/auth/test-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, apiKey: keyToTest.trim() }),
      });
      const data = await res.json();
      if (data.success && data.result?.ok) {
        setTestStatus((prev) => ({
          ...prev,
          [provider]: {
            testing: false,
            success: true,
            latencyMs: data.result.latencyMs,
            message: `Connected successfully (${data.result.latencyMs}ms)`,
          },
        }));
      } else {
        setTestStatus((prev) => ({
          ...prev,
          [provider]: {
            testing: false,
            success: false,
            message: data.result?.message || data.error || "Connection failed",
          },
        }));
      }
    } catch (err: any) {
      setTestStatus((prev) => ({
        ...prev,
        [provider]: {
          testing: false,
          success: false,
          message: err.message || "Network test failed",
        },
      }));
    }
  };

  const handleSave = () => {
    onSelectProvider(draftProvider);
    onSaveGeminiKey(inputGeminiKey.trim());
    onSaveGroqKey(inputGroqKey.trim());
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      onRefreshDiagnostics();
      onClose();
    }, 800);
  };

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label="Model settings"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="w-full max-w-xl bg-surface rounded-2xl border border-default shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-default flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent-soft text-accent flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-primary">
                Cognify AI Model & Engine Settings
              </h3>
              <p className="text-xs text-muted">
                Configure provider access or use built-in practice material
              </p>
            </div>
          </div>
          <button
            aria-label="Close model settings"
            onClick={onClose}
            className="ui-control p-1.5 rounded-lg text-muted hover:text-secondary hover:text-primary hover:bg-elevated transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
          {/* Active Model Selector */}
          <div>
            <label className="font-semibold text-primary block mb-2">
              Primary Active Intelligence Engine
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Gemini */}
              <button
                type="button"
                aria-pressed={
                  draftProvider === "gemini" || draftProvider === "gemini-lite"
                }
                onClick={() => setDraftProvider("gemini")}
                className={`ui-control p-3 rounded-xl border text-left transition relative ${
                  draftProvider === "gemini" || draftProvider === "gemini-lite"
                    ? "border-accent bg-accent-soft text-primary"
                    : "border-default hover:border-default text-secondary text-primary"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-success-solid animate-pulse" />
                    Google Gemini
                  </span>
                  {(draftProvider === "gemini" ||
                    draftProvider === "gemini-lite") && (
                    <Check className="w-3.5 h-3.5 text-accent" />
                  )}
                </div>
                <p className="text-[11px] text-muted leading-tight">
                  Model availability and usage limits depend on your provider
                  account.
                </p>
              </button>

              {/* Groq Llama */}
              <button
                type="button"
                aria-pressed={draftProvider === "groq"}
                onClick={() => setDraftProvider("groq")}
                className={`ui-control p-3 rounded-xl border text-left transition relative ${
                  draftProvider === "groq"
                    ? "border-accent bg-accent-soft text-primary"
                    : "border-default hover:border-default text-secondary text-primary"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-warning" />
                    Groq Llama 3.3
                  </span>
                  {draftProvider === "groq" && (
                    <Check className="w-3.5 h-3.5 text-accent" />
                  )}
                </div>
                <p className="text-[11px] text-muted leading-tight">
                  Use your configured Groq account. Provider limits apply.
                </p>
              </button>

              {/* Cognify Curriculum */}
              <button
                type="button"
                aria-pressed={draftProvider === "cognify-curriculum"}
                onClick={() => setDraftProvider("cognify-curriculum")}
                className={`ui-control p-3 rounded-xl border text-left transition relative ${
                  draftProvider === "cognify-curriculum"
                    ? "border-accent bg-accent-soft text-primary"
                    : "border-default hover:border-default text-secondary text-primary"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-success" />
                    Built-in curriculum
                  </span>
                  {draftProvider === "cognify-curriculum" && (
                    <Check className="w-3.5 h-3.5 text-accent" />
                  )}
                </div>
                <p className="text-[11px] text-muted leading-tight">
                  Bundled MCA reference material. Requires the application
                  backend; no external model key needed.
                </p>
              </button>
            </div>
          </div>

          {/* API Key Inputs */}
          <div className="space-y-4">
            {/* Google Gemini Key */}
            <div className="p-4 rounded-xl bg-subtle border border-default space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-primary">
                  <Key className="w-3.5 h-3.5 text-accent" />
                  <span>Google Gemini API Key</span>
                </div>
                {isServerGeminiActive && (
                  <span className="text-[10px] text-success bg-success-soft px-2 py-0.5 rounded-md font-medium border border-success">
                    ✓ Connected via Server
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  aria-label="Gemini API key"
                  type="password"
                  value={inputGeminiKey}
                  onChange={(e) => setInputGeminiKey(e.target.value)}
                  placeholder={
                    isServerGeminiActive
                      ? "Using server key (or enter custom key here)..."
                      : "AIzaSy..."
                  }
                  className="ui-field flex-1 bg-surface bg-subtle border border-default rounded-lg px-3 py-1.5 text-xs text-primary font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <button
                  type="button"
                  onClick={() => handleTestKey("gemini")}
                  disabled={testStatus["gemini"]?.testing}
                  className="ui-control px-3 py-1.5 bg-surface bg-elevated hover:bg-elevated border border-default text-secondary text-primary rounded-lg font-medium transition shrink-0"
                >
                  {testStatus["gemini"]?.testing ? "Testing..." : "Test Key"}
                </button>
              </div>

              {testStatus["gemini"]?.message && (
                <div
                  className={`text-[11px] ${
                    testStatus["gemini"].success
                      ? "text-success"
                      : "text-danger"
                  }`}
                >
                  {testStatus["gemini"].message}
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] text-muted pt-1">
                <span>
                  Obtain a key from your provider account. Check current usage
                  limits.
                </span>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent hover:underline flex items-center gap-1 font-medium"
                >
                  <span>Get Gemini Key</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Optional Groq Key */}
            <div className="p-4 rounded-xl bg-subtle border border-default space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-primary">
                  <Key className="w-3.5 h-3.5 text-warning" />
                  <span>Groq API Key (Optional)</span>
                </div>
                <span className="text-[10px] text-muted">
                  Optional for comparison arena
                </span>
              </div>

              <div className="flex gap-2">
                <input
                  aria-label="Groq API key"
                  type="password"
                  value={inputGroqKey}
                  onChange={(e) => setInputGroqKey(e.target.value)}
                  placeholder="gsk_..."
                  className="ui-field flex-1 bg-surface bg-subtle border border-default rounded-lg px-3 py-1.5 text-xs text-primary font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <button
                  type="button"
                  onClick={() => handleTestKey("groq")}
                  disabled={testStatus["groq"]?.testing}
                  className="ui-control px-3 py-1.5 bg-surface bg-elevated hover:bg-elevated border border-default text-secondary text-primary rounded-lg font-medium transition shrink-0"
                >
                  {testStatus["groq"]?.testing ? "Testing..." : "Test Key"}
                </button>
              </div>

              {testStatus["groq"]?.message && (
                <div
                  className={`text-[11px] ${
                    testStatus["groq"].success ? "text-success" : "text-danger"
                  }`}
                >
                  {testStatus["groq"].message}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-subtle border-t border-default flex items-center justify-between">
          <div className="text-[11px] text-muted">
            {savedNotice ? (
              <span className="text-success font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Keys saved to browser session
              </span>
            ) : (
              <span>Keys are stored locally in your browser.</span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="ui-control px-4 py-2 text-secondary text-primary hover:bg-elevated rounded-xl font-medium transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="ui-control px-5 py-2 bg-accent-solid hover:bg-accent-hover text-on-accent rounded-xl font-medium transition flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
