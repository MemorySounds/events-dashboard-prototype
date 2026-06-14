// Ranked table of the busiest source IPs (GET /stats/top-source-ips). Each row
// shows the IP, its total event count, and a severity breakdown bar. The data
// arrives pre-sorted and top-N-limited from the server, so this is presentation
// only — no local sort/pagination needed.

import type { TopIp } from "@/lib/api";
import { SeverityBar } from "./SeverityBar";

export function TopIpsTable({ ips }: { ips: TopIp[] }) {
  return (
    <div className="overflow-x-auto rounded-md border border-gray-200">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th className="w-8 px-3 py-2 font-medium">#</th>
            <th className="px-3 py-2 font-medium">Source IP</th>
            <th className="px-3 py-2 font-medium">Total</th>
            <th className="px-3 py-2 font-medium">Severity breakdown</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {ips.map((ip, i) => (
            <tr key={ip.sourceIp} className="hover:bg-gray-50">
              <td className="px-3 py-2 text-gray-400">{i + 1}</td>
              <td className="px-3 py-2 font-mono text-xs text-gray-700">{ip.sourceIp}</td>
              <td className="px-3 py-2 font-medium text-gray-900">{ip.total}</td>
              <td className="px-3 py-2">
                <SeverityBar bySeverity={ip.bySeverity} total={ip.total} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
