import { Area, AreaChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { HistoryPoint } from '../types';

export function LatencyChart({ data, id = 'latency', height = 54 }: { data?: HistoryPoint[]; id?: string; height?: number }) {
  const safeData = (data ?? []).map((point) => ({ ...point, value: point.responseTimeMs ?? 0 }));
  return <div className="sparkline" style={{ height }}>
    {safeData.length > 1 ? <ResponsiveContainer width="100%" height="100%"><AreaChart data={safeData}>
      <defs><linearGradient id={`gradient-${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6572ec" stopOpacity={0.23} /><stop offset="100%" stopColor="#6572ec" stopOpacity={0.015} /></linearGradient></defs>
      <Tooltip cursor={false} content={({ active, payload }) => active && payload?.[0] ? <div className="chart-tooltip">{Math.round(Number(payload[0].value))} ms</div> : null} />
      <Area type="monotone" dataKey="value" stroke="#6974e9" strokeWidth={2} fill={`url(#gradient-${id})`} isAnimationActive={false} />
    </AreaChart></ResponsiveContainer> : <div className="chart-empty">Your response history will appear here after the first check.</div>}
  </div>;
}
