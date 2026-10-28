import React, { useState } from 'react';
import { DocumentMeta } from '../types.js';
import { Upload, FileText, Trash2, Plus, Sparkles, Database, Layers, CheckCircle, HardDrive } from 'lucide-react';

interface DocumentsViewProps {
  documents: DocumentMeta[];
  onRefresh: () => void;
  onSeedSample: () => void;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({
  documents,
  onRefresh,
  onSeedSample,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [pastedTitle, setPastedTitle] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setStatusMessage(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setStatusMessage(`Successfully extracted and indexed "${file.name}" into ${data.chunksCreated} chunks.`);
      onRefresh();
    } catch (err: any) {
      setStatusMessage(`Ingestion failed: ${err.message}`);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handlePastedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pastedText.trim()) return;

    setUploading(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/documents/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: pastedTitle.trim() || 'Academic Notes',
          text: pastedText,
          fileType: 'txt',
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setStatusMessage(`Indexed notes into ${data.chunksCreated} semantic chunks.`);
      setPastedTitle('');
      setPastedText('');
      onRefresh();
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this document and its indexed vectors?')) return;
    try {
      await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      onRefresh();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Google Drive Style Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Course Materials Drive & Vector Index
              </h2>
              <p className="text-xs text-slate-500">
                Upload syllabus, PDFs, and slide decks. Automatically parsed with preserved page/slide numbers for RAG.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onSeedSample}
              className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-full text-xs font-semibold flex items-center gap-1.5 transition border border-blue-200"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Seed MCA Lecture Notes
            </button>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex gap-2 border-b border-slate-100 pb-3 mb-4">
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
              activeTab === 'upload'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Upload File (PDF / PPTX / TXT)
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
              activeTab === 'paste'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Paste Lecture Notes / Syllabus
          </button>
        </div>

        {statusMessage && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {activeTab === 'upload' ? (
          <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl p-8 text-center bg-slate-50/60 transition">
            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center mx-auto mb-3 text-blue-600">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-800">
              Choose a course document to index
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Supports .pdf (page-aware), .pptx (slide-aware), and .txt. Documents are chunked into 600-character segments.
            </p>
            <label className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-full cursor-pointer transition shadow-xs">
              <Plus className="w-4 h-4" />
              <span>{uploading ? 'Processing & Indexing Chunks...' : 'Select File from Device'}</span>
              <input
                type="file"
                accept=".pdf,.pptx,.txt"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>
        ) : (
          <form onSubmit={handlePastedSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Document / Chapter Title
              </label>
              <input
                type="text"
                value={pastedTitle}
                onChange={(e) => setPastedTitle(e.target.value)}
                placeholder="e.g. MCA 401 — Advanced Database Architectures"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lecture Text / Course Excerpts
              </label>
              <textarea
                rows={6}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste course syllabus, lecture transcript, or study notes here..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={uploading || !pastedText.trim()}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-semibold rounded-full transition shadow-xs"
              >
                {uploading ? 'Chunking & Indexing...' : 'Index Text Notes'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Uploaded Documents List */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>Indexed Course Files ({documents.length})</span>
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            Total Semantic Chunks:{' '}
            <strong className="text-blue-600">
              {documents.reduce((acc, d) => acc + d.totalChunks, 0)}
            </strong>
          </span>
        </div>

        {documents.length === 0 ? (
          <div className="text-center py-10">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500">
              No course documents indexed. Click "Seed MCA Lecture Notes" above to load standard materials immediately.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Title</th>
                  <th className="py-3 px-3 font-semibold">Format</th>
                  <th className="py-3 px-3 font-semibold">Pages / Slides</th>
                  <th className="py-3 px-3 font-semibold">Chunks</th>
                  <th className="py-3 px-3 font-semibold">File Size</th>
                  <th className="py-3 px-3 font-semibold">Added</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{doc.title}</div>
                      <div className="text-[11px] text-slate-400">{doc.fileName}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider border border-blue-200">
                        {doc.fileType}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-medium">
                      {doc.pageOrSlideCount || 1}
                    </td>
                    <td className="py-3 px-3 font-bold text-emerald-600">
                      {doc.totalChunks}
                    </td>
                    <td className="py-3 px-3 text-slate-500">
                      {(doc.fileSizeBytes / 1024).toFixed(1)} KB
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {new Date(doc.uploadedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDelete(doc.id)}
                        title="Delete document"
                        className="p-1.5 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
