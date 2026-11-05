import { useEffect, useState } from "react";
import type { GroundedAnswerData } from "../types.js";
export interface ChatTurn {
  id: string;
  question: string;
  answer?: GroundedAnswerData;
  error?: string;
}
export interface Conversation {
  id: string;
  title: string;
  updatedAt: number;
  draft: string;
  documentId: string;
  mode: "kid" | "scholar";
  turns: ChatTurn[];
}
export const newConversation = (): Conversation => ({
  id: crypto.randomUUID(),
  title: "New conversation",
  updatedAt: Date.now(),
  draft: "",
  documentId: "",
  mode: "kid",
  turns: [],
});
export interface Workspace {
  conversations: Conversation[];
  open: string[];
  active: string;
}
function initial(): Workspace {
  const c = newConversation();
  return { conversations: [c], open: [c.id], active: c.id };
}
export function loadWorkspace(
  key: string,
  storage: Pick<Storage, "getItem"> = localStorage,
): Workspace {
  try {
    const value = JSON.parse(storage.getItem(key) || "null");
    if (
      value &&
      Array.isArray(value.conversations) &&
      value.conversations.length &&
      value.conversations.every(
        (c: Conversation) =>
          typeof c.id === "string" &&
          typeof c.title === "string" &&
          typeof c.draft === "string" &&
          typeof c.documentId === "string" &&
          Number.isFinite(c.updatedAt) &&
          (c.mode === "kid" || c.mode === "scholar") &&
          Array.isArray(c.turns) &&
          c.turns.every(
            (t) =>
              t &&
              typeof t.id === "string" &&
              typeof t.question === "string" &&
              (!t.answer ||
                (typeof t.answer.answer === "string" &&
                  Array.isArray(t.answer.citations))),
          ),
      ) &&
      Array.isArray(value.open)
    ) {
      const ids = new Set(value.conversations.map((c: Conversation) => c.id));
      const open = [
        ...new Set<string>(value.open.filter((id: string) => ids.has(id))),
      ];
      const active = ids.has(value.active)
        ? value.active
        : value.conversations[0].id;
      if (!open.includes(active)) open.push(active);
      return {
        ...value,
        open: open.length ? open : [value.conversations[0].id],
        active,
      };
    }
  } catch {
    /* Invalid or unavailable local storage starts a clean workspace. */
  }
  return initial();
}
export function closeWorkspace(w: Workspace, id: string): Workspace {
  const open = w.open.filter((x) => x !== id);
  if (!open.length) {
    const c = newConversation();
    return {
      conversations: [c, ...w.conversations],
      open: [c.id],
      active: c.id,
    };
  }
  return {
    ...w,
    open,
    active: w.active === id ? open[open.length - 1] : w.active,
  };
}
export function useConversations(userId: string) {
  const key = `cognify_workspace_v1_${userId}`;
  const [workspace, setWorkspace] = useState(() => loadWorkspace(key));
  const [storageError, setStorageError] = useState("");
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(workspace));
      setStorageError("");
    } catch {
      setStorageError(
        "Browser storage is unavailable or full. Changes are kept only until this page closes.",
      );
    }
  }, [workspace, key]);
  const update = (
    id: string,
    patch: Partial<Conversation> | ((c: Conversation) => Partial<Conversation>),
  ) =>
    setWorkspace((w) => ({
      ...w,
      conversations: w.conversations.map((c) =>
        c.id === id
          ? { ...c, ...(typeof patch === "function" ? patch(c) : patch) }
          : c,
      ),
    }));
  const select = (id: string) =>
    setWorkspace((w) => ({
      ...w,
      active: id,
      open: w.open.includes(id) ? w.open : [...w.open, id],
    }));
  const create = (draft = "") => {
    const c = { ...newConversation(), draft };
    setWorkspace((w) => ({
      conversations: [c, ...w.conversations],
      open: [...w.open, c.id],
      active: c.id,
    }));
  };
  const close = (id: string) => setWorkspace((w) => closeWorkspace(w, id));
  const remove = (id: string) =>
    setWorkspace((w) => {
      const conversations = w.conversations.filter((c) => c.id !== id);
      if (!conversations.length) return initial();
      const open = w.open.filter((x) => x !== id);
      return {
        conversations,
        open: open.length ? open : [conversations[0].id],
        active: w.active === id ? open[0] || conversations[0].id : w.active,
      };
    });
  return {
    ...workspace,
    current: workspace.conversations.find((c) => c.id === workspace.active)!,
    storageError,
    update,
    select,
    create,
    close,
    remove,
  };
}
