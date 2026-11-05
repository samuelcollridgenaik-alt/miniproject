import React, { useEffect, useRef, useState } from "react";
import "katex/dist/katex.min.css";
import "highlight.js/styles/github-dark.css";
const AnswerText = React.lazy(() => import("./AnswerText.js"));
import {
  ArrowUp,
  Square,
  ArrowDown,
  Sparkles,
  Plus,
  Copy,
  Check,
  RotateCcw,
  BookOpen,
} from "lucide-react";
import type {
  DocumentMeta,
  GroundedAnswerData,
  LLMProviderId,
  ProviderDiagnostic,
} from "../types.js";
import type { Conversation, ChatTurn } from "../hooks/useConversations.js";
interface Props {
  documents: DocumentMeta[];
  conversation: Conversation;
  onUpdate: (
    id: string,
    patch: Partial<Conversation> | ((c: Conversation) => Partial<Conversation>),
  ) => void;
  onSeedSample: () => void;
  onNavigateToDocuments: () => void;
  provider: LLMProviderId;
  onProvider: (provider: LLMProviderId) => void;
  providers: ProviderDiagnostic[];
  userId: string;
}
function Answer({
  answer,
  onRetry,
}: {
  answer: GroundedAnswerData;
  onRetry: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");
  return (
    <article className="assistant-message">
      <div className="response-meta">
        <Sparkles size={15} />
        <strong>Cognify</strong>
        <span>
          {answer.provider === "cognify-curriculum"
            ? "Built-in syllabus engine"
            : answer.model}{" "}
          · {answer.latencyMs} ms
        </span>
      </div>
      <React.Suspense fallback={<div role="status">Formatting answer…</div>}>
        <AnswerText text={answer.answer} />
      </React.Suspense>
      <div className="response-grounding">
        {answer.provider === "cognify-curriculum"
          ? "Built-in reference material / not live AI / verify against your notes"
          : answer.isSufficientlyGrounded
            ? `Source match: ${Math.round(answer.groundingConfidence * 100)}%`
            : "Curriculum synthesis · verify important details"}{" "}
        · {answer.retrievedChunksCount} chunks retrieved
      </div>
      {!!answer.citations?.length && (
        <details className="citations">
          <summary>
            <BookOpen size={14} />
            Course excerpts · {answer.citations.length}
          </summary>
          {answer.citations.map((c, i) => (
            <blockquote key={i}>
              <strong>
                {c.source}
                {c.pageOrSlide != null
                  ? ` · Page / slide ${c.pageOrSlide}`
                  : ""}
              </strong>
              <p>{c.quoteSnippet}</p>
            </blockquote>
          ))}
        </details>
      )}
      <div className="response-actions">
        <button
          title="Copy response"
          aria-label="Copy response"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(answer.answer);
              setCopied(true);
              setCopyError("");
            } catch {
              setCopyError(
                "Clipboard unavailable. Select and copy the response text.",
              );
            }
          }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
        <button
          title="Ask again using current settings"
          aria-label="Regenerate answer"
          onClick={onRetry}
        >
          <RotateCcw size={14} />
        </button>
        {copyError && <span role="status">{copyError}</span>}
      </div>
    </article>
  );
}
export function TutorView(p: Props) {
  const c = p.conversation;
  const [busy, setBusy] = useState(false);
  const [nearBottom, setNearBottom] = useState(true);
  const pending = useRef(false);
  const controller = useRef<AbortController | null>(null);
  const scroll = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    if (nearBottom)
      scroll.current?.scrollTo({
        top: scroll.current.scrollHeight,
        behavior: "auto",
      });
  }, [c.turns, busy, nearBottom]);
  useEffect(() => {
    const resizeInput = () => {
      if (!input.current) return;
      input.current.style.height = "auto";
      input.current.style.height = `${Math.min(input.current.scrollHeight, 180)}px`;
    };
    resizeInput();
    window.addEventListener("resize", resizeInput);
    return () => window.removeEventListener("resize", resizeInput);
  }, [c.draft]);
  const ask = async (query = c.draft) => {
    if (!query.trim() || pending.current) return;
    pending.current = true;
    setBusy(true);
    setNearBottom(true);
    const id = crypto.randomUUID();
    const conversationId = c.id;
    p.onUpdate(conversationId, (prev) => ({
      draft: "",
      title: prev.turns.length ? prev.title : query.trim().slice(0, 65),
      updatedAt: Date.now(),
      turns: [...prev.turns, { id, question: query.trim() }],
    }));
    const finish = (patch: Partial<ChatTurn>) =>
      p.onUpdate(conversationId, (prev) => ({
        updatedAt: Date.now(),
        turns: prev.turns.map((t) => (t.id === id ? { ...t, ...patch } : t)),
      }));
    controller.current = new AbortController();
    const timeout = window.setTimeout(() => controller.current?.abort(), 90000);
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "x-user-id": p.userId,
        "x-preferred-provider": p.provider,
      };
      const gemini = localStorage.getItem("cognify_gemini_key");
      const groq = localStorage.getItem("cognify_groq_key");
      if (gemini) headers["x-gemini-key"] = gemini;
      if (groq) headers["x-groq-key"] = groq;
      const response = await fetch("/api/tutor/ask", {
        method: "POST",
        headers,
        signal: controller.current.signal,
        body: JSON.stringify({
          question:
            c.mode === "kid"
              ? `${query}\n\n[Persona: Explain this simply and cheerfully with everyday analogies for a beginner.]`
              : query,
          documentIdFilter: c.documentId || undefined,
          preferredProvider: p.provider,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success || !data.data)
        throw new Error(
          data.error || "Unable to get an answer. Please try again.",
        );
      finish({ answer: data.data });
    } catch (error) {
      finish({
        error:
          error instanceof Error && error.name === "AbortError"
            ? "Request stopped or timed out. You can retry below."
            : error instanceof Error
              ? error.message
              : "Unable to reach Cognify. Please try again.",
      });
    } finally {
      clearTimeout(timeout);
      pending.current = false;
      setBusy(false);
    }
  };
  const starters = [
    ["Paging & Memory", "Explain paging vs segmentation and fragmentation."],
    [
      "ACID Guarantees",
      "Why are ACID properties essential for transactional databases?",
    ],
    ["Raft Consensus", "How does Raft leader election prevent split votes?"],
    ["Cache Hierarchies", "How do L1, L2, and L3 caches reduce memory stalls?"],
  ];
  return (
    <section
      id="conversation-panel"
      role="tabpanel"
      aria-labelledby={`tab-${c.id}`}
      className="tutor-workspace"
    >
      <div
        className="conversation-scroll"
        ref={scroll}
        onScroll={(e) => {
          const el = e.currentTarget;
          setNearBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 100);
        }}
      >
        {!c.turns.length ? (
          <div className="chat-welcome">
            <span className="welcome-symbol">
              <BrainMark />
            </span>
            <span className="eyebrow">YOUR ACADEMIC WORKSPACE</span>
            <h1>
              Make room for your next
              <br />
              <span>big understanding.</span>
            </h1>
            <p>
              Explore a concept. Connect your notes. Learn something that stays.
            </p>
            <div className="starter-grid">
              {starters.map(([title, prompt]) => (
                <button
                  key={title}
                  disabled={busy}
                  onClick={() => {
                    p.onUpdate(c.id, { draft: prompt });
                    input.current?.focus();
                  }}
                >
                  <BookOpen size={16} />
                  <span>{title}</span>
                  <Plus size={13} />
                </button>
              ))}
            </div>
            {!p.documents.length && (
              <div className="welcome-notes">
                Start with your own course notes, or{" "}
                <button onClick={p.onSeedSample}>load sample MCA notes</button>.
              </div>
            )}
          </div>
        ) : (
          <div className="conversation-column">
            {c.turns.map((t) => (
              <div className="conversation-turn" key={t.id}>
                <div className="user-message">{t.question}</div>
                {t.answer && (
                  <Answer answer={t.answer} onRetry={() => ask(t.question)} />
                )}
                {!t.answer && !t.error && !busy && (
                  <div className="chat-error" role="status">
                    This request has no saved answer.
                    <button onClick={() => ask(t.question)}>Retry</button>
                  </div>
                )}
                {t.error && (
                  <div role="alert" className="chat-error">
                    {t.error}
                    <button disabled={busy} onClick={() => ask(t.question)}>
                      Retry
                    </button>
                  </div>
                )}
              </div>
            ))}
            {busy && (
              <div className="thinking" role="status">
                <Sparkles size={16} />
                <span>Working through your question…</span>
              </div>
            )}
          </div>
        )}
      </div>
      {!nearBottom && (
        <button
          className="scroll-bottom"
          aria-label="Scroll to latest message"
          onClick={() => {
            setNearBottom(true);
            scroll.current?.scrollTo({ top: scroll.current.scrollHeight });
          }}
        >
          <ArrowDown size={16} />
          Latest
        </button>
      )}
      <div className="composer-region">
        <form
          className="message-composer"
          onSubmit={(e) => {
            e.preventDefault();
            ask();
          }}
        >
          <textarea
            ref={input}
            aria-label="Message Cognify"
            rows={1}
            value={c.draft}
            maxLength={16000}
            placeholder="Ask Cognify anything about your course…"
            onChange={(e) => p.onUpdate(c.id, { draft: e.target.value })}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                !e.shiftKey &&
                !e.nativeEvent.isComposing
              ) {
                e.preventDefault();
                ask();
              }
            }}
          />
          <div className="composer-toolbar">
            <button
              type="button"
              className="icon-button"
              title="Upload or manage course notes"
              aria-label="Upload or manage course notes"
              onClick={p.onNavigateToDocuments}
            >
              <Plus size={19} />
            </button>
            <select
              aria-label="Course context"
              value={c.documentId}
              onChange={(e) => p.onUpdate(c.id, { documentId: e.target.value })}
            >
              <option value="">All course notes</option>
              {p.documents.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
            </select>
            <select
              aria-label="Academic mode"
              value={c.mode}
              onChange={(e) =>
                p.onUpdate(c.id, { mode: e.target.value as "kid" | "scholar" })
              }
            >
              <option value="kid">Simple & Fun</option>
              <option value="scholar">Academic Pro</option>
            </select>
            <div className="composer-spacer" />
            <select
              className="provider-select"
              aria-label="Preferred model provider"
              value={p.provider}
              onChange={(e) => p.onProvider(e.target.value as LLMProviderId)}
            >
              <option value="gemini">Gemini · preferred</option>
              <option value="gemini-lite">Gemini Lite · preferred</option>
              <option value="groq">Groq · preferred</option>
              <option value="cognify-curriculum">Built-in syllabus</option>
            </select>
            <button
              type={busy ? "button" : "submit"}
              className="send-button"
              aria-label={busy ? "Stop response" : "Send message"}
              onClick={busy ? () => controller.current?.abort() : undefined}
              disabled={!busy && !c.draft.trim()}
            >
              {busy ? (
                <Square size={12} fill="currentColor" />
              ) : (
                <ArrowUp size={18} />
              )}
            </button>
          </div>
        </form>
        <p className="composer-footnote">
          Cognify can make mistakes. Check source excerpts.{" "}
          <span>Enter to send · Shift + Enter for a new line</span>
        </p>
      </div>
    </section>
  );
}
function BrainMark() {
  return <Sparkles size={28} strokeWidth={1.4} />;
}
