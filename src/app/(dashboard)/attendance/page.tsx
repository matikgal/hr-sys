'use client';

import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Play, 
  Square,
  History,
  Info,
  Calendar as CalendarIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
        // Symulacja zalogowanego użytkownika (pierwszy z bazy)
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
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Czas i obecność</h1>
          <p className="text-sm text-muted-foreground mt-1">Zarządzaj swoimi godzinami pracy w czasie rzeczywistym.</p>
        </div>
        {currentEmployee && (
          <Badge variant="outline" className="h-8 px-3 py-1 text-xs font-medium border-primary/20 bg-primary/5 text-primary">
            Użytkownik: {currentEmployee.firstName} {currentEmployee.lastName}
          </Badge>
        )}
      </div>

      {/* Action Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className={cn(
          "md:col-span-2 shadow-none border-border transition-colors",
          isWorking ? "bg-emerald-50/30 border-emerald-100" : "bg-card"
        )}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className={cn("size-5", isWorking ? "text-emerald-600 animate-pulse" : "text-muted-foreground")} />
              Panel rejestracji czasu
            </CardTitle>
            <CardDescription>Użyj poniższych przycisków, aby zarejestrować rozpoczęcie lub zakończenie pracy.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row items-center gap-6 py-6">
            <div className="flex-1 text-center sm:text-left space-y-1">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Dzisiejszy status</p>
              <h3 className="text-2xl font-bold">
                {loading ? <Skeleton className="h-8 w-32" /> : (isWorking ? "W TRAKCIE PRACY" : "PRACA ZAKOŃCZONA / NIE ROZPOCZĘTA")}
              </h3>
              {todayRecord && todayRecord.events.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Ostatnie zdarzenie: <span className="font-semibold">{formatTime(todayRecord.events[todayRecord.events.length - 1].timestamp)}</span>
                </p>
              )}
            </div>
            <div className="flex gap-4">
              <Button 
                size="lg" 
                className="h-16 px-8 text-base font-bold enterprise-shadow" 
                onClick={handleClockIn}
                disabled={loading || actionLoading || !!isWorking}
              >
                <Play className="mr-2 size-5 fill-current" /> Rozpocznij pracę
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="h-16 px-8 text-base font-bold border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 transition-all" 
                onClick={handleClockOut}
                disabled={loading || actionLoading || !isWorking}
              >
                <Square className="mr-2 size-5 fill-current" /> Zakończ pracę
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none border-border bg-muted/20">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Podsumowanie dzisiaj</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-end border-b border-border pb-3">
              <span className="text-sm text-muted-foreground">Suma godzin:</span>
              <span className="text-2xl font-bold">{todayRecord?.totalHours || '0.00'}h</span>
            </div>
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-100 flex gap-3">
              <Info className="size-5 text-blue-500 shrink-0" />
              <p className="text-[11px] text-blue-700 leading-relaxed">
                Pamiętaj o zarejestrowaniu wyjścia przed opuszczeniem stanowiska pracy. System automatycznie zamyka sesje po 12h.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* History Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <History className="size-5 text-muted-foreground" />
          <h2 className="text-lg font-bold">Ostatnie 30 dni</h2>
        </div>
        
        <Card className="shadow-none border-border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-bold uppercase tracking-wider py-4 pl-6">Data</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider py-4">Wejście</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider py-4">Wyjście</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider py-4">Suma h</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider py-4">Zdarzenia</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider py-4">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6} className="py-4 px-6"><Skeleton className="h-10 w-full" /></TableCell>
                  </TableRow>
                ))
              ) : history.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-20 text-center text-sm text-muted-foreground">
                    Brak historii obecności dla tego użytkownika.
                  </TableCell>
                </TableRow>
              ) : history.map((record) => {
                const firstIn = record.events.find(e => e.type === 'in');
                const lastOut = [...record.events].reverse().find(e => e.type === 'out');
                
                return (
                  <TableRow key={record.id} className="group transition-colors border-border">
                    <TableCell className="py-3 pl-6 font-medium text-sm flex items-center gap-2">
                      <CalendarIcon className="size-3 text-muted-foreground" />
                      {record.date}
                    </TableCell>
                    <TableCell className="py-3 text-sm">{firstIn ? formatTime(firstIn.timestamp) : '--:--'}</TableCell>
                    <TableCell className="py-3 text-sm">{lastOut ? formatTime(lastOut.timestamp) : '--:--'}</TableCell>
                    <TableCell className="py-3 text-sm font-bold text-foreground">{record.totalHours}h</TableCell>
                    <TableCell className="py-3">
                      <HoverCard openDelay={200}>
                        <HoverCardTrigger asChild>
                          <div className="flex items-center gap-1 cursor-pointer text-xs text-blue-600 font-medium hover:underline">
                            <Info className="size-3" /> {record.events.length} logi
                          </div>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-80">
                          <div className="space-y-2">
                            <h4 className="text-xs font-bold uppercase tracking-widest border-b pb-2">Logi zdarzeń - {record.date}</h4>
                            <div className="max-h-40 overflow-y-auto space-y-2 pt-1">
                              {record.events.map((event, idx) => (
                                <div key={idx} className="flex justify-between items-center text-xs border-b border-border/50 pb-1">
                                  <div className="flex items-center gap-2">
                                    <Badge variant={event.type === 'in' ? "secondary" : "outline"} className="text-[9px] h-4 px-1 leading-none">
                                      {event.type.toUpperCase()}
                                    </Badge>
                                    <span className="font-medium">{formatTime(event.timestamp)}</span>
                                  </div>
                                  <span className="text-muted-foreground italic text-[10px]">{event.location}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 shadow-none">Obecny</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
