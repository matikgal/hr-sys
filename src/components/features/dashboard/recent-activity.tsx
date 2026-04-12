'use client';

import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Calendar, Terminal, User } from "lucide-react";
import { cn } from "@/lib/utils";

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
    <div className="space-y-6">
      {loading ? (
        [1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 py-3">
            <Skeleton className="size-10 rounded-xl" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-2 w-3/4" />
            </div>
          </div>
        ))
      ) : (
        <div className="space-y-2">
          {activities?.map((activity) => (
            <div 
              key={activity.id} 
              className="flex items-start gap-4 p-4 rounded-2xl transition-all duration-300 hover:bg-neutral-50 group border border-transparent hover:border-neutral-100"
            >
              <div className={cn(
                "size-10 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-300",
                activity.type === 'attendance' ? "bg-neutral-50 text-neutral-400 group-hover:bg-black group-hover:text-white" : "bg-neutral-50 text-neutral-400 group-hover:bg-neutral-900 group-hover:text-white"
              )}>
                {activity.type === 'attendance' ? (
                  <Clock size={16} strokeWidth={2.5} />
                ) : (
                  <Calendar size={16} strokeWidth={2.5} />
                )}
              </div>
              <div className="flex-1 min-w-0 py-0.5">
                <div className="flex justify-between items-start gap-2">
                  <p className="text-sm font-black text-neutral-900 uppercase tracking-tight truncate">{activity.user}</p>
                  <span className="text-[10px] text-neutral-300 font-black uppercase shrink-0 mt-0.5">{activity.time}</span>
                </div>
                <p className="text-[11px] text-neutral-400 font-medium uppercase tracking-widest mt-1 leading-snug group-hover:text-neutral-500 transition-colors italic">
                  {activity.action}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
      {!loading && activities?.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 space-y-6 bg-neutral-50/50 rounded-[32px] border-2 border-dashed border-neutral-100">
          <div className="size-16 rounded-full bg-white flex items-center justify-center shadow-sm">
            <Terminal size={24} className="text-neutral-200" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-neutral-400">Brak logów</p>
            <p className="text-xs text-neutral-300 font-medium italic">Wszystko jest aktualne.</p>
          </div>
        </div>
      )}
    </div>
  );
}
