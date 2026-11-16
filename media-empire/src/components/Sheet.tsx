import { useEffect, useId, useRef } from 'react';
import { X } from '@phosphor-icons/react';
import type { ReactNode } from 'react';

export function Sheet({ title, eyebrow, children, onClose, className = '' }: {
  title: string; eyebrow?: string; children: ReactNode; onClose: () => void; className?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null), previous = useRef<HTMLElement | null>(null);
  const titleId = useId(), closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    previous.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog.current?.showModal();
    dialog.current?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
    return () => {
      dialog.current?.close();
      const opener = previous.current;
      if (opener?.isConnected) queueMicrotask(() => opener.focus());
    };
  }, []);
  return <dialog ref={dialog} className={'game-sheet ' + className} aria-labelledby={titleId}
    onKeyDown={event => {
      if (event.key !== 'Tab' || !dialog.current) return;
      const focusable = [...dialog.current.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]')].filter(el => el.checkVisibility() && !el.hasAttribute('hidden'));
      const first = focusable[0], last = focusable.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && (document.activeElement === first || !dialog.current.contains(document.activeElement))) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialog.current.contains(document.activeElement))) {
        event.preventDefault(); first.focus({ preventScroll: true });
      }
    }}
    onCancel={event => { event.preventDefault(); closeRef.current(); }}
    onClick={event => { if (event.target === dialog.current) { const r = dialog.current.getBoundingClientRect(); if (event.clientY < r.top || event.clientX < r.left || event.clientX > r.right) closeRef.current(); } }}>
    <div className="sheet-shell">
      <header className="sheet-heading">
        <div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h2 id={titleId}>{title}</h2></div>
        <button className="icon-button close-sheet" aria-label="Закрыть окно" onClick={onClose}><X size={22} /></button>
      </header>
      <div className="sheet-content">{children}</div>
    </div>
  </dialog>;
}
