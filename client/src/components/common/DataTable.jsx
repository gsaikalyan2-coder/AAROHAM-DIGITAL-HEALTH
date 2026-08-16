import EmptyState from './EmptyState.jsx';

/**
 * columns: [{ key, header, render?, className? }]
 * Domain-agnostic on purpose — reusable for consultations, schemes, audit logs.
 */
export default function DataTable({ columns, rows, emptyTitle = 'No records', emptyMessage }) {
  if (!rows?.length) return <EmptyState title={emptyTitle} message={emptyMessage} />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px]">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} scope="col" className="gov-th">{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id ?? i} className="hover:bg-gov-gray transition-colors duration-150">
              {columns.map((c) => (
                <td key={c.key} className={`gov-td ${c.className || ''}`}>
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
