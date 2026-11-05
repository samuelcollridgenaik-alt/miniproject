import React, { useEffect, useState } from "react";
import { FlaskConical, Play, RefreshCw } from "lucide-react";
import type { ProviderDiagnostic } from "../types.js";
import { apiJson } from "../lib/api.js";
import { EmptyState, PageHeading, StatusMessage } from "./ui/Primitives.js";
interface TestResults {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  tests: {
    suiteName: string;
    testName: string;
    passed: boolean;
    durationMs: number;
    message: string;
  }[];
}
interface Benchmark {
  metrics: {
    recallAt1: number;
    recallAt3: number;
    citationAccuracyRate: number;
    timestamp?: string;
  };
  evaluatedItems: {
    question: string;
    recall1Hit: boolean;
    recall3Hit: boolean;
    citationVerified: boolean;
    topChunkRetrieved: string;
  }[];
}
interface Log {
  id: string;
  timestamp: string;
  taskType: string;
  provider: string;
  model: string;
  latencyMs: number;
  success: boolean;
}
interface ProviderStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgLatencyMs: number;
}
interface Props {
  providers: ProviderDiagnostic[];
  onRefreshProviders: () => void;
}
const views = [
  ["rubric", "Academic Rubric"],
  ["tests", "Unit Tests"],
  ["benchmark", "RAG Benchmark"],
  ["logs", "Execution Logs"],
] as const;
export function EvaluationView({ providers, onRefreshProviders }: Props) {
  const [tab, setTab] = useState<(typeof views)[number][0]>("rubric");
  const [testResults, setTestResults] = useState<TestResults | null>(null);
  const [benchmark, setBenchmark] = useState<Benchmark | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [stats, setStats] = useState<Record<string, ProviderStats>>({});
  const [loadedLogs, setLoadedLogs] = useState(false);
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  async function run<T>(
    key: string,
    url: string,
    method: string,
    onResult: (data: T) => void,
  ) {
    setBusy((b) => ({ ...b, [key]: true }));
    setErrors((e) => ({ ...e, [key]: "" }));
    try {
      const result = await apiJson<T>(url, { method });
      onResult(result);
    } catch (error) {
      setErrors((e) => ({
        ...e,
        [key]:
          error instanceof Error
            ? error.message
            : "Request failed. Please retry.",
      }));
    } finally {
      setBusy((b) => ({ ...b, [key]: false }));
    }
  }
  const tests = () =>
    run<TestResults>(
      "tests",
      "/api/evaluation/run-tests",
      "POST",
      setTestResults,
    );
  const benchmarkRun = () =>
    run<Benchmark>(
      "benchmark",
      "/api/evaluation/run-benchmark",
      "POST",
      setBenchmark,
    );
  const loadLogs = () =>
    run<{ logs: Log[]; stats: Record<string, ProviderStats> }>(
      "logs",
      "/api/logs?limit=50",
      "GET",
      (data) => {
        setLogs(data.logs || []);
        setStats(data.stats || {});
        setLoadedLogs(true);
      },
    );
  useEffect(() => {
    if (tab === "logs" && !loadedLogs) loadLogs();
  }, [tab]);
  return (
    <div className="ui-page">
      <PageHeading
        icon={FlaskConical}
        title="MCA Viva & Evaluator Lab"
        description="Inspect system checks, retrieval benchmarks and provider execution records. Run evaluations when you need fresh evidence."
      />
      <div className="ui-tabs" aria-label="Evaluation views">
        {views.map(([id, label]) => (
          <button
            key={id}
            className={`ui-control px-3 py-2 text-xs ${tab === id ? "bg-accent-soft text-accent" : "text-muted hover:bg-elevated"}`}
            aria-pressed={tab === id}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>
      {Object.entries(errors)
        .filter(([, message]) => message)
        .map(([key, message]) => (
          <StatusMessage key={key} tone="error">
            {key}: {message}
          </StatusMessage>
        ))}
      {tab === "rubric" && (
        <>
          <section className="ui-panel">
            <div className="ui-module-header mb-5">
              <div>
                <h2 className="text-base font-semibold">
                  Capabilities to demonstrate
                </h2>
                <p className="text-xs text-muted mt-2">
                  This checklist describes implementation scope. It does not
                  certify correctness or production readiness.
                </p>
              </div>
              <button
                className="ui-control ui-button"
                disabled={busy.tests || busy.benchmark}
                onClick={() => {
                  tests();
                  benchmarkRun();
                }}
              >
                <Play size={15} />
                {busy.tests || busy.benchmark
                  ? "Evaluating…"
                  : "Run All Evaluations"}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                [
                  "Provider orchestration",
                  "Inspect configured adapters and the actual model returned by each request.",
                ],
                [
                  "Document retrieval",
                  "Review retrieved excerpts and source labels; similarity is not a guarantee of answer accuracy.",
                ],
                [
                  "Assessment & mastery",
                  "Demonstrate question selection, scoring and recorded topic accuracy.",
                ],
                [
                  "Revision planning",
                  "Inspect time allocation, target dates and feasibility constraints.",
                ],
              ].map(([title, description]) => (
                <div
                  className="bg-subtle border border-default rounded-xl p-4"
                  key={title}
                >
                  <h3 className="text-sm font-medium">{title}</h3>
                  <p className="text-xs text-muted mt-2 leading-relaxed">
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </section>
          <section className="ui-panel">
            <div className="ui-data-row mb-4">
              <h2 className="text-base font-semibold">Provider diagnostics</h2>
              <button
                className="ui-control px-3 text-accent text-xs"
                onClick={onRefreshProviders}
              >
                <RefreshCw size={13} className="inline mr-2" />
                Refresh diagnostics
              </button>
            </div>
            {providers.length ? (
              <div className="space-y-3">
                {providers.map((p) => (
                  <div
                    key={p.id}
                    className="ui-data-row border-b border-default pb-3 text-xs"
                  >
                    <span>
                      {p.id}
                      <small className="block text-muted mt-1">
                        {p.defaultModel}
                      </small>
                    </span>
                    <span
                      className={
                        p.status === "online" ? "text-success" : "text-warning"
                      }
                    >
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted">
                Diagnostics have not been loaded.
              </p>
            )}
          </section>
        </>
      )}
      {tab === "tests" && (
        <section className="ui-panel">
          <div className="ui-data-row mb-5">
            <div>
              <h2 className="text-base font-semibold">System unit tests</h2>
              <p className="text-xs text-muted mt-2">
                Backend checks of chunking, similarity, analytics and planning.
              </p>
            </div>
            <button
              className="ui-control ui-button"
              disabled={busy.tests}
              onClick={tests}
            >
              {busy.tests ? "Running tests…" : "Run unit tests"}
            </button>
          </div>
          {!testResults ? (
            <EmptyState
              title="No test run in this session"
              description="Run the backend checks to see actual pass and fail results."
            />
          ) : (
            <>
              <StatusMessage
                tone={testResults.failedTests ? "error" : "success"}
              >
                {testResults.passedTests} passed · {testResults.failedTests}{" "}
                failed · {testResults.totalTests} total
              </StatusMessage>
              <div className="space-y-3 mt-4">
                {testResults.tests.map((t, i) => (
                  <div key={i} className="border border-default rounded-lg p-4">
                    <div className="ui-data-row text-sm">
                      <h3>{t.testName}</h3>
                      <span
                        className={t.passed ? "text-success" : "text-danger"}
                      >
                        {t.passed ? "PASS" : "FAIL"} · {t.durationMs} ms
                      </span>
                    </div>
                    <p className="text-xs text-muted mt-2">
                      {t.suiteName} · {t.message}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      )}
      {tab === "benchmark" && (
        <section className="ui-panel">
          <div className="ui-data-row mb-5">
            <h2 className="text-base font-semibold">Retrieval benchmark</h2>
            <button
              className="ui-control ui-button"
              disabled={busy.benchmark}
              onClick={benchmarkRun}
            >
              {busy.benchmark ? "Evaluating…" : "Run retrieval benchmark"}
            </button>
          </div>
          <StatusMessage>
            Answer faithfulness is not assessed by this retrieval benchmark.
            Review generated answers against original sources.
          </StatusMessage>
          {!benchmark ? (
            <div className="mt-4">
              <EmptyState
                title="No retrieval benchmark run"
                description="Run the local benchmark to measure source retrieval against its reference items."
              />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-5">
                {[
                  ["Recall @ 1", benchmark.metrics.recallAt1],
                  ["Recall @ 3", benchmark.metrics.recallAt3],
                  [
                    "Citation label match",
                    benchmark.metrics.citationAccuracyRate,
                  ],
                ].map(([label, value]) => (
                  <div
                    className="bg-subtle border border-default rounded-xl p-4"
                    key={label}
                  >
                    <h3 className="text-xs text-muted">{label}</h3>
                    <p className="text-2xl mt-2">{value}%</p>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                {benchmark.evaluatedItems.map((item, i) => (
                  <div className="border border-default rounded-lg p-4" key={i}>
                    <h3 className="text-sm font-medium">{item.question}</h3>
                    <p className="text-xs text-muted my-2">
                      Recall@1: {item.recall1Hit ? "HIT" : "MISS"} · Recall@3:{" "}
                      {item.recall3Hit ? "HIT" : "MISS"} · Citation label:{" "}
                      {item.citationVerified ? "MATCH" : "NO MATCH"}
                    </p>
                    <blockquote className="text-xs text-secondary leading-relaxed">
                      {item.topChunkRetrieved}
                    </blockquote>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      )}
      {tab === "logs" && (
        <section className="ui-panel">
          <div className="ui-data-row mb-5">
            <h2 className="text-base font-semibold">Provider execution logs</h2>
            <button
              className="ui-control ui-button"
              disabled={busy.logs}
              onClick={loadLogs}
            >
              {busy.logs ? "Loading logs…" : "Refresh Logs"}
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
            {Object.entries(stats).map(([id, stat]) => (
              <div
                className="bg-subtle border border-default rounded-xl p-4 text-xs"
                key={id}
              >
                <h3 className="font-medium">{id}</h3>
                <p className="text-muted mt-2">
                  {stat.totalRequests} calls · {stat.successfulRequests}{" "}
                  succeeded · {stat.failedRequests} failed
                </p>
                <p className="text-muted mt-1">
                  {stat.totalRequests
                    ? `${stat.avgLatencyMs} ms average`
                    : "No requests recorded"}
                </p>
              </div>
            ))}
          </div>
          {!logs.length ? (
            <EmptyState
              title={
                busy.logs
                  ? "Loading execution records…"
                  : "No execution records"
              }
              description="Completed provider calls appear here when the backend records them."
            />
          ) : (
            <div
              role="region"
              aria-label="Provider execution table"
              tabIndex={0}
              className="ui-table-scroll"
            >
              <table className="w-full text-left text-xs">
                <caption className="sr-only">
                  Provider execution records
                </caption>
                <thead className="bg-subtle text-muted">
                  <tr>
                    {[
                      "Time",
                      "Task",
                      "Provider",
                      "Model",
                      "Latency",
                      "Result",
                    ].map((h) => (
                      <th scope="col" className="p-3" key={h}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-t border-default">
                      <td className="p-3 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="p-3">{log.taskType}</td>
                      <td className="p-3">{log.provider}</td>
                      <td className="p-3 ui-word-wrap">{log.model}</td>
                      <td className="p-3 whitespace-nowrap">
                        {log.latencyMs} ms
                      </td>
                      <td
                        className={`p-3 ${log.success ? "text-success" : "text-danger"}`}
                      >
                        {log.success ? "OK" : "ERROR"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
