import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { formatDate, todayIso } from '../../lib/appointments.js';

const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

/** All dates are handled as 'YYYY-MM-DD' in UTC so no day ever shifts by one. */
const iso = (y, m, d) =>
  `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

function addDays(isoDate, days) {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Month calendar for choosing a visit date.
 *
 * A native <input type="date"> was rejected: its rendering is browser-specific,
 * it cannot grey out the days outpatient services do not run, and it gives a
 * worker no sense of which days are actually open. Here a closed day is visibly
 * closed before it is clicked.
 */
export default function CalendarPicker({
  value,
  onChange,
  closedWeekdays = [0],
  maxAdvanceDays = 60,
  timeZone = 'Asia/Kolkata',
}) {
  const today = todayIso(timeZone);
  const lastBookable = addDays(today, maxAdvanceDays);

  const [cursor, setCursor] = useState(() => {
    const base = value || today;
    return { year: Number(base.slice(0, 4)), month: Number(base.slice(5, 7)) - 1 };
  });

  const weeks = useMemo(() => {
    const { year, month } = cursor;
    const firstWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay();
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

    const cells = Array(firstWeekday).fill(null);
    for (let d = 1; d <= daysInMonth; d += 1) cells.push(iso(year, month, d));
    while (cells.length % 7 !== 0) cells.push(null);

    return Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7));
  }, [cursor]);

  const monthLabel = new Date(Date.UTC(cursor.year, cursor.month, 1)).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

  const step = (delta) =>
    setCursor(({ year, month }) => {
      const next = new Date(Date.UTC(year, month + delta, 1));
      return { year: next.getUTCFullYear(), month: next.getUTCMonth() };
    });

  const statusOf = (date) => {
    if (date < today) return 'past';
    if (date > lastBookable) return 'beyond';
    if (closedWeekdays.includes(new Date(`${date}T00:00:00Z`).getUTCDay())) return 'closed';
    return 'open';
  };

  // Nothing before the current month can be booked, so there is nothing to see there.
  const canGoBack = iso(cursor.year, cursor.month, 1) > `${today.slice(0, 7)}-01`;

  return (
    <div className="border border-gov-border rounded-md">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gov-border bg-gov-gray">
        <button
          type="button"
          onClick={() => step(-1)}
          disabled={!canGoBack}
          aria-label="Previous month"
          className="p-1.5 rounded-md hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
        >
          <ChevronLeft size={18} aria-hidden="true" />
        </button>
        <p className="text-sm font-semibold text-gov-navy" aria-live="polite">{monthLabel}</p>
        <button
          type="button"
          onClick={() => step(1)}
          aria-label="Next month"
          className="p-1.5 rounded-md hover:bg-white transition-colors duration-150"
        >
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </div>

      <table className="w-full" role="grid">
        <thead>
          <tr>
            {WEEKDAY_LABELS.map((w) => (
              <th key={w} scope="col" className="py-2 text-xs font-semibold text-gov-muted">
                {w}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, weekIndex) => (
            <tr key={`${cursor.year}-${cursor.month}-w${weekIndex}`}>
              {week.map((date, i) => {
                if (!date) return <td key={`pad-${i}`} className="p-1" />;

                const status = statusOf(date);
                const selected = date === value;
                const isToday = date === today;
                const disabled = status !== 'open';

                const base =
                  'w-full aspect-square grid place-items-center text-sm rounded-md transition-colors duration-150';
                const tone = selected
                  ? 'bg-gov-teal text-white font-semibold'
                  : disabled
                    ? 'text-gray-300 cursor-not-allowed line-through'
                    : `text-gov-text hover:bg-gov-gray ${isToday ? 'border border-gov-teal font-semibold' : ''}`;

                return (
                  <td key={date} className="p-1">
                    <button
                      type="button"
                      className={`${base} ${tone}`}
                      disabled={disabled}
                      aria-pressed={selected}
                      aria-label={`${formatDate(date)}${
                        status === 'closed' ? ' — outpatient services closed' : ''
                      }`}
                      onClick={() => onChange(date)}
                    >
                      {Number(date.slice(8, 10))}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <p className="px-3 py-2 text-xs text-gov-muted border-t border-gov-border">
        Struck-through dates are closed or beyond the {maxAdvanceDays}-day booking window.
      </p>
    </div>
  );
}
