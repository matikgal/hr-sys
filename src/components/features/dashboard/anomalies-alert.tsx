'use client';

import { AlertTriangle } from "lucide-react";

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
        <div key={i} className="flex items-start gap-3 p-4 rounded-xl border border-amber-100 bg-amber-50">
          <AlertTriangle className="mt-0.5 size-4 text-amber-600 shrink-0" strokeWidth={2} />
          <div className="flex-1">
            <div className="flex justify-between items-baseline gap-2">
              <h4 className="text-[12px] font-semibold text-amber-900">{anomaly.employeeName}</h4>
              <span className="text-[10px] font-medium text-amber-600 uppercase tracking-wide">Uwaga</span>
            </div>
            <p className="text-[12px] text-amber-700 mt-0.5 leading-relaxed">{anomaly.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
