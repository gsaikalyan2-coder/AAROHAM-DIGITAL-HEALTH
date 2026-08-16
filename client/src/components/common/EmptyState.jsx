export default function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div className="text-center py-10 px-4">
      {Icon && <Icon size={28} className="mx-auto text-gov-muted mb-3" aria-hidden="true" />}
      <p className="font-medium text-gov-navy">{title}</p>
      {message && <p className="text-sm text-gov-muted mt-1 max-w-sm mx-auto">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
