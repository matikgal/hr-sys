'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const depts = [
  { name: 'Inżynieria',  pct: 32, color: '#0a6b3e' },
  { name: 'Sprzedaż',    pct: 24, color: '#1a7f4a' },
  { name: 'Operacje',    pct: 19, color: '#4a9a6a' },
  { name: 'Marketing',   pct: 15, color: '#7dbd8f' },
  { name: 'HR',          pct: 7,  color: '#b2d9bc' },
  { name: 'Finanse',     pct: 4,  color: '#d8e8dc' },
];

export function DepartmentDonut({ total }: { total?: number }) {
  return (
    <div className="flex items-center gap-5">
      <div className="relative shrink-0" style={{ width: 148, height: 148 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={depts}
              cx="50%"
              cy="50%"
              innerRadius={48}
              outerRadius={70}
              paddingAngle={2}
              dataKey="pct"
              strokeWidth={0}
            >
              {depts.map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: '#0e1014',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 10px',
              }}
              labelStyle={{ display: 'none' }}
              itemStyle={{ color: '#fff', fontSize: '12px' }}
              formatter={(v) => [`${v}%`, '']}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[22px] font-semibold text-foreground leading-none">{total ?? '—'}</span>
          <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider mt-1">prac.</span>
        </div>
      </div>
      <div className="space-y-1.5 flex-1 min-w-0">
        {depts.map((d) => (
          <div key={d.name} className="flex items-center gap-2">
            <div className="size-2 rounded-sm shrink-0" style={{ background: d.color }} />
            <span className="text-[11.5px] text-foreground/75 flex-1 truncate">{d.name}</span>
            <span className="text-[11px] text-muted-foreground font-medium tabular-nums">{d.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
