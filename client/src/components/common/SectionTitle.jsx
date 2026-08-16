export default function SectionTitle({ eyebrow, title, description, align = 'center' }) {
  const alignment = align === 'center' ? 'text-center mx-auto' : 'text-left';
  return (
    <div className={`max-w-2xl mb-8 ${alignment}`}>
      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-widest text-gov-teal mb-2">{eyebrow}</p>
      )}
      <h2 className="text-2xl font-semibold text-gov-navy">{title}</h2>
      {description && <p className="text-gov-muted mt-2">{description}</p>}
    </div>
  );
}
