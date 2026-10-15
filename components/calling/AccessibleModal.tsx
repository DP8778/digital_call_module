"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";

type Props = {
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  size?: "md" | "lg";
  active?: boolean;
  layer?: "base" | "nested";
};

export default function AccessibleModal({
  title,
  description,
  onClose,
  children,
  size = "md",
  active = true,
  layer = "base",
}: Props) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const hasFocusedRef = useRef(false);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    return () => {
      const target = returnFocusRef.current;
      window.queueMicrotask(() => {
        if (target?.isConnected && !target.closest("[inert]")) target.focus();
      });
    };
  }, []);

  useEffect(() => {
    if (!active) return;
    if (!hasFocusedRef.current) {
      closeRef.current?.focus();
      hasFocusedRef.current = true;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      document.body.style.overflow = previousOverflow;
    };
  }, [active]);

  return (
    <div
      className={`modal-overlay fixed inset-0 flex items-end justify-center p-0 sm:items-center sm:p-5 ${layer === "nested" ? "z-[60]" : "z-50"} ${active ? "" : "pointer-events-none"}`}
      aria-hidden={active ? undefined : true}
      inert={!active}
      onMouseDown={(event) => {
        if (active && event.currentTarget === event.target) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={`modal-panel max-h-[96dvh] w-full overflow-y-auto rounded-t-[var(--dc-radius-xl)] border sm:max-h-[94dvh] sm:rounded-[var(--dc-radius-xl)] ${size === "lg" ? "sm:max-w-4xl" : "sm:max-w-lg"}`}
      >
        <header className="modal-header sticky top-0 z-10 flex items-start justify-between gap-4 border-b px-5 py-4 sm:px-6">
          <div>
            <h2 id={titleId} className="dc-text-primary text-lg font-bold tracking-[-0.025em]">
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="dc-text-muted mt-1 text-sm">
                {description}
              </p>
            ) : null}
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="button-quiet -mr-1 size-11 shrink-0 px-0"
            aria-label="Zavřít dialog"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </header>
        <div className="modal-content">{children}</div>
      </div>
    </div>
  );
}
