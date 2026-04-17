'use client';

import {
  BarChart as ReChartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "@/lib/use-theme";

interface ActivityChartProps {
  data?: { name: string; hours: number }[];
  loading?: boolean;
}

export function ActivityChart({ data, loading }: ActivityChartProps) {
  const { theme } = useTheme();
  const dark = theme === 'dark';

  const axisStroke      = dark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.30)';
  const gridStroke      = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
  const cursorFill      = dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)';
  const tooltipBg       = dark ? '#1e293b' : '#ffffff';
  const tooltipBorder   = dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)';
  const tooltipColor    = dark ? '#f1f5f9' : '#000000';
  const barFill         = dark ? '#e2e8f0' : '#171717';

  return (
    <div className="w-full h-full flex flex-col">
      {loading ? (
        <Skeleton className="h-full w-full rounded-none" />
      ) : (
        <div className="flex-1 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ReChartsBarChart data={data} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="0" vertical={false} stroke={gridStroke} />
              <XAxis
                dataKey="name"
                stroke={axisStroke}
                fontSize={10}
                fontWeight={700}
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              <YAxis
                stroke={axisStroke}
                fontSize={10}
                fontWeight={700}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}H`}
              />
              <Tooltip
                cursor={{ fill: cursorFill }}
                contentStyle={{
                  borderRadius: '8px',
                  border: `1px solid ${tooltipBorder}`,
                  boxShadow: 'none',
                  backgroundColor: tooltipBg,
                  padding: '8px 12px',
                }}
                labelStyle={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px', color: tooltipColor }}
                itemStyle={{ fontSize: '10px', fontWeight: 700, color: tooltipColor }}
              />
              <Bar dataKey="hours" fill={barFill} radius={[6, 6, 0, 0]} barSize={42} />
            </ReChartsBarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
