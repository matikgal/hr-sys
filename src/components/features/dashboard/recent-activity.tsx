'use client';

import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Calendar, Inbox } from "lucide-react";
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
    <div className="space-y-0.5">
      {loading ? (
        [1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <Skeleton className="size-8 rounded-lg bg-muted" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-3 w-1/2 bg-muted" />
              <Skeleton className="h-2 w-3/4 bg-muted" />
            </div>
          </div>
        ))
      ) : (
        <>
          {activities?.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-3 rounded-lg transition-colors hover:bg-accent cursor-pointer group"
            >
              <div className={cn(
                "size-8 rounded-lg flex items-center justify-center shrink-0",
                activity.type === 'attendance'
                  ? "bg-muted text-foreground/70"
                  : "bg-muted text-foreground/70"
              )}>
                {activity.type === 'attendance'
                  ? <Clock size={14} strokeWidth={1.8} />
                  : <Calendar size={14} strokeWidth={1.8} />
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline gap-2">
                  <p className="text-[13px] font-medium text-foreground truncate">{activity.user}</p>
                  <span className="text-[10px] text-muted-foreground shrink-0">{activity.time}</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{activity.action}</p>
              </div>
            </div>
          ))}
          {!loading && (!activities || activities.length === 0) && (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <div className="size-12 rounded-xl bg-muted flex items-center justify-center">
                <Inbox size={18} className="text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-[12px] font-medium text-foreground/70">Brak aktywności</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Wszystko jest aktualne.</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
