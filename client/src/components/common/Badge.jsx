const TONES = {
  neutral: 'bg-gray-100 text-gray-700 border-gray-200',
  success: 'bg-green-50 text-state-success border-green-200',
  danger: 'bg-red-50 text-state-danger border-red-200',
  warn: 'bg-amber-50 text-state-warn border-amber-200',
  info: 'bg-blue-50 text-state-info border-blue-200',
};

export default function Badge({ children, tone = 'neutral' }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${TONES[tone] || TONES.neutral}`}>
      {children}
    </span>
  );
}
