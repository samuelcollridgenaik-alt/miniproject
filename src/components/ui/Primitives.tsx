import { useOverlayFocus } from "../../hooks/useOverlayFocus.js";
import React from "react";
import type { LucideIcon } from "lucide-react";
export function PageHeading({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: React.ReactNode;
  description: React.ReactNode;
}) {
  return (
    <div className="ui-page-heading">
      <span className="ui-heading-icon">
        <Icon size={20} aria-hidden="true" />
      </span>
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </div>
  );
}
export function StatusMessage({
  children,
  tone = "info",
  action,
}: {
  children: React.ReactNode;
  tone?: "info" | "error" | "success";
  action?: React.ReactNode;
}) {
  return (
    <div
      className={`ui-status ui-status-${tone}`}
      role={tone === "error" ? "alert" : "status"}
    >
      <span>{children}</span>
      {action}
    </div>
  );
}
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="ui-empty">
      <h2>{title}</h2>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function LoadingState({ label }: { label: string }) {
  return (
    <div role="status" className="ui-empty">
      <span className="ui-spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}
export class ModuleErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <EmptyState
        title="This view could not be displayed"
        description="Your saved data is unchanged. Try reopening the view."
        action={
          <button
            className="ui-button"
            onClick={() => this.setState({ failed: false })}
          >
            Try again
          </button>
        }
      />
    ) : (
      this.props.children
    );
  }
}

export function ConfirmDialog({
  open,
  title,
  children,
  busy = false,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  busy?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const ref = useOverlayFocus(open, () => {
    if (!busy) onClose();
  });
  if (!open) return null;
  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="ui-confirm-overlay"
    >
      <div className="ui-panel ui-confirm-panel">
        <h2>{title}</h2>
        <div className="ui-confirm-content">{children}</div>
        <div className="ui-data-row justify-end">
          <button
            className="ui-control px-4 border border-default"
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="ui-control px-4 bg-danger-solid text-on-accent"
            disabled={busy}
            onClick={onConfirm}
          >
            {busy ? "Removing…" : "Remove document"}
          </button>
        </div>
      </div>
    </div>
  );
}
