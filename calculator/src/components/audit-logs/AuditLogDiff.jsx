/**
 * AuditLogDiff — displays changes in "was → became" format
 */
export function AuditLogDiff({ oldData, newData }) {
  if (!oldData && !newData) {
    return <p className="text-sm text-neutral-400 italic">No change data available</p>;
  }

  // Calculate diff
  const allKeys = new Set([
    ...Object.keys(oldData || {}),
    ...Object.keys(newData || {}),
  ]);

  const changes = [];
  for (const key of allKeys) {
    const oldVal = oldData?.[key];
    const newVal = newData?.[key];

    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changes.push({ field: key, from: oldVal, to: newVal });
    }
  }

  if (changes.length === 0) {
    return <p className="text-sm text-neutral-400 italic">No differences detected</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-200">
            <th className="text-left py-1.5 pr-4 text-xs font-medium text-neutral-500 uppercase">Field</th>
            <th className="text-left py-1.5 pr-4 text-xs font-medium text-neutral-500 uppercase">Was</th>
            <th className="text-left py-1.5 text-xs font-medium text-neutral-500 uppercase">Became</th>
          </tr>
        </thead>
        <tbody>
          {changes.map(({ field, from, to }) => (
            <tr key={field} className="border-b border-neutral-100">
              <td className="py-1.5 pr-4 font-mono text-xs text-neutral-600">{field}</td>
              <td className="py-1.5 pr-4">
                <span className="inline-block bg-red-50 text-red-700 px-1.5 py-0.5 rounded text-xs font-mono max-w-[200px] truncate">
                  {formatValue(from)}
                </span>
              </td>
              <td className="py-1.5">
                <span className="inline-block bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded text-xs font-mono max-w-[200px] truncate">
                  {formatValue(to)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatValue(val) {
  if (val === null || val === undefined) return 'null';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

export default AuditLogDiff;
