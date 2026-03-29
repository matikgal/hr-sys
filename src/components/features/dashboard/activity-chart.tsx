'use client';

import { 
  BarChart as ReChartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

interface ActivityChartProps {
  data?: { name: string; hours: number }[];
  loading?: boolean;
}

export function ActivityChart({ data, loading }: ActivityChartProps) {
  return (
    <div className="w-full h-full flex flex-col">
      {loading ? (
        <Skeleton className="h-full w-full rounded-none" />
      ) : (
        <div className="flex-1 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ReChartsBarChart data={data} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="0" vertical={false} stroke="rgba(0,0,0,0.05)" />
              <XAxis 
                dataKey="name" 
                stroke="rgba(0,0,0,0.3)" 
                fontSize={10} 
                fontWeight={800}
                tickLine={false} 
                axisLine={false}
                dy={10}
              />
              <YAxis 
                stroke="rgba(0,0,0,0.3)" 
                fontSize={10} 
                fontWeight={800}
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(value) => `${value}H`}
              />
              <Tooltip 
                cursor={{fill: 'rgba(0,0,0,0.02)'}}
                contentStyle={{ 
                  borderRadius: '0', 
                  border: '1px solid rgba(0,0,0,0.1)', 
                  boxShadow: 'none',
                  backgroundColor: '#fff',
                  padding: '8px'
                }}
                labelStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}
                itemStyle={{ fontSize: '10px', fontWeight: 'black', color: '#000' }}
              />
              <Bar 
                dataKey="hours" 
                fill="#000" 
                radius={0} 
                barSize={40}
              >
                {data?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fillOpacity={1} />
                ))}
              </Bar>
            </ReChartsBarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
