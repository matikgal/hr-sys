'use client';

import React, { useState, useEffect } from 'react';
import { EmploymentChart } from '@/components/features/dashboard/employment-chart';
import { DepartmentDonut } from '@/components/features/dashboard/department-donut';
import { RecentActivity } from '@/components/features/dashboard/recent-activity';
import { AnomaliesAlert } from '@/components/features/dashboard/anomalies-alert';
import { getDashboardStats, DashboardStats } from '@/services/db/system';
import { getAllEmployees } from '@/services/db/employees';
import { getPendingLeaves, approveLeave, rejectLeave } from '@/services/db/leaves';
import { Employee, Leave } from '@/types';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import {
  RefreshCw,
  UserPlus,
  Users,
  Clock,
  CalendarDays,
  TrendingUp,
  MoreHorizontal,
  Check,
  X,
  ArrowRight,
  CalendarCheck,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';

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

/* Sparkline paths — static decorative data */
const SPARKS = {
  employees: 'M0,22 L15,20 L30,18 L45,14 L60,15 L75,10 L90,8 L105,6 L120,4',
  attendance: 'M0,18 L15,16 L30,14 L45,16 L60,12 L75,14 L90,10 L105,12 L120,8',
  leaves: 'M0,12 L15,16 L30,10 L45,18 L60,14 L75,20 L90,12 L105,16 L120,14',
  recruitment: 'M0,20 L15,22 L30,18 L45,20 L60,14 L75,16 L90,10 L105,12 L120,6',
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [empLoading, setEmpLoading] = useState(true);
  const [leavesLoading, setLeavesLoading] = useState(true);
  const [leavesProcessing, setLeavesProcessing] = useState<Set<string>>(new Set());

  const fetchStats = async () => {
    setLoading(true);
    try { setStats(await getDashboardStats()); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchEmployees = async () => {
    setEmpLoading(true);
    try { setEmployees(await getAllEmployees({ limit: 8 })); }
    catch (err) { console.error(err); }
    finally { setEmpLoading(false); }
  };

  const fetchPendingLeaves = async () => {
    setLeavesLoading(true);
    try { setPendingLeaves(await getPendingLeaves(5)); }
    catch (err) { console.error(err); }
    finally { setLeavesLoading(false); }
  };

  useEffect(() => {
    fetchStats();
    fetchEmployees();
    fetchPendingLeaves();
  }, []);

  const handleApprove = async (leaveId: string) => {
    if (!user?.uid) return;
    setLeavesProcessing(prev => new Set(prev).add(leaveId));
    try {
      await approveLeave(leaveId, user.uid);
      setPendingLeaves(prev => prev.filter(l => l.id !== leaveId));
    } catch (err) { console.error(err); }
    finally { setLeavesProcessing(prev => { const n = new Set(prev); n.delete(leaveId); return n; }); }
  };

  const handleReject = async (leaveId: string) => {
    if (!user?.uid) return;
    setLeavesProcessing(prev => new Set(prev).add(leaveId));
    try {
      await rejectLeave(leaveId, user.uid);
      setPendingLeaves(prev => prev.filter(l => l.id !== leaveId));
    } catch (err) { console.error(err); }
    finally { setLeavesProcessing(prev => { const n = new Set(prev); n.delete(leaveId); return n; }); }
  };

  const firstName = user?.displayName?.split(' ')[0] ?? 'Adminze';
  const today = format(new Date(), "EEEE, d MMMM", { locale: pl });

  return (
    <div className="max-w-[1440px] mx-auto px-8 py-8 space-y-6 pb-12">

      {/* Page heading */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-[38px] font-semibold text-foreground leading-none tracking-tight">
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
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => { fetchStats(); fetchEmployees(); fetchPendingLeaves(); }}
            disabled={loading}
            className="h-9 px-3.5 rounded-lg border border-border bg-card text-foreground/70 hover:bg-accent text-[13px] font-medium flex items-center gap-2 transition-colors disabled:opacity-50 shadow-sm"
          >
            <RefreshCw size={13} className={cn(loading && "animate-spin")} />
            Odśwież
          </button>
          <button className="h-9 px-3.5 rounded-lg border border-border bg-card text-foreground/70 hover:bg-accent text-[13px] font-medium flex items-center gap-2 transition-colors shadow-sm">
            <Download size={13} />
            Eksport
          </button>
          <button className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-[13px] font-medium flex items-center gap-2 hover:bg-primary/90 active:bg-primary transition-colors">
            <UserPlus size={14} strokeWidth={2} />
            Nowy pracownik
          </button>
        </div>
      </div>

      {/* Alerts */}
      {stats?.anomalies && stats.anomalies.length > 0 && (
        <AnomaliesAlert anomalies={stats.anomalies} />
      )}

      {/* KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Zatrudnionych"
          value={stats?.totalEmployees ?? 0}
          icon={<Users size={15} strokeWidth={1.7} />}
          iconVariant="green"
          sparkPath={SPARKS.employees}
          sparkColor="#0a6b3e"
          delta={{ text: '+4.2%', good: true, vs: 'vs kw. poprz.' }}
          loading={loading}
        />
        <KpiCard
          label="Obecność dzisiaj"
          value={stats?.presentToday ?? 0}
          icon={<Clock size={15} strokeWidth={1.7} />}
          iconVariant="default"
          sparkPath={SPARKS.attendance}
          sparkColor="#2a2d33"
          delta={{ text: 'Cel: 90%', good: true, vs: '' }}
          loading={loading}
        />
        <KpiCard
          label="Wnioski urlopowe"
          value={stats?.pendingLeaves ?? 0}
          icon={<CalendarDays size={15} strokeWidth={1.7} />}
          iconVariant="warn"
          sparkPath={SPARKS.leaves}
          sparkColor="#b65a1f"
          delta={{ text: 'Oczekują', good: false, vs: 'na decyzję' }}
          loading={loading}
        />
        <KpiCard
          label="Aktywne rekrutacje"
          value={stats?.activeRecruitments ?? 0}
          icon={<TrendingUp size={15} strokeWidth={1.7} />}
          iconVariant="info"
          sparkPath={SPARKS.recruitment}
          sparkColor="#2b5597"
          delta={{ text: '+12', good: true, vs: 'vs kw. poprz.' }}
          loading={loading}
        />
      </section>

      {/* Charts row — Employment trend + Department donut */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* Employment trend */}
        <div className="lg:col-span-8 bg-card border border-border shadow-sm rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border/60 flex items-center justify-between">
            <div>
              <h3 className="text-[15px] font-semibold text-foreground">Trend zatrudnienia</h3>
              <p className="text-[12px] text-muted-foreground mt-0.5">Łączne zatrudnienie — ostatnie 12 miesięcy</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="size-2 rounded-sm bg-[#0a6b3e]" />
                Rzeczywiste
              </span>
            </div>
          </div>
          <div className="p-6">
            <div className="h-[230px]">
              <EmploymentChart />
            </div>
          </div>
        </div>

        {/* Department donut */}
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

      {/* Middle row — Employee table + Pending leaves */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* Employee table */}
        <div className="lg:col-span-8 bg-card border border-border shadow-sm rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border/60 flex items-center justify-between">
            <div>
              <h3 className="text-[15px] font-semibold text-foreground">Pracownicy</h3>
              <p className="text-[12px] text-muted-foreground mt-0.5">Ostatnio aktywni</p>
            </div>
            <button className="flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors">
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
                  [1, 2, 3, 4, 5, 6].map(i => (
                    <tr key={i} className="border-b border-border/30 last:border-0">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <Skeleton className="size-8 rounded-full shrink-0" />
                          <div>
                            <Skeleton className="h-3 w-28 mb-1.5" />
                            <Skeleton className="h-2.5 w-36" />
                          </div>
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
                ) : (
                  employees.map(emp => {
                    const initials = `${emp.firstName[0]}${emp.lastName[0]}`.toUpperCase();
                    return (
                      <tr key={emp.id} className="border-b border-border/30 last:border-0 hover:bg-accent/40 transition-colors group">
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
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-[12px] text-foreground/70">{emp.positionId}</span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <span className="text-[12px] text-foreground/70">{emp.departmentId}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full", STATUS_BADGE[emp.status])}>
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
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending leave requests */}
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
                {[1, 2, 3].map(i => (
                  <div key={i} className="p-5 space-y-3">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-2.5 w-48" />
                    <div className="flex gap-2">
                      <Skeleton className="h-7 w-20 rounded-lg" />
                      <Skeleton className="h-7 w-20 rounded-lg" />
                    </div>
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
                  const processing = leavesProcessing.has(leave.id);
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
                      <p className="text-[10px] text-muted-foreground mt-0.5">{leave.daysCount} {leave.daysCount === 1 ? 'dzień' : 'dni'}</p>
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={() => handleApprove(leave.id)}
                          disabled={processing}
                          className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 text-[12px] font-medium hover:bg-emerald-100 transition-colors disabled:opacity-50"
                        >
                          <Check size={11} strokeWidth={2.5} />
                          Zatwierdź
                        </button>
                        <button
                          onClick={() => handleReject(leave.id)}
                          disabled={processing}
                          className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-muted border border-border text-foreground/70 text-[12px] font-medium hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-colors disabled:opacity-50"
                        >
                          <X size={11} strokeWidth={2.5} />
                          Odrzuć
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
    </div>
  );
}

function KpiCard({
  label, value, icon, iconVariant, sparkPath, sparkColor, delta, loading,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  iconVariant: 'green' | 'warn' | 'info' | 'default';
  sparkPath: string;
  sparkColor: string;
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
        <div className={cn("size-8 rounded-lg flex items-center justify-center shrink-0", iconBg)}>
          {icon}
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-10 w-16 rounded-lg mb-3" />
      ) : (
        <div className="text-[40px] font-semibold tracking-tight leading-none text-foreground mb-3">
          {value}
        </div>
      )}

      {/* Sparkline */}
      {!loading && (
        <svg className="w-full" height="28" viewBox="0 0 120 28" preserveAspectRatio="none">
          <path d={sparkPath} fill="none" stroke={sparkColor} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d={areaPath} fill={sparkColor} opacity="0.08" />
        </svg>
      )}

      {/* Delta */}
      {!loading && (
        <div className="flex items-center justify-between mt-3">
          <span className={cn(
            "inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full",
            delta.good ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
          )}>
            {delta.text}
          </span>
          {delta.vs && <span className="text-[11px] text-muted-foreground">{delta.vs}</span>}
        </div>
      )}
    </div>
  );
}
