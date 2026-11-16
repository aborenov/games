import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "@phosphor-icons/react";
export function Panel({
  title,
  kicker,
  children,
  onClose,
  className = "",
  footer,
}: {
  title: string;
  kicker?: string;
  children: ReactNode;
  onClose: () => void;
  className?: string;
  footer?: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    previous = useRef<HTMLElement | null>(null),
    id = useId(),
    close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    previous.current = document.activeElement as HTMLElement;
    dialog.current?.showModal();
    dialog.current
      ?.querySelector<HTMLButtonElement>("button")
      ?.focus({ preventScroll: true });
    return () => {
      dialog.current?.close();
      const el = previous.current;
      if (el?.isConnected)
        queueMicrotask(() => el.focus({ preventScroll: true }));
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className={"panel " + className}
      aria-labelledby={id}
      onCancel={(e) => {
        e.preventDefault();
        close.current();
      }}
      onClick={(e) => {
        if (e.target === dialog.current) {
          const r = dialog.current.getBoundingClientRect();
          if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top)
            close.current();
        }
      }}
      onKeyDown={(e) => {
        if (e.key !== "Tab") return;
        const items = [
          ...dialog.current!.querySelectorAll<HTMLElement>(
            'button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),[tabindex="0"]',
          ),
        ].filter((el) => el.checkVisibility());
        const first = items[0],
          last = items.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }}
    >
      <header className="panel-header">
        <div>
          {kicker && <p className="eyebrow">{kicker}</p>}
          <h2 id={id}>{title}</h2>
        </div>
        <button
          className="icon-button panel-close"
          aria-label="Закрыть"
          onClick={onClose}
        >
          <X size={22} />
        </button>
      </header>
      <div className="panel-body">{children}</div>
      {footer && <footer className="panel-footer">{footer}</footer>}
    </dialog>
  );
}
