'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { EmploymentChart } from '@/components/features/dashboard/employment-chart';
import { DepartmentDonut } from '@/components/features/dashboard/department-donut';
import { RecentActivity } from '@/components/features/dashboard/recent-activity';
import { AnomaliesAlert } from '@/components/features/dashboard/anomalies-alert';
import { Employee, Leave } from '@/types';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  useDashboardStats,
  useDashboardEmployees,
  usePendingLeaves,
  useApproveLeaveDashboard,
  useRejectLeaveDashboard,
} from '@/hooks/use-dashboard';
import { useEmployees } from '@/hooks/use-employees';
import { useTodayAttendance, useClockIn, useClockOut } from '@/hooks/use-attendance';
import { useMyTasks } from '@/hooks/use-tasks';
import { useLeaveBalance } from '@/hooks/use-leaves';
import { useEmployeeTrainings, useTrainings } from '@/hooks/use-learning';
import { getTotalUnread } from '@/services/db/chat';
import {
  RefreshCw, UserPlus, Users, Clock, CalendarDays, TrendingUp,
  MoreHorizontal, Check, X, ArrowRight, CalendarCheck, Download,
  LogIn, LogOut, ListTodo, MessageSquare, GraduationCap, AlertTriangle,
  CheckCircle2, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO, differenceInDays } from 'date-fns';
import { pl } from 'date-fns/locale';
import { toast } from 'sonner';

// ── Helpers ───────────────────────────────────────────────────────────────────

const LEAVE_TYPE_LABELS: Record<string, string> = {
  vacation: 'Urlop wypoczynkowy',
  sick: 'Zwolnienie lekarskie',
  paternity: 'Urlop rodzicielski',
  unpaid: 'Urlop bezpłatny',
};

const STATUS_BADGE: Record<Employee['status'], string> = {
  active: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  'on-leave': 'bg-amber-50 text-amber-700 border border-amber-100',
  inactive: 'bg-muted text-muted-foreground border border-border',
};

const STATUS_LABEL: Record<Employee['status'], string> = {
  active: 'Aktywny',
  'on-leave': 'Na urlopie',
  inactive: 'Nieaktywny',
};

const SPARKS = {
  employees: 'M0,22 L15,20 L30,18 L45,14 L60,15 L75,10 L90,8 L105,6 L120,4',
  attendance: 'M0,18 L15,16 L30,14 L45,16 L60,12 L75,14 L90,10 L105,12 L120,8',
  leaves: 'M0,12 L15,16 L30,10 L45,18 L60,14 L75,20 L90,12 L105,16 L120,14',
  recruitment: 'M0,20 L15,22 L30,18 L45,20 L60,14 L75,16 L90,10 L105,12 L120,6',
};

function calcSessionHours(events: { type: string; timestamp: number }[], now: number): number {
  let total = 0;
  for (let i = 0; i < events.length; i += 2) {
    const inEv = events[i];
    const outEv = events[i + 1];
    if (inEv?.type === 'in') {
      total += (outEv?.type === 'out' ? outEv.timestamp : now) - inEv.timestamp;
    }
  }
  return total / 3_600_000;
}

function fmtHours(h: number) {
  const hh = Math.floor(h);
  const mm = Math.floor((h - hh) * 60);
  return `${hh}g ${mm.toString().padStart(2, '0')}m`;
}

// ── Personal tiles ─────────────────────────────────────────────────────────────

