import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { format, parseISO } from "date-fns";
import type { DailyClick, DeviceStats, GeoStat } from "../types";

// ── Shared palette ─────────────────────────────────────────────────────────────
const COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4"];

const tooltipStyle = {
  backgroundColor: "#111827",
  border: "1px solid #374151",
  borderRadius: "8px",
  color: "#f3f4f6",
  fontSize: "13px",
};

// ── Clicks over time ──────────────────────────────────────────────────────────

interface ClicksChartProps {
  data: DailyClick[];
  loading?: boolean;
}

export function ClicksChart({ data, loading }: ClicksChartProps) {
  if (loading) return <ChartSkeleton />;
  if (!data.length)
    return <EmptyChart label="No click data yet" />;

  const formatted = data.map((d) => ({
    date: format(parseISO(d.date), "MMM d"),
    clicks: d.count,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={formatted} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="clickGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: "#6b7280", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#6b7280", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
  contentStyle={tooltipStyle}
  cursor={{ stroke: "#374151" }}
/>
        <Area
          type="monotone"
          dataKey="clicks"
          stroke="#3b82f6"
          strokeWidth={2}
          fill="url(#clickGradient)"
          dot={false}
          activeDot={{ r: 4, fill: "#3b82f6", stroke: "#1d4ed8", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── Device breakdown (pie) ────────────────────────────────────────────────────

interface DeviceChartProps {
  data: DeviceStats | null;
  loading?: boolean;
}

export function DeviceChart({ data, loading }: DeviceChartProps) {
  if (loading) return <ChartSkeleton height={200} />;
  if (!data?.devices?.length) return <EmptyChart label="No device data yet" />;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data.devices}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={3}
          strokeWidth={0}
        >
          {data.devices.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(v) => <span style={{ color: "#9ca3af", fontSize: 12 }}>{v}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ── Browser bar chart ─────────────────────────────────────────────────────────

interface BrowserChartProps {
  data: DeviceStats | null;
  loading?: boolean;
}

export function BrowserChart({ data, loading }: BrowserChartProps) {
  if (loading) return <ChartSkeleton />;
  if (!data?.browsers?.length) return <EmptyChart label="No browser data yet" />;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        data={data.browsers}
        layout="vertical"
        margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fill: "#6b7280", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fill: "#9ca3af", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={70}
        />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={20}>
          {data.browsers.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Geo table ────────────────────────────────────────────────────────────────

interface GeoTableProps {
  data: GeoStat[];
  loading?: boolean;
}

export function GeoTable({ data, loading }: GeoTableProps) {
  if (loading) return <ChartSkeleton height={180} />;
  if (!data.length) return <EmptyChart label="No geo data yet" />;

  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <div className="space-y-2">
      {data.slice(0, 8).map((item, i) => {
        const pct = total ? Math.round((item.count / total) * 100) : 0;
        return (
          <div key={i} className="flex items-center gap-3">
            <span className="text-sm text-gray-300 w-32 truncate">{item.country}</span>
            <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-brand-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-sm text-gray-400 w-16 text-right">
              {item.count.toLocaleString()} <span className="text-gray-600">({pct}%)</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  sub?: string;
  color?: string;
}

export function StatCard({ label, value, icon, sub, color = "text-brand-400" }: StatCardProps) {
  return (
    <div className="card p-5 flex items-start gap-4">
      <div className={`p-2.5 rounded-lg bg-gray-800 ${color}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-sm text-gray-400">{label}</p>
        <p className="text-2xl font-bold text-white mt-0.5">
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
        {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Skeletons & Empty ─────────────────────────────────────────────────────────

function ChartSkeleton({ height = 260 }: { height?: number }) {
  return (
    <div
      className="animate-pulse bg-gray-800/50 rounded-lg w-full"
      style={{ height }}
    />
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center h-40 text-gray-500 text-sm">
      {label}
    </div>
  );
} 