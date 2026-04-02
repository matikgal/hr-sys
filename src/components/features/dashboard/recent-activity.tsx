'use client';

import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Calendar, MessageSquare, Terminal } from "lucide-react";

interface RecentActivityProps {
  activities?: {
    id: string;
    type: 'attendance' | 'leave';
    user: string;
    action: string;
    time: string;
  }[];
  loading?: boolean;
}

export function RecentActivity({ activities, loading }: RecentActivityProps) {
  return (
    <div className="space-y-4">
      {loading ? (
        [1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex items-center gap-4 py-2">
            <Skeleton className="size-8 rounded-none" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-2 w-2/3" />
            </div>
          </div>
        ))
      ) : (
        <div className="border-t border-neutral-100 divide-y divide-neutral-50">
          {activities?.map((activity) => (
            <div key={activity.id} className="flex items-start gap-4 py-4 group hover:bg-neutral-50 transition-colors px-2 -mx-2">
              <div className="mt-0.5">
                {activity.type === 'attendance' ? (
                  <Clock size={14} className="text-neutral-400 group-hover:text-black transition-colors" />
                ) : (
                  <Calendar size={14} className="text-neutral-400 group-hover:text-black transition-colors" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline gap-2">
                  <p className="text-xs font-bold text-black uppercase tracking-tight truncate">{activity.user}</p>
                  <span className="text-[9px] text-neutral-300 font-black uppercase shrink-0">{activity.time}</span>
                </div>
                <p className="text-[10px] text-neutral-400 uppercase tracking-widest mt-1 leading-snug">{activity.action}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      {!loading && activities?.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 space-y-4 opacity-20 border-2 border-dashed border-neutral-100">
          <Terminal size={24} />
          <p className="text-[10px] font-black uppercase tracking-[0.2em]">Zero logs found</p>
        </div>
      )}
    </div>
  );
}
