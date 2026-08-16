export default function StatCard({ label, value, sub, icon: Icon, tone = 'teal' }) {
  const tones = {
    teal: 'bg-gov-teal/10 text-gov-teal',
    navy: 'bg-gov-navy/10 text-gov-navy',
    saffron: 'bg-gov-saffron/10 text-gov-saffron',
    danger: 'bg-state-danger/10 text-state-danger',
    success: 'bg-state-success/10 text-state-success',
  };
  return (
    <div className="gov-card p-4 flex items-start gap-3">
      {Icon && (
        <span className={`shrink-0 grid place-items-center w-10 h-10 rounded-md ${tones[tone]}`}>
          <Icon size={20} aria-hidden="true" />
        </span>
      )}
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-gov-muted">{label}</p>
        <p className="text-2xl font-semibold text-gov-navy leading-tight mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gov-muted mt-0.5 truncate">{sub}</p>}
      </div>
    </div>
  );
}
