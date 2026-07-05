"use client";

/**
 * Overview trend charts — son 30 gün.
 * Recharts ile 3 sparkline: yeni sticker, yeni user, yeni mesaj.
 */
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface TrendPoint {
  date: string; // "07-01" formatında
  stickersClaimed: number;
  newUsers: number;
  newMessages: number;
}

export function TrendsChart({ data }: { data: TrendPoint[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <ChartCard
        title="Yeni Claim (30 gün)"
        color="#059669"
        dataKey="stickersClaimed"
        data={data}
      />
      <ChartCard
        title="Yeni Kullanıcı (30 gün)"
        color="#0F1B3D"
        dataKey="newUsers"
        data={data}
      />
      <ChartCard
        title="Yeni Mesaj (30 gün)"
        color="#D4F36A"
        dataKey="newMessages"
        data={data}
        darkFill
      />
    </div>
  );
}

function ChartCard({
  title,
  color,
  dataKey,
  data,
  darkFill,
}: {
  title: string;
  color: string;
  dataKey: keyof TrendPoint;
  data: TrendPoint[];
  darkFill?: boolean;
}) {
  const total = data.reduce((sum, d) => sum + (d[dataKey] as number), 0);

  return (
    <div className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <p className="text-xs font-medium text-charcoal/60">{title}</p>
        <p className="text-2xl font-bold text-navy tabular-nums">
          {total.toLocaleString("tr-TR")}
        </p>
      </div>
      <div className="h-24">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={darkFill ? 0.6 : 0.35} />
                <stop offset="100%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "#6B7280" }}
              axisLine={false}
              tickLine={false}
              interval={4}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                background: "#0F1B3D",
                border: "none",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: "#D4F36A", fontWeight: 700 }}
              itemStyle={{ color: "#FFFFFF" }}
              formatter={(v: number) => [v.toLocaleString("tr-TR"), title]}
            />
            <Area
              type="monotone"
              dataKey={dataKey as string}
              stroke={color}
              strokeWidth={2}
              fill={`url(#grad-${dataKey})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
