'use client';

import { AlertCircle, ShieldAlert } from "lucide-react";

interface AnomaliesAlertProps {
  anomalies?: {
    type: string;
    employeeName: string;
    description: string;
  }[];
}

export function AnomaliesAlert({ anomalies }: AnomaliesAlertProps) {
  if (!anomalies || anomalies.length === 0) return null;

  return (
    <div className="space-y-2">
      {anomalies.map((anomaly, i) => (
        <div key={i} className="flex items-start gap-4 p-4 border border-red-100 bg-red-50/30 group">
          <div className="mt-0.5">
            <ShieldAlert className="size-4 text-red-500" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-baseline">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-red-600">Violation: {anomaly.employeeName}</h4>
              <span className="text-[8px] font-black text-red-400 uppercase tracking-[0.2em]">Security Tier 1</span>
            </div>
            <p className="text-[11px] font-bold text-red-900 mt-1 leading-relaxed uppercase tracking-tight">
              {anomaly.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
