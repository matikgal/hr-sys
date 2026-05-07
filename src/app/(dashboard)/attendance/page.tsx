'use client';

import React from 'react';
import { 
  Clock, 
  Play, 
  Square,
  History,
  Info,
  Calendar as CalendarIcon,
  Timer,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Attendance, Employee } from '@/types';
import { cn } from '@/lib/utils';
import { useEmployees } from '@/hooks/use-employees';
import { useTodayAttendance, useAttendanceHistory, useClockIn, useClockOut } from '@/hooks/use-attendance';

export default function AttendancePage() {
  const { data: employees = [], isLoading: empLoading } = useEmployees({ limit: 1 });
  const currentEmployee = employees[0] ?? null;
  const empId = currentEmployee?.id;

  const { data: todayRecord, isLoading: todayLoading } = useTodayAttendance(empId);
  const { data: history = [], isLoading: historyLoading } = useAttendanceHistory(empId);
  const loading = empLoading || todayLoading || historyLoading;

  const clockInMutation = useClockIn(empId);
  const clockOutMutation = useClockOut(empId);
  const actionLoading = clockInMutation.isPending || clockOutMutation.isPending;

  const handleClockIn = () => {
    if (!currentEmployee) return;
    clockInMutation.mutate({
      name: `${currentEmployee.firstName} ${currentEmployee.lastName}`,
    });
  };

  const handleClockOut = () => {
    if (!todayRecord) return;
    clockOutMutation.mutate({ recordId: todayRecord.id, events: todayRecord.events });
  };

  const isWorking = todayRecord && todayRecord.events[todayRecord.events.length - 1].type === 'in';

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="max-w-[1440px] mx-auto space-y-8 pb-12 px-8 py-10">
      {/* Crisp Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Czas i obecność</h1>
          <p className="text-sm text-muted-foreground mt-1">Zarządzanie czasem pracy i rejestracja zdarzeń</p>
        </div>
        <div className="flex items-center gap-2">
          {currentEmployee && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-muted border border-border rounded-md">
              <span className="size-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-xs font-bold text-foreground/80 uppercase tracking-tight">
                {currentEmployee.firstName} {currentEmployee.lastName}
              </span>
            </div>
          )}
          <Button variant="outline" size="sm" className="h-9 rounded-md border-border font-medium">
            <History size={14} className="mr-2" /> Raporty
          </Button>
        </div>
      </header>

      {/* Stats Row */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 border border-border rounded-md divide-y sm:divide-y-0 sm:divide-x divide-border overflow-hidden bg-card">
        <StatCell 
          label="Dzisiejszy status" 
          value={loading ? "..." : (isWorking ? "W pracy" : "Poza pracą")} 
          icon={<Clock size={16} />} 
          highlight={isWorking}
        />
        <StatCell 
          label="Godziny dzisiaj" 
          value={`${todayRecord?.totalHours || '0.00'}h`} 
          icon={<Timer size={16} />} 
        />
        <StatCell 
          label="Tygodniowa suma" 
          value="38.5h" 
          icon={<CalendarIcon size={16} />} 
        />
        <StatCell 
          label="Nadgodziny" 
          value="2.5h" 
          icon={<AlertCircle size={16} />} 
          trend="+0.5h"
        />
      </section>

      {/* Action Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Registration Panel */}
        <div className="lg:col-span-8">
          <div className="bg-card border border-border rounded-md overflow-hidden h-full">
            <div className="px-6 py-4 border-b border-border bg-accent/30 flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">Rejestracja zdarzeń</h3>
              <div className="flex items-center gap-1.5">
                <span className={cn("size-1.5 rounded-full", isWorking ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/30")}></span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">System aktywny</span>
              </div>
            </div>
            <div className="p-8 flex flex-col items-center justify-center text-center space-y-8">
              <div className="space-y-2">
                <div className="text-5xl font-black tracking-tighter text-foreground">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">
                  {new Date().toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4">
                <Button 
                  size="lg" 
                  className={cn(
                    "h-12 px-8 rounded-md font-bold transition-all shadow-sm",
                    isWorking 
                      ? "bg-muted text-muted-foreground cursor-not-allowed border-border" 
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  )}
                  onClick={handleClockIn}
                  disabled={loading || actionLoading || !!isWorking}
                >
                  <Play size={18} className="mr-2 fill-current" /> Rozpocznij pracę
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className={cn(
                    "h-12 px-8 rounded-md font-bold transition-all shadow-sm border-border",
                    !isWorking 
                      ? "text-muted-foreground/50 border-border/50" 
                      : "text-red-600 hover:bg-red-50 hover:border-red-200 hover:text-red-700"
                  )}
                  onClick={handleClockOut}
                  disabled={loading || actionLoading || !isWorking}
                >
                  <Square size={18} className="mr-2 fill-current" /> Zakończ pracę
                </Button>
              </div>

              {todayRecord && todayRecord.events.length > 0 && (
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-muted px-3 py-1.5 rounded-full border border-border/50">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  Ostatnie wejście: <span className="text-foreground font-bold">{formatTime(todayRecord.events[todayRecord.events.length - 1].timestamp)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info Sidebar */}
        <div className="lg:col-span-4">
          <div className="bg-card border border-border rounded-md overflow-hidden h-full">
            <div className="px-6 py-4 border-b border-border bg-accent/30">
              <h3 className="text-sm font-bold text-foreground">Informacje systemowe</h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-start gap-3">
                <div className="size-8 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                  <Info size={16} className="text-blue-500" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-foreground">Automatyczne zamykanie</p>
                  <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                    Pamiętaj o zarejestrowaniu wyjścia. System automatycznie zamyka sesje po 12 godzinach ciągłej aktywności.
                  </p>
                </div>
              </div>
              
              <div className="pt-6 border-t border-border/50">
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">Twój grafik na dziś</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium">Planowane wejście</span>
                    <span className="text-foreground font-bold italic">08:00</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium">Planowane wyjście</span>
                    <span className="text-foreground font-bold italic">16:00</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium">Przerwa</span>
                    <span className="text-foreground font-bold italic">30 min</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-card border border-border rounded-md overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-accent/30 flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground">Historia obecności (ostatnie 30 dni)</h3>
          <Button variant="ghost" size="sm" className="h-8 text-xs font-bold text-muted-foreground hover:text-foreground uppercase tracking-tight">
            Pełna historia <ArrowRight size={14} className="ml-1" />
          </Button>
        </div>
        <Table>
          <TableHeader className="bg-accent/30">
            <TableRow className="hover:bg-transparent border-border">
              <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3 pl-6">Data</TableHead>
              <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3">Wejście</TableHead>
              <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3">Wyjście</TableHead>
              <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3">Suma godzin</TableHead>
              <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3">Zdarzenia</TableHead>
              <TableHead className="text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3 pr-6">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [1, 2, 3, 4, 5].map((i) => (
                <TableRow key={i} className="border-border/50">
                  <TableCell colSpan={6} className="py-4 px-6"><Skeleton className="h-8 w-full" /></TableCell>
                </TableRow>
              ))
            ) : history.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center">
                  <p className="text-sm font-medium text-muted-foreground">Brak historii obecności.</p>
                </TableCell>
              </TableRow>
            ) : history.map((record) => {
              const firstIn = record.events.find(e => e.type === 'in');
              const lastOut = [...record.events].reverse().find(e => e.type === 'out');
              
              return (
                <TableRow key={record.id} className="group hover:bg-accent/50 transition-colors border-border/50">
                  <TableCell className="py-3 pl-6 font-semibold text-sm text-foreground">
                    {record.date}
                  </TableCell>
                  <TableCell className="py-3 text-sm text-foreground/70 font-medium">{firstIn ? formatTime(firstIn.timestamp) : '--:--'}</TableCell>
                  <TableCell className="py-3 text-sm text-foreground/70 font-medium">{lastOut ? formatTime(lastOut.timestamp) : '--:--'}</TableCell>
                  <TableCell className="py-3 text-sm font-black text-foreground">{record.totalHours}h</TableCell>
                  <TableCell className="py-3">
                    <HoverCard openDelay={100}>
                      <HoverCardTrigger asChild>
                        <button className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-muted text-[10px] font-bold text-foreground/70 uppercase tracking-tight hover:bg-border transition-colors">
                          <MoreHorizontal size={12} /> {record.events.length} LOGI
                        </button>
                      </HoverCardTrigger>
                      <HoverCardContent align="start" className="w-64 p-0 border-border shadow-lg rounded-md overflow-hidden">
                        <div className="bg-muted px-4 py-2 border-b border-border">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Zdarzenia z dnia {record.date}</span>
                        </div>
                        <div className="p-2 max-h-48 overflow-y-auto">
                          {record.events.map((event, idx) => (
                            <div key={idx} className="flex justify-between items-center px-2 py-1.5 hover:bg-muted rounded">
                              <span className={cn(
                                "text-[9px] font-black px-1.5 py-0.5 rounded border uppercase tracking-tighter",
                                event.type === 'in' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-muted text-foreground/70 border-border"
                              )}>
                                {event.type === 'in' ? 'WEJŚCIE' : 'WYJŚCIE'}
                              </span>
                              <span className="text-xs font-bold text-foreground">{formatTime(event.timestamp)}</span>
                            </div>
                          ))}
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  </TableCell>
                  <TableCell className="py-3 text-right pr-6">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight bg-emerald-50 text-emerald-600 border border-emerald-100">Obecny</span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function StatCell({ label, value, icon, trend, highlight }: any) {
  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-2">
        <div className="text-muted-foreground">{icon}</div>
        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex items-baseline justify-between">
        <span className={cn(
          "text-3xl font-bold tracking-tight",
          highlight ? "text-emerald-600" : "text-foreground"
        )}>
          {value}
        </span>
        {trend && (
          <span className="text-[10px] font-bold bg-muted text-foreground/70 px-1.5 py-0.5 rounded">
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
