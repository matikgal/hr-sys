'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useTheme } from '@/lib/use-theme';

const data = [
  { month: 'Maj', actual: 1050 },
  { month: 'Cze', actual: 1089 },
  { month: 'Lip', actual: 1112 },
  { month: 'Sie', actual: 1130 },
  { month: 'Wrz', actual: 1148 },
  { month: 'Paź', actual: 1165 },
  { month: 'Lis', actual: 1182 },
  { month: 'Gru', actual: 1198 },
  { month: 'Sty', actual: 1215 },
  { month: 'Lut', actual: 1234 },
  { month: 'Mar', actual: 1247 },
  { month: 'Kwi', actual: 1284 },
];

export function EmploymentChart() {
  const { theme } = useTheme();
  const dark = theme === 'dark';

  const gridStroke   = dark ? 'rgba(255,255,255,0.05)' : '#ececea';
  const axisColor    = dark ? 'rgba(255,255,255,0.35)' : '#9aa0a8';
  const areaColor    = '#0a6b3e';
  const tooltipBg    = dark ? '#1e293b' : '#0e1014';

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="empGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={areaColor} stopOpacity={0.22} />
            <stop offset="100%" stopColor={areaColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="0" vertical={false} stroke={gridStroke} />
        <XAxis
          dataKey="month"
          stroke={axisColor}
          tick={{ fill: axisColor, fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          dy={8}
        />
        <YAxis
          stroke={axisColor}
          tick={{ fill: axisColor, fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
          domain={['dataMin - 50', 'dataMax + 30']}
        />
        <Tooltip
          contentStyle={{
            background: tooltipBg,
            border: 'none',
            borderRadius: '8px',
            padding: '8px 12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
          labelStyle={{ color: 'rgba(255,255,255,0.6)', fontSize: '10px', marginBottom: '2px' }}
          itemStyle={{ color: '#ffffff', fontSize: '13px', fontWeight: 600 }}
          cursor={{ stroke: areaColor, strokeWidth: 1, strokeDasharray: '4 4' }}
          formatter={(v) => [Number(v).toLocaleString('pl'), 'Pracownicy']}
        />
        <Area
          type="monotone"
          dataKey="actual"
          stroke={areaColor}
          strokeWidth={2.4}
          fill="url(#empGrad)"
          dot={false}
          activeDot={{ r: 4, fill: areaColor, stroke: '#fff', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
