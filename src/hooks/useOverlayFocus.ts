import { useEffect, useRef } from "react";
/** Keeps keyboard focus in an open overlay and restores it to its trigger. */
export function useOverlayFocus<T extends HTMLElement = HTMLDivElement>(
  active: boolean,
  onClose: () => void,
) {
  const ref = useRef<T>(null);
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  }, [onClose]);
  useEffect(() => {
    if (!active || !ref.current) return;
    const previous = document.activeElement as HTMLElement | null;
    const container = ref.current;
    const focusable = () =>
      Array.from(
        container.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled):not([type=hidden]), textarea:not(:disabled), select:not(:disabled), a[href], [tabindex="0"]',
        ),
      ).filter((el) => el.getClientRects().length);
    focusable()[0]?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close.current();
      }
      if (event.key === "Tab") {
        const elements = focusable();
        const first = elements[0];
        const last = elements[elements.length - 1];
        if (!first) {
          event.preventDefault();
          return;
        }
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    container.addEventListener("keydown", keydown);
    return () => {
      container.removeEventListener("keydown", keydown);
      previous?.focus();
    };
  }, [active]);
  return ref;
}
