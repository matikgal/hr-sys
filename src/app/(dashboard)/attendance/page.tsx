'use client';

import React, { useState, useEffect } from 'react';
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
import { 
  getTodayAttendance, 
  clockIn, 
  clockOut, 
  getEmployeeAttendanceHistory 
} from '@/services/db/attendance';
import { getAllEmployees } from '@/services/db/employees';
import { Attendance, Employee } from '@/types';
import { cn } from '@/lib/utils';

export default function AttendancePage() {
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [todayRecord, setTodayRecord] = useState<Attendance | null>(null);
  const [history, setHistory] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function initData() {
      try {
        const employees = await getAllEmployees({ limit: 1 });
        if (employees.length > 0) {
          const emp = employees[0];
          setCurrentEmployee(emp);
          
          const today = await getTodayAttendance(emp.id);
          setTodayRecord(today);
          
          const historyData = await getEmployeeAttendanceHistory(emp.id);
          setHistory(historyData);
        }
      } catch (error) {
        console.error("Error initializing attendance data:", error);
      } finally {
        setLoading(false);
      }
    }
    initData();
  }, []);

  const handleClockIn = async () => {
    if (!currentEmployee) return;
    setActionLoading(true);
    try {
      const name = `${currentEmployee.firstName} ${currentEmployee.lastName}`;
      await clockIn(currentEmployee.id, name);
      
      const updatedToday = await getTodayAttendance(currentEmployee.id);
      setTodayRecord(updatedToday);
      
      const updatedHistory = await getEmployeeAttendanceHistory(currentEmployee.id);
      setHistory(updatedHistory);
    } catch (error) {
      console.error("Clock in error:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!todayRecord) return;
    setActionLoading(true);
    try {
      await clockOut(todayRecord.id, todayRecord.events);
      
      const updatedToday = await getTodayAttendance(todayRecord.employeeId);
      setTodayRecord(updatedToday);
      
      const updatedHistory = await getEmployeeAttendanceHistory(todayRecord.employeeId);
      setHistory(updatedHistory);
    } catch (error) {
      console.error("Clock out error:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const isWorking = todayRecord && todayRecord.events[todayRecord.events.length - 1].type === 'in';

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 pb-12 pt-4 px-6">
      {/* Crisp Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Czas i obecność</h1>
          <p className="text-sm text-neutral-500 mt-1">Zarządzanie czasem pracy i rejestracja zdarzeń</p>
        </div>
        <div className="flex items-center gap-2">
          {currentEmployee && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-md">
              <span className="size-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-xs font-bold text-neutral-700 uppercase tracking-tight">
                {currentEmployee.firstName} {currentEmployee.lastName}
              </span>
            </div>
          )}
          <Button variant="outline" size="sm" className="h-9 rounded-md border-neutral-200 font-medium">
            <History size={14} className="mr-2" /> Raporty
          </Button>
        </div>
      </header>

      {/* Stats Row */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 border border-neutral-200 rounded-md divide-y sm:divide-y-0 sm:divide-x divide-neutral-200 overflow-hidden bg-white">
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
          <div className="bg-white border border-neutral-200 rounded-md overflow-hidden h-full">
            <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50/30 flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-900">Rejestracja zdarzeń</h3>
              <div className="flex items-center gap-1.5">
                <span className={cn("size-1.5 rounded-full", isWorking ? "bg-emerald-500 animate-pulse" : "bg-neutral-300")}></span>
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-tight">System aktywny</span>
              </div>
            </div>
            <div className="p-8 flex flex-col items-center justify-center text-center space-y-8">
              <div className="space-y-2">
                <div className="text-5xl font-black tracking-tighter text-neutral-900">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <p className="text-xs font-bold text-neutral-400 uppercase tracking-[0.2em]">
                  {new Date().toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4">
                <Button 
                  size="lg" 
                  className={cn(
                    "h-12 px-8 rounded-md font-bold transition-all shadow-sm",
                    isWorking 
                      ? "bg-neutral-100 text-neutral-400 cursor-not-allowed border-neutral-200" 
                      : "bg-black text-white hover:bg-neutral-800"
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
                    "h-12 px-8 rounded-md font-bold transition-all shadow-sm border-neutral-200",
                    !isWorking 
                      ? "text-neutral-300 border-neutral-100" 
                      : "text-red-600 hover:bg-red-50 hover:border-red-200 hover:text-red-700"
                  )}
                  onClick={handleClockOut}
                  disabled={loading || actionLoading || !isWorking}
                >
                  <Square size={18} className="mr-2 fill-current" /> Zakończ pracę
                </Button>
              </div>

              {todayRecord && todayRecord.events.length > 0 && (
                <div className="flex items-center gap-2 text-xs font-medium text-neutral-500 bg-neutral-50 px-3 py-1.5 rounded-full border border-neutral-100">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  Ostatnie wejście: <span className="text-neutral-900 font-bold">{formatTime(todayRecord.events[todayRecord.events.length - 1].timestamp)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info Sidebar */}
        <div className="lg:col-span-4">
          <div className="bg-white border border-neutral-200 rounded-md overflow-hidden h-full">
            <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50/30">
              <h3 className="text-sm font-bold text-neutral-900">Informacje systemowe</h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-start gap-3">
                <div className="size-8 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                  <Info size={16} className="text-blue-500" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-neutral-900">Automatyczne zamykanie</p>
                  <p className="text-xs text-neutral-500 leading-relaxed font-medium">
                    Pamiętaj o zarejestrowaniu wyjścia. System automatycznie zamyka sesje po 12 godzinach ciągłej aktywności.
                  </p>
                </div>
              </div>
              
              <div className="pt-6 border-t border-neutral-100">
                <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-4">Twój grafik na dziś</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-500 font-medium">Planowane wejście</span>
                    <span className="text-neutral-900 font-bold italic">08:00</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-500 font-medium">Planowane wyjście</span>
                    <span className="text-neutral-900 font-bold italic">16:00</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-500 font-medium">Przerwa</span>
                    <span className="text-neutral-900 font-bold italic">30 min</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white border border-neutral-200 rounded-md overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50/30 flex items-center justify-between">
          <h3 className="text-sm font-bold text-neutral-900">Historia obecności (ostatnie 30 dni)</h3>
          <Button variant="ghost" size="sm" className="h-8 text-xs font-bold text-neutral-500 hover:text-black uppercase tracking-tight">
            Pełna historia <ArrowRight size={14} className="ml-1" />
          </Button>
        </div>
        <Table>
          <TableHeader className="bg-neutral-50/30">
            <TableRow className="hover:bg-transparent border-neutral-200">
              <TableHead className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 py-3 pl-6">Data</TableHead>
              <TableHead className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 py-3">Wejście</TableHead>
              <TableHead className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 py-3">Wyjście</TableHead>
              <TableHead className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 py-3">Suma godzin</TableHead>
              <TableHead className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 py-3">Zdarzenia</TableHead>
              <TableHead className="text-right text-[11px] font-bold uppercase tracking-wider text-neutral-500 py-3 pr-6">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [1, 2, 3, 4, 5].map((i) => (
                <TableRow key={i} className="border-neutral-100">
                  <TableCell colSpan={6} className="py-4 px-6"><Skeleton className="h-8 w-full" /></TableCell>
                </TableRow>
              ))
            ) : history.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center">
                  <p className="text-sm font-medium text-neutral-500">Brak historii obecności.</p>
                </TableCell>
              </TableRow>
            ) : history.map((record) => {
              const firstIn = record.events.find(e => e.type === 'in');
              const lastOut = [...record.events].reverse().find(e => e.type === 'out');
              
              return (
                <TableRow key={record.id} className="group hover:bg-neutral-50/50 transition-colors border-neutral-100">
                  <TableCell className="py-3 pl-6 font-semibold text-sm text-neutral-900">
                    {record.date}
                  </TableCell>
                  <TableCell className="py-3 text-sm text-neutral-600 font-medium">{firstIn ? formatTime(firstIn.timestamp) : '--:--'}</TableCell>
                  <TableCell className="py-3 text-sm text-neutral-600 font-medium">{lastOut ? formatTime(lastOut.timestamp) : '--:--'}</TableCell>
                  <TableCell className="py-3 text-sm font-black text-neutral-900">{record.totalHours}h</TableCell>
                  <TableCell className="py-3">
                    <HoverCard openDelay={100}>
                      <HoverCardTrigger asChild>
                        <button className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-neutral-100 text-[10px] font-bold text-neutral-600 uppercase tracking-tight hover:bg-neutral-200 transition-colors">
                          <MoreHorizontal size={12} /> {record.events.length} LOGI
                        </button>
                      </HoverCardTrigger>
                      <HoverCardContent align="start" className="w-64 p-0 border-neutral-200 shadow-lg rounded-md overflow-hidden">
                        <div className="bg-neutral-50 px-4 py-2 border-b border-neutral-200">
                          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Zdarzenia z dnia {record.date}</span>
                        </div>
                        <div className="p-2 max-h-48 overflow-y-auto">
                          {record.events.map((event, idx) => (
                            <div key={idx} className="flex justify-between items-center px-2 py-1.5 hover:bg-neutral-50 rounded">
                              <span className={cn(
                                "text-[9px] font-black px-1.5 py-0.5 rounded border uppercase tracking-tighter",
                                event.type === 'in' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-neutral-50 text-neutral-600 border-neutral-200"
                              )}>
                                {event.type === 'in' ? 'WEJŚCIE' : 'WYJŚCIE'}
                              </span>
                              <span className="text-xs font-bold text-neutral-900">{formatTime(event.timestamp)}</span>
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
        <div className="text-neutral-400">{icon}</div>
        <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex items-baseline justify-between">
        <span className={cn(
          "text-3xl font-bold tracking-tight",
          highlight ? "text-emerald-600" : "text-neutral-900"
        )}>
          {value}
        </span>
        {trend && (
          <span className="text-[10px] font-bold bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded">
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
