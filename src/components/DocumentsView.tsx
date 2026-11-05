import { apiJson } from "../lib/api.js";
import React, { useMemo, useState } from "react";
import { FileText, Library, Plus, Search, Trash2, Upload } from "lucide-react";
import type { DocumentMeta } from "../types.js";
import {
  ConfirmDialog,
  EmptyState,
  PageHeading,
  StatusMessage,
} from "./ui/Primitives.js";
interface Props {
  documents: DocumentMeta[];
  onRefresh: () => void;
  onSeedSample: () => void;
}
export function DocumentsView({ documents, onRefresh, onSeedSample }: Props) {
  const [pendingDelete, setPendingDelete] = useState<DocumentMeta | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<"upload" | "paste">("upload");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [notice, setNotice] = useState<{
    text: string;
    tone: "error" | "success";
  } | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("recent");
  const filtered = useMemo(
    () =>
      documents
        .filter((d) =>
          `${d.title} ${d.fileName}`
            .toLowerCase()
            .includes(search.toLowerCase()),
        )
        .sort((a, b) =>
          sort === "name"
            ? a.title.localeCompare(b.title)
            : Date.parse(b.uploadedAt) - Date.parse(a.uploadedAt),
        ),
    [documents, search, sort],
  );
  async function ingest(body: BodyInit, headers?: HeadersInit) {
    setBusy(true);
    setNotice(null);
    try {
      const data = await apiJson<{ chunksCreated: number }>(
        headers ? "/api/documents/text" : "/api/documents/upload",
        { method: "POST", body, headers },
      );
      setNotice({
        tone: "success",
        text: `Document indexed into ${data.chunksCreated} chunks.`,
      });
      setText("");
      setTitle("");
      onRefresh();
    } catch (error) {
      setNotice({
        tone: "error",
        text:
          error instanceof Error &&
          ["TimeoutError", "AbortError"].includes(error.name)
            ? "Indexing timed out. Refresh the library before retrying; processing may have finished on the server."
            : error instanceof Error
              ? error.message
              : "Unable to reach the document service. Please retry.",
      });
    } finally {
      setBusy(false);
    }
  }
  async function upload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!/\.(pdf|pptx|txt)$/i.test(file.name) || file.size > 25 * 1024 * 1024) {
      setNotice({
        tone: "error",
        text: "Choose a PDF, PPTX or TXT file of 25 MB or smaller.",
      });
      return;
    }
    const body = new FormData();
    body.append("file", file);
    await ingest(body);
  }
  async function remove(document: DocumentMeta) {
    setDeleting(document.id);
    setNotice(null);
    try {
      await apiJson(`/api/documents/${encodeURIComponent(document.id)}`, {
        method: "DELETE",
      });
      setNotice({ tone: "success", text: "Document removed." });
      onRefresh();
    } catch (error) {
      setNotice({
        tone: "error",
        text:
          error instanceof Error
            ? error.message
            : "Removal failed. Please retry.",
      });
    } finally {
      setDeleting(null);
      setPendingDelete(null);
    }
  }
  return (
    <div className="ui-page">
      <ConfirmDialog
        open={!!pendingDelete}
        title="Remove document?"
        busy={!!deleting}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) remove(pendingDelete);
        }}
      >
        <p>
          Remove “{pendingDelete?.title}” and its indexed chunks? This cannot be
          undone.
        </p>
      </ConfirmDialog>
      <div className="ui-module-header">
        <PageHeading
          icon={Library}
          title="Course Notes & Vault"
          description="Upload course documents or paste notes to build your searchable academic library."
        />
        <div className="flex flex-wrap gap-2">
          <button
            className="ui-control border border-default px-3 text-xs"
            disabled={refreshing}
            onClick={async () => {
              setRefreshing(true);
              try {
                await onRefresh();
              } finally {
                setRefreshing(false);
              }
            }}
          >
            {refreshing ? "Refreshing…" : "Refresh library"}
          </button>
          <button className="ui-control ui-button" onClick={onSeedSample}>
            Load sample notes
          </button>
        </div>
      </div>
      <section className="ui-panel" aria-label="Add course material">
        <div className="ui-tabs mb-5" aria-label="Document input method">
          {(["upload", "paste"] as const).map((id) => (
            <button
              key={id}
              type="button"
              aria-pressed={tab === id}
              className={`ui-control px-3 py-2 text-xs ${tab === id ? "bg-accent-soft text-accent" : "text-muted hover:bg-elevated"}`}
              onClick={() => setTab(id)}
            >
              {id === "upload" ? "Upload document" : "Paste notes"}
            </button>
          ))}
        </div>
        {tab === "upload" ? (
          <div className="ui-empty">
            <Upload
              size={24}
              className="mx-auto mb-3 text-accent"
              aria-hidden="true"
            />
            <h2>Add your course material</h2>
            <p>
              PDF, PPTX and TXT · up to 25 MB. Page and slide references are
              retained when available.
            </p>
            <label className="ui-button relative cursor-pointer">
              <Plus size={16} aria-hidden="true" />
              {busy ? "Indexing document…" : "Choose a file"}
              <input
                type="file"
                accept=".pdf,.pptx,.txt"
                aria-label="Upload course document"
                disabled={busy}
                onChange={upload}
                className="ui-field absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              />
            </label>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (text.trim() && !busy)
                ingest(
                  JSON.stringify({
                    title: title.trim() || "Academic Notes",
                    text,
                    fileType: "txt",
                  }),
                  { "Content-Type": "application/json" },
                );
            }}
            className="space-y-4"
          >
            <div>
              <label
                htmlFor="document-title"
                className="block text-xs text-secondary mb-2"
              >
                Document / Chapter Title
              </label>
              <input
                id="document-title"
                className="ui-field w-full bg-subtle border border-default p-3 text-primary"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                placeholder="A name you can find later"
              />
            </div>
            <div>
              <label
                htmlFor="document-text"
                className="block text-xs text-secondary mb-2"
              >
                Lecture Text / Course Excerpts
              </label>
              <textarea
                id="document-text"
                required
                rows={6}
                className="ui-field w-full bg-subtle border border-default p-3 text-primary"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste your course notes here"
              />
            </div>
            <button
              type="submit"
              disabled={busy || !text.trim()}
              className="ui-control ui-button"
            >
              {busy ? "Indexing notes…" : "Index text notes"}
            </button>
          </form>
        )}
      </section>
      {busy && (
        <StatusMessage>
          Processing your document. This may take a moment.
        </StatusMessage>
      )}
      {notice && (
        <StatusMessage tone={notice.tone}>{notice.text}</StatusMessage>
      )}
      <section className="ui-panel" aria-label="Indexed documents">
        <div className="ui-data-row mb-4">
          <h2 className="text-base font-semibold">
            Your library <span className="text-muted">{documents.length}</span>
          </h2>
          <span className="text-xs text-muted">
            {documents.reduce((n, d) => n + d.totalChunks, 0)} indexed chunks
          </span>
        </div>
        <div className="ui-data-row mb-5">
          <label className="flex items-center gap-2 border border-default bg-subtle rounded-lg px-3 flex-1">
            <Search size={15} aria-hidden="true" />
            <input
              className="ui-field bg-transparent py-2 w-full"
              aria-label="Search documents"
              placeholder="Search titles and filenames"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <select
            className="ui-field border border-default bg-subtle p-2"
            aria-label="Sort documents"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="recent">Recently added</option>
            <option value="name">Title A–Z</option>
          </select>
        </div>
        {!filtered.length ? (
          <EmptyState
            title={
              search
                ? "No matching documents"
                : "Your library is ready for notes"
            }
            description={
              search
                ? "Try a different title or filename."
                : "Upload a document, paste notes or load the sample materials to get started."
            }
          />
        ) : (
          <div
            role="region"
            aria-label="Course document table"
            tabIndex={0}
            className="ui-table-scroll"
          >
            <table className="w-full text-left text-xs">
              <caption className="sr-only">Indexed course files</caption>
              <thead className="bg-subtle text-muted">
                <tr>
                  {[
                    "Document",
                    "Format",
                    "Pages / slides",
                    "Chunks",
                    "Size",
                    "Added",
                    "Actions",
                  ].map((h) => (
                    <th scope="col" className="p-3 font-medium" key={h}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr key={d.id} className="border-t border-default">
                    <td className="p-3 max-w-xs">
                      <div className="flex items-center gap-2">
                        <FileText
                          size={15}
                          className="text-accent shrink-0"
                          aria-hidden="true"
                        />
                        <span className="font-medium ui-word-wrap">
                          {d.title}
                        </span>
                      </div>
                      <p className="text-muted mt-1 ui-word-wrap">
                        {d.fileName}
                      </p>
                    </td>
                    <td className="p-3 uppercase text-muted">{d.fileType}</td>
                    <td className="p-3">{d.pageOrSlideCount ?? "—"}</td>
                    <td className="p-3">{d.totalChunks}</td>
                    <td className="p-3 whitespace-nowrap">
                      {(d.fileSizeBytes / 1024).toFixed(1)} KB
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {new Date(d.uploadedAt).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      <button
                        aria-label={`Delete ${d.title}`}
                        title="Delete document"
                        disabled={!!deleting}
                        onClick={() => setPendingDelete(d)}
                        className="ui-control p-2 text-muted hover:text-danger hover:bg-danger-soft"
                      >
                        <Trash2 size={16} />
                        {deleting === d.id && (
                          <span className="sr-only">Removing</span>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