function AttendanceTile({ employeeId, employeeName }: { employeeId: string | undefined; employeeName: string }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  const { data: attendance, isLoading } = useTodayAttendance(employeeId);
  const clockIn = useClockIn(employeeId);
  const clockOut = useClockOut(employeeId);

  const events = attendance?.events ?? [];
  const lastIn = [...events].reverse().find(e => e.type === 'in');
  const lastOut = [...events].reverse().find(e => e.type === 'out');
  const isClockedIn = lastIn && (!lastOut || lastIn.timestamp > lastOut.timestamp);
  const hours = calcSessionHours(events, now);

  const handleClock = async () => {
    if (!employeeId) return;
    try {
      if (isClockedIn) {
        await clockOut.mutateAsync({ recordId: attendance!.id, events });
        toast.success('Zakończono czas pracy');
      } else {
        await clockIn.mutateAsync({ name: employeeName });
        toast.success('Rozpoczęto czas pracy');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error('Błąd', { description: msg });
    }
  };

  const pending = clockIn.isPending || clockOut.isPending;

  return (
    <div className={cn(
      'rounded-2xl border p-5 flex flex-col gap-3 transition-all',
      isClockedIn
        ? 'bg-emerald-50 border-emerald-200'
        : 'bg-card border-border',
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn('size-8 rounded-xl flex items-center justify-center', isClockedIn ? 'bg-emerald-100' : 'bg-muted')}>
            <Clock size={16} className={isClockedIn ? 'text-emerald-700' : 'text-muted-foreground'} />
          </div>
          <span className="text-[13px] font-medium text-foreground">Czas pracy</span>
        </div>
        {isClockedIn && (
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> Na miejscu
          </span>
        )}
      </div>

      {isLoading ? (
        <Skeleton className="h-8 w-24" />
      ) : (
        <div>
          <p className="text-3xl font-bold tracking-tight text-foreground">{fmtHours(hours)}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">dziś</p>
        </div>
      )}

      <button
        onClick={handleClock}
        disabled={pending || !employeeId}
        className={cn(
          'w-full h-9 rounded-xl text-[13px] font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50',
          isClockedIn
            ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
            : 'bg-primary text-primary-foreground hover:bg-primary/90',
        )}
      >
        {isClockedIn
          ? <><LogOut size={14} /> Zakończ pracę</>
          : <><LogIn size={14} /> Rozpocznij pracę</>}
      </button>
    </div>
  );
}

function TasksTile({ email }: { email: string | null }) {
  const { data: tasks = [], isLoading } = useMyTasks(email);
  const pending = tasks.filter(t => t.status !== 'done');
  const overdue = pending.filter(t => t.dueDate < new Date().toISOString().split('T')[0]);

  return (
    <div
      className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-3 cursor-pointer hover:border-primary/30 transition-all"
      onClick={() => { window.location.href = '/tasks'; }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-xl bg-blue-50 flex items-center justify-center">
            <ListTodo size={16} className="text-blue-600" />
          </div>
          <span className="text-[13px] font-medium text-foreground">Zadania</span>
        </div>
        <ChevronRight size={14} className="text-muted-foreground" />
      </div>

      {isLoading ? <Skeleton className="h-8 w-16" /> : (
        <div>
          <p className="text-3xl font-bold tracking-tight text-foreground">{pending.length}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">do wykonania</p>
        </div>
      )}

      {overdue.length > 0 && (
        <div className="flex items-center gap-1.5 text-[11px] text-red-600 font-medium bg-red-50 border border-red-100 rounded-lg px-2.5 py-1.5">
          <AlertTriangle size={11} /> {overdue.length} przeterminowanych
        </div>
      )}
      {!isLoading && overdue.length === 0 && pending.length > 0 && (
        <p className="text-[11px] text-muted-foreground">Żadne nie jest przeterminowane</p>
      )}
      {!isLoading && pending.length === 0 && (
        <div className="flex items-center gap-1.5 text-[11px] text-emerald-600">
          <CheckCircle2 size={11} /> Wszystko wykonane!
        </div>
      )}
    </div>
  );
}

function LeavesTile({ employeeId }: { employeeId: string | undefined }) {
  const { data: balance, isLoading } = useLeaveBalance(employeeId);
  const remaining = (balance?.vacationTotal ?? 0) - (balance?.vacationUsed ?? 0);

  return (
    <div
      className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-3 cursor-pointer hover:border-primary/30 transition-all"
      onClick={() => { window.location.href = '/leaves'; }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-xl bg-amber-50 flex items-center justify-center">
            <CalendarDays size={16} className="text-amber-600" />
          </div>
          <span className="text-[13px] font-medium text-foreground">Urlopy</span>
        </div>
        <ChevronRight size={14} className="text-muted-foreground" />
      </div>

      {isLoading ? <Skeleton className="h-8 w-16" /> : (
        <div>
          <p className="text-3xl font-bold tracking-tight text-foreground">{remaining}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">dni pozostało</p>
        </div>
      )}

      <p className="text-[11px] text-muted-foreground">
        Kliknij aby złożyć wniosek urlopowy
      </p>
    </div>
  );
}

function TrainingsTile({ employeeId }: { employeeId: string | undefined }) {
  const { data: myTrainings = [], isLoading: myLoad } = useEmployeeTrainings(employeeId);
  const { data: allTrainings = [], isLoading: allLoad } = useTrainings();

  const loading = myLoad || allLoad;

  const expiringSoon = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const in30 = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0];
    return myTrainings.filter(t => t.expiryDate >= today && t.expiryDate <= in30);
  }, [myTrainings]);

  const nextTraining = useMemo(() => {
    if (myTrainings.length === 0) return null;
    return [...myTrainings].sort((a, b) => a.expiryDate.localeCompare(b.expiryDate))[0];
  }, [myTrainings]);

  const nextTrainingName = nextTraining
    ? allTrainings.find(t => t.id === nextTraining.trainingId)?.title ?? 'Szkolenie'
    : null;

  return (
    <div
      className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-3 cursor-pointer hover:border-primary/30 transition-all"
      onClick={() => { window.location.href = '/learning'; }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-xl bg-violet-50 flex items-center justify-center">
            <GraduationCap size={16} className="text-violet-600" />
          </div>
          <span className="text-[13px] font-medium text-foreground">Szkolenia</span>
        </div>
        <ChevronRight size={14} className="text-muted-foreground" />
      </div>

      {loading ? <Skeleton className="h-8 w-24" /> : (
        <div>
          <p className="text-3xl font-bold tracking-tight text-foreground">{myTrainings.length}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">ukończonych</p>
        </div>
      )}

      {!loading && expiringSoon.length > 0 && (
        <div className="flex items-center gap-1.5 text-[11px] text-amber-600 font-medium bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5">
          <AlertTriangle size={11} /> {expiringSoon.length} wygasa w ciągu 30 dni
        </div>
      )}
      {!loading && nextTrainingName && expiringSoon.length === 0 && (
        <p className="text-[11px] text-muted-foreground line-clamp-1">{nextTrainingName}</p>
      )}
      {!loading && myTrainings.length === 0 && (
        <p className="text-[11px] text-muted-foreground">Brak ukończonych szkoleń</p>
      )}
    </div>
  );
}

function MessagesTile({ uid }: { uid: string }) {
  const { data: unread = 0, isLoading } = useQuery({
    queryKey: ['unread-messages', uid],
    queryFn: () => getTotalUnread(uid),
    refetchInterval: 30_000,
  });

  return (
    <div
      className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-3 cursor-pointer hover:border-primary/30 transition-all"
      onClick={() => { window.location.href = '/dashboard'; }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn('size-8 rounded-xl flex items-center justify-center', unread > 0 ? 'bg-blue-50' : 'bg-muted')}>
            <MessageSquare size={16} className={unread > 0 ? 'text-blue-600' : 'text-muted-foreground'} />
          </div>
          <span className="text-[13px] font-medium text-foreground">Wiadomości</span>
        </div>
        {unread > 0 && (
          <span className="text-[10px] font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
            {unread}
          </span>
        )}
      </div>

      {isLoading ? <Skeleton className="h-8 w-12" /> : (
        <div>
          <p className="text-3xl font-bold tracking-tight text-foreground">{unread}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">nieprzeczytanych</p>
        </div>
      )}

      <p className="text-[11px] text-muted-foreground">
        {unread > 0 ? 'Masz nowe wiadomości — kliknij ikonę czatu' : 'Brak nowych wiadomości'}
      </p>
    </div>
  );
}

// ── Personal section (all roles) ──────────────────────────────────────────────

function PersonalSection({ canManage }: { canManage: boolean }) {
  const { user } = useAuth();
  const { data: employees = [] } = useEmployees();
  const myEmployee = useMemo(
    () => employees.find(e => e.email === user?.email),
    [employees, user?.email],
  );
  const fullName = user?.displayName ?? user?.email ?? '';

  return (
    <div className={cn('grid gap-4', canManage ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3')}>
      <AttendanceTile employeeId={myEmployee?.id} employeeName={fullName} />
      <TasksTile email={user?.email ?? null} />
      <LeavesTile employeeId={myEmployee?.id} />
      <TrainingsTile employeeId={myEmployee?.id} />
      {user?.uid && <MessagesTile uid={user.uid} />}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth();
  const canManage = user?.role === 'manager' || user?.role === 'hr' || user?.role === 'admin';

  const { data: stats, isLoading: loading, refetch: refetchStats } = useDashboardStats();
  const { data: employees = [], isLoading: empLoading, refetch: refetchEmployees } = useDashboardEmployees();
  const { data: pendingLeaves = [], isLoading: leavesLoading, refetch: refetchLeaves } = usePendingLeaves();
  const approveMutation = useApproveLeaveDashboard();
  const rejectMutation = useRejectLeaveDashboard();

  const handleApprove = (leaveId: string) => {
    if (!user?.uid) return;
    approveMutation.mutate({ leaveId, approverId: user.uid });
  };
  const handleReject = (leaveId: string) => {
    if (!user?.uid) return;
    rejectMutation.mutate({ leaveId, approverId: user.uid });
  };

  const firstName = user?.displayName?.split(' ')[0] ?? 'Użytkowniku';
  const today = format(new Date(), "EEEE, d MMMM", { locale: pl });

  return (
    <div className="max-w-[1440px] mx-auto px-8 py-8 space-y-6 pb-12">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-[36px] font-semibold text-foreground leading-none tracking-tight">
            Dzień dobry, {firstName}.
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[13px] text-muted-foreground capitalize">{today}</span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-medium border border-emerald-100">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          </div>
        </div>
        {canManage && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => { refetchStats(); refetchEmployees(); refetchLeaves(); }}
              disabled={loading}
              className="h-9 px-3.5 rounded-lg border border-border bg-card text-foreground/70 hover:bg-accent text-[13px] font-medium flex items-center gap-2 transition-colors disabled:opacity-50 shadow-sm"
            >
              <RefreshCw size={13} className={cn(loading && 'animate-spin')} />
              Odśwież
            </button>
            <button
              onClick={() => { window.location.href = '/employees'; }}
              className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-[13px] font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors"
            >
              <UserPlus size={14} strokeWidth={2} />
              Nowy pracownik
            </button>
          </div>
        )}
      </div>

      {/* Personal quick-action tiles — all roles */}
      <section>
        <h2 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">Mój dzień</h2>
        <PersonalSection canManage={canManage} />
      </section>

      {/* Management section — manager+ only */}
      {canManage && (
        <>
          {/* Alerts */}
          {stats?.anomalies && stats.anomalies.length > 0 && (
            <AnomaliesAlert anomalies={stats.anomalies} />
          )}

          {/* KPI Cards */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Zatrudnionych" value={stats?.totalEmployees ?? 0}
              icon={<Users size={15} strokeWidth={1.7} />} iconVariant="green"
              sparkPath={SPARKS.employees} sparkColor="#0a6b3e"
              delta={{ text: '+4.2%', good: true, vs: 'vs kw. poprz.' }} loading={loading} />
            <KpiCard label="Obecność dzisiaj" value={stats?.presentToday ?? 0}
              icon={<Clock size={15} strokeWidth={1.7} />} iconVariant="default"
              sparkPath={SPARKS.attendance} sparkColor="#2a2d33"
              delta={{ text: 'Cel: 90%', good: true, vs: '' }} loading={loading} />
            <KpiCard label="Wnioski urlopowe" value={stats?.pendingLeaves ?? 0}
              icon={<CalendarDays size={15} strokeWidth={1.7} />} iconVariant="warn"
              sparkPath={SPARKS.leaves} sparkColor="#b65a1f"
              delta={{ text: 'Oczekują', good: false, vs: 'na decyzję' }} loading={loading} />
            <KpiCard label="Aktywne rekrutacje" value={stats?.activeRecruitments ?? 0}
              icon={<TrendingUp size={15} strokeWidth={1.7} />} iconVariant="info"
              sparkPath={SPARKS.recruitment} sparkColor="#2b5597"
              delta={{ text: '+12', good: true, vs: 'vs kw. poprz.' }} loading={loading} />
          </section>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-8 bg-card border border-border shadow-sm rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-border/60 flex items-center justify-between">
                <div>
                  <h3 className="text-[15px] font-semibold text-foreground">Trend zatrudnienia</h3>
                  <p className="text-[12px] text-muted-foreground mt-0.5">Łączne zatrudnienie — ostatnie 12 miesięcy</p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className="size-2 rounded-sm bg-[#0a6b3e]" /> Rzeczywiste
                </span>
              </div>
              <div className="p-6">
                <div className="h-[230px]"><EmploymentChart /></div>
              </div>
            </div>
            <div className="lg:col-span-4 bg-card border border-border shadow-sm rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-border/60">
                <h3 className="text-[15px] font-semibold text-foreground">Struktura działów</h3>
                <p className="text-[12px] text-muted-foreground mt-0.5">{stats?.totalEmployees ?? '—'} osób · 6 działów</p>
              </div>
              <div className="p-6 flex items-center justify-center">
                <DepartmentDonut total={stats?.totalEmployees} />
              </div>
            </div>
          </div>

          {/* Employee table + Pending leaves */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-8 bg-card border border-border shadow-sm rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-border/60 flex items-center justify-between">
                <div>
                  <h3 className="text-[15px] font-semibold text-foreground">Pracownicy</h3>
                  <p className="text-[12px] text-muted-foreground mt-0.5">Ostatnio aktywni</p>
                </div>
                <button
                  onClick={() => { window.location.href = '/employees'; }}
                  className="flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Zobacz wszystkich <ArrowRight size={12} />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-background/60 border-b border-border/40">
                      <th className="px-6 py-2.5 text-left text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Pracownik</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-medium text-muted-foreground uppercase tracking-wide hidden md:table-cell">Stanowisko</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-medium text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Dział</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Status</th>
                      <th className="px-4 py-2.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {empLoading ? (
                      [1,2,3,4,5].map(i => (
                        <tr key={i} className="border-b border-border/30 last:border-0">
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-3">
                              <Skeleton className="size-8 rounded-full shrink-0" />
                              <div><Skeleton className="h-3 w-28 mb-1.5" /><Skeleton className="h-2.5 w-36" /></div>
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell"><Skeleton className="h-3 w-24" /></td>
                          <td className="px-4 py-3 hidden lg:table-cell"><Skeleton className="h-3 w-20" /></td>
                          <td className="px-4 py-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
                          <td className="px-4 py-3"><Skeleton className="h-6 w-6 rounded-md" /></td>
                        </tr>
                      ))
                    ) : employees.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-[13px] text-muted-foreground">
                          Brak pracowników w bazie danych.
                        </td>
                      </tr>
                    ) : employees.map(emp => {
                      const initials = `${emp.firstName[0]}${emp.lastName[0]}`.toUpperCase();
                      return (
                        <tr key={emp.id}
                          onClick={() => { window.location.href = `/employees/detail?id=${emp.id}`; }}
                          className="border-b border-border/30 last:border-0 hover:bg-accent/40 transition-colors group cursor-pointer">
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-3">
                              <div className="size-[30px] rounded-full bg-[#e6f1ea] flex items-center justify-center shrink-0">
                                <span className="text-[10px] font-semibold text-[#0a6b3e]">{initials}</span>
                              </div>
                              <div>
                                <p className="text-[13px] font-medium text-foreground">{emp.firstName} {emp.lastName}</p>
                                <p className="text-[11px] text-muted-foreground">{emp.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell"><span className="text-[12px] text-foreground/70">{emp.positionId}</span></td>
                          <td className="px-4 py-3 hidden lg:table-cell"><span className="text-[12px] text-foreground/70">{emp.departmentId}</span></td>
                          <td className="px-4 py-3">
                            <span className={cn('text-[11px] font-medium px-2 py-0.5 rounded-full', STATUS_BADGE[emp.status])}>
                              {STATUS_LABEL[emp.status]}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button className="size-7 rounded-md flex items-center justify-center text-muted-foreground/40 hover:text-foreground/80 hover:bg-muted transition-colors opacity-0 group-hover:opacity-100 border border-border">
                              <MoreHorizontal size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pending leaves */}
            <div className="lg:col-span-4 bg-card border border-border shadow-sm rounded-xl overflow-hidden flex flex-col">
              <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-[15px] font-semibold text-foreground">Wnioski urlopowe</h3>
                  <p className="text-[12px] text-muted-foreground mt-0.5">Oczekują na akceptację</p>
                </div>
                {pendingLeaves.length > 0 && (
                  <span className="text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-full">
                    {pendingLeaves.length}
                  </span>
                )}
              </div>
              <div className="flex-1 overflow-y-auto no-scrollbar">
                {leavesLoading ? (
                  <div className="divide-y divide-border/30">
                    {[1,2,3].map(i => (
                      <div key={i} className="p-5 space-y-3">
                        <Skeleton className="h-3 w-32" />
                        <Skeleton className="h-2.5 w-48" />
                        <div className="flex gap-2"><Skeleton className="h-7 w-20 rounded-lg" /><Skeleton className="h-7 w-20 rounded-lg" /></div>
                      </div>
                    ))}
                  </div>
                ) : pendingLeaves.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-12 space-y-3">
                    <div className="size-12 rounded-xl bg-muted flex items-center justify-center">
                      <CalendarCheck size={18} className="text-muted-foreground" />
                    </div>
                    <div className="text-center">
                      <p className="text-[12px] font-medium text-foreground/70">Brak wniosków</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Wszystko rozpatrzone.</p>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-border/30">
                    {pendingLeaves.map(leave => {
                      const processing = approveMutation.isPending || rejectMutation.isPending;
                      let rangeLabel = '';
                      try {
                        rangeLabel = `${format(parseISO(leave.startDate), 'd MMM', { locale: pl })} – ${format(parseISO(leave.endDate), 'd MMM yyyy', { locale: pl })}`;
                      } catch {
                        rangeLabel = `${leave.startDate} – ${leave.endDate}`;
                      }
                      return (
                        <div key={leave.id} className="p-5">
                          <p className="text-[13px] font-medium text-foreground">{leave.employeeName || 'Pracownik'}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {LEAVE_TYPE_LABELS[leave.type] || leave.type} · {rangeLabel}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {leave.daysCount} {leave.daysCount === 1 ? 'dzień' : 'dni'}
                          </p>
                          <div className="flex items-center gap-2 mt-3">
                            <button onClick={() => handleApprove(leave.id)} disabled={processing}
                              className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 text-[12px] font-medium hover:bg-emerald-100 transition-colors disabled:opacity-50">
                              <Check size={11} strokeWidth={2.5} /> Zatwierdź
                            </button>
                            <button onClick={() => handleReject(leave.id)} disabled={processing}
                              className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-muted border border-border text-foreground/70 text-[12px] font-medium hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-colors disabled:opacity-50">
                              <X size={11} strokeWidth={2.5} /> Odrzuć
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent activity */}
          <div className="bg-card border border-border shadow-sm rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border/60 flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-foreground">Ostatnia aktywność</h3>
              <div className="flex items-center gap-1.5">
                <span className="size-1.5 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Live</span>
              </div>
            </div>
            <div className="p-4 no-scrollbar">
              <RecentActivity activities={stats?.recentActivity} loading={loading} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({ label, value, icon, iconVariant, sparkPath, sparkColor, delta, loading }: {
  label: string; value: number | string;
  icon: React.ReactNode; iconVariant: 'green' | 'warn' | 'info' | 'default';
  sparkPath: string; sparkColor: string;
  delta: { text: string; good: boolean; vs: string };
  loading?: boolean;
}) {
  const iconBg = {
    green: 'bg-[#e6f1ea] text-[#0a6b3e]',
    warn: 'bg-amber-50 text-amber-600',
    info: 'bg-blue-50 text-blue-600',
    default: 'bg-muted text-muted-foreground border border-border',
  }[iconVariant];

  const areaPath = sparkPath + ` L120,28 L0,28 Z`;

  return (
    <div className="bg-card border border-border shadow-sm rounded-xl p-5 hover:-translate-y-px hover:shadow transition-all duration-200">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[12px] font-medium text-muted-foreground">{label}</span>
        <div className={cn('size-8 rounded-lg flex items-center justify-center shrink-0', iconBg)}>{icon}</div>
      </div>
      {loading ? <Skeleton className="h-10 w-16 rounded-lg mb-3" /> : (
        <div className="text-[40px] font-semibold tracking-tight leading-none text-foreground mb-3">{value}</div>
      )}
      {!loading && (
        <svg className="w-full" height="28" viewBox="0 0 120 28" preserveAspectRatio="none">
          <path d={sparkPath} fill="none" stroke={sparkColor} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d={areaPath} fill={sparkColor} opacity="0.08" />
        </svg>
      )}
      {!loading && (
        <div className="flex items-center justify-between mt-3">
          <span className={cn('inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full',
            delta.good ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700')}>
            {delta.text}
          </span>
          {delta.vs && <span className="text-[11px] text-muted-foreground">{delta.vs}</span>}
        </div>
      )}
    </div>
  );
}
