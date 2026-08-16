import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

/**
 * Departmental dialog. Flat surface, 1px border, no blur and no motion beyond
 * the 150ms colour transitions the design language permits (CLAUDE.md §4).
 *
 * Accessibility is the point of having this component rather than a div:
 * Escape closes, focus moves into the dialog on open and returns to the
 * invoking control on close, Tab is trapped, and the body does not scroll
 * behind the panel.
 */
export default function Modal({ open, onClose, title, subtitle, children, footer, size = 'lg' }) {
  const panelRef = useRef(null);
  const previouslyFocused = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    previouslyFocused.current = document.activeElement;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    const panel = panelRef.current;
    const focusable = () =>
      Array.from(
        panel?.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ) || []
      );

    focusable()[0]?.focus();

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;

      const items = focusable();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.body.style.overflow = overflow;
      previouslyFocused.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  const width = { md: 'max-w-lg', lg: 'max-w-3xl', xl: 'max-w-5xl' }[size] || 'max-w-3xl';

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div
        className="fixed inset-0 bg-gov-navy/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`relative w-full ${width} bg-white sm:border sm:border-gov-border sm:rounded-md sm:shadow-card min-h-screen sm:min-h-0 sm:my-8`}
      >
        <header className="flex items-start justify-between gap-4 px-5 py-4 border-b border-gov-border sticky top-0 bg-white sm:static z-10">
          <div className="min-w-0">
            <h2 id="modal-title" className="text-base font-semibold text-gov-navy">{title}</h2>
            {subtitle && <p className="text-sm text-gov-muted mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-2 -m-1 rounded-md text-gov-muted hover:bg-gov-gray hover:text-gov-navy transition-colors duration-150"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div className="px-5 py-5">{children}</div>

        {footer && (
          <footer className="px-5 py-4 border-t border-gov-border bg-gov-gray sm:rounded-b-md sticky bottom-0 sm:static">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}
