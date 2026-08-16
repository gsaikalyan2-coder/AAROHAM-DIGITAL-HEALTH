export default function Card({ title, action, children, className = '', bodyClass = 'p-5' }) {
  return (
    <section className={`gov-card ${className}`}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 px-5 py-3 border-b border-gov-border">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gov-navy">{title}</h3>
          {action}
        </header>
      )}
      <div className={bodyClass}>{children}</div>
    </section>
  );
}
