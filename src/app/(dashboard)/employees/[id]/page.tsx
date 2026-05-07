'use client';

import React, { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Mail, Building2, Calendar, Edit2, Check, X,
  Clock, Star, BookOpen, Camera, Loader2,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getEmployeeById, getEmployeeJobHistory, updateEmployee, uploadAvatar } from '@/services/db/employees';
import { getEmployeeLeaves, getLeaveBalance } from '@/services/db/leaves';
import { getEmployeeReviews } from '@/services/db/performance';
import { getEmployeeTrainings, getAvailableTrainings } from '@/services/db/trainings';
import { getDepartments } from '@/services/db/system';
import { Employee, Leave, LeaveBalance, Review, EmployeeTraining, Training, Department, JobHistory } from '@/types';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';

const STATUS_BADGE: Record<Employee['status'], string> = {
  active:   'bg-emerald-50 text-emerald-700 border border-emerald-100',
  'on-leave': 'bg-amber-50 text-amber-700 border border-amber-100',
  inactive: 'bg-muted text-muted-foreground border border-border',
};
const STATUS_LABEL: Record<Employee['status'], string> = {
  active: 'Aktywny', 'on-leave': 'Na urlopie', inactive: 'Nieaktywny',
};

const TRAINING_STATUS: Record<EmployeeTraining['status'], { label: string; cls: string }> = {
  completed: { label: 'Ukończone',  cls: 'bg-emerald-50 text-emerald-700 border border-emerald-100' },
  pending:   { label: 'Oczekujące', cls: 'bg-amber-50 text-amber-700 border border-amber-100' },
  expired:   { label: 'Wygasłe',    cls: 'bg-red-50 text-red-700 border border-red-100' },
};

const LEAVE_TYPE: Record<string, string> = {
  vacation: 'Urlop wypoczynkowy', sick: 'Zwolnienie lekarskie',
  paternity: 'Urlop rodzicielski', unpaid: 'Urlop bezpłatny',
};
const LEAVE_STATUS: Record<Leave['status'], { label: string; cls: string }> = {
  pending:      { label: 'Oczekuje',     cls: 'bg-amber-50 text-amber-700 border border-amber-100' },
  approved:     { label: 'Zatwierdzone', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-100' },
  rejected:     { label: 'Odrzucone',    cls: 'bg-red-50 text-red-700 border border-red-100' },
  auto_approved:{ label: 'Auto',         cls: 'bg-blue-50 text-blue-700 border border-blue-100' },
};

const REVIEW_CATEGORIES: Record<string, string> = {
  quality: 'Jakość pracy', communication: 'Komunikacja',
  teamwork: 'Praca zespołowa', initiative: 'Inicjatywa', reliability: 'Rzetelność',
};

export default function EmployeeProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [emp, setEmp]           = useState<Employee | null>(null);
  const [leaves, setLeaves]     = useState<Leave[]>([]);
  const [balance, setBalance]   = useState<LeaveBalance | null>(null);
  const [reviews, setReviews]   = useState<Review[]>([]);
  const [trainings, setTrainings]     = useState<EmployeeTraining[]>([]);
  const [trainingDefs, setTrainingDefs] = useState<Training[]>([]);
  const [jobHistory, setJobHistory]   = useState<JobHistory[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading]   = useState(true);

  /* avatar upload */
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  /* inline edit state */
  const [editing, setEditing]   = useState(false);
  const [editData, setEditData] = useState<Partial<Employee>>({});
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      getEmployeeById(id),
      getEmployeeLeaves(id),
      getLeaveBalance(id),
      getEmployeeReviews(id),
      getEmployeeTrainings(id),
      getAvailableTrainings(),
      getEmployeeJobHistory(id),
      getDepartments(),
    ]).then(([e, l, b, r, t, td, jh, d]) => {
      setEmp(e);
      setLeaves(l);
      setBalance(b);
      setReviews(r);
      setTrainings(t);
      setTrainingDefs(td);
      setJobHistory(jh);
      setDepartments(d);
    }).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  const startEdit = () => {
    if (!emp) return;
    setEditData({ firstName: emp.firstName, lastName: emp.lastName, email: emp.email, positionId: emp.positionId, departmentId: emp.departmentId, status: emp.status });
    setEditing(true);
  };

  const cancelEdit = () => { setEditing(false); setEditData({}); };

  const saveEdit = async () => {
    if (!emp || !id) return;
    setSaving(true);
    try {
      await updateEmployee(id, editData);
      setEmp({ ...emp, ...editData });
      setEditing(false);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id || !emp) return;
    setAvatarUploading(true);
    try {
      const url = await uploadAvatar(id, file);
      setEmp({ ...emp, avatarUrl: url });
    } catch (err) { console.error(err); }
    finally { setAvatarUploading(false); }
  };

  const deptName = (deptId: string) => departments.find(d => d.id === deptId)?.name ?? deptId;
  const trainingTitle = (tid: string) => trainingDefs.find(t => t.id === tid)?.title ?? tid;

  if (loading) return <ProfileSkeleton />;
  if (!emp) return (
    <div className="px-8 py-10 text-muted-foreground text-[13px]">Nie znaleziono pracownika.</div>
  );

  const initials = `${emp.firstName[0]}${emp.lastName[0]}`.toUpperCase();
  const vacLeft = balance ? balance.vacationTotal - balance.vacationUsed : 0;

  return (
    <div className="max-w-5xl mx-auto px-8 py-8 space-y-6">

      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={14} /> Pracownicy
      </button>

      {/* Hero card */}
      <div className="bg-card border border-border rounded-xl shadow-sm p-6 flex flex-col sm:flex-row sm:items-start gap-5">
        {/* Avatar */}
        <div className="relative shrink-0 group">
          <div
            className="size-16 rounded-2xl bg-[#e6f1ea] flex items-center justify-center overflow-hidden cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
            title="Zmień zdjęcie"
          >
            {emp.avatarUrl ? (
              <Image src={emp.avatarUrl} alt={initials} width={64} height={64} className="object-cover size-full" />
            ) : (
              <span className="text-[22px] font-semibold text-[#0a6b3e]">{initials}</span>
            )}
            {avatarUploading && (
              <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center">
                <Loader2 size={20} className="text-white animate-spin" />
              </div>
            )}
            {!avatarUploading && (
              <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={18} className="text-white" />
              </div>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="grid grid-cols-2 gap-3 mb-3">
              {(['firstName','lastName','positionId','email'] as const).map(field => (
                <div key={field}>
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide block mb-1">
                    {{ firstName:'Imię', lastName:'Nazwisko', positionId:'Stanowisko', email:'Email' }[field]}
                  </label>
                  <input
                    value={(editData[field] as string) ?? ''}
                    onChange={e => setEditData(prev => ({ ...prev, [field]: e.target.value }))}
                    className="w-full h-8 px-3 text-[13px] border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
                  />
                </div>
              ))}
              <div>
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide block mb-1">Dział</label>
                <select
                  value={editData.departmentId ?? ''}
                  onChange={e => setEditData(prev => ({ ...prev, departmentId: e.target.value }))}
                  className="w-full h-8 px-3 text-[13px] border border-border rounded-lg bg-background text-foreground focus:outline-none"
                >
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide block mb-1">Status</label>
                <select
                  value={editData.status ?? ''}
                  onChange={e => setEditData(prev => ({ ...prev, status: e.target.value as Employee['status'] }))}
                  className="w-full h-8 px-3 text-[13px] border border-border rounded-lg bg-background text-foreground focus:outline-none"
                >
                  <option value="active">Aktywny</option>
                  <option value="on-leave">Na urlopie</option>
                  <option value="inactive">Nieaktywny</option>
                </select>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h1 className="text-[22px] font-semibold text-foreground">{emp.firstName} {emp.lastName}</h1>
                <span className={cn('text-[11px] font-medium px-2.5 py-0.5 rounded-full', STATUS_BADGE[emp.status])}>
                  {STATUS_LABEL[emp.status]}
                </span>
              </div>
              <p className="text-[14px] text-muted-foreground mb-3">{emp.positionId} · {deptName(emp.departmentId)}</p>
              <div className="flex flex-wrap gap-4 text-[12px] text-muted-foreground">
                <span className="flex items-center gap-1.5"><Mail size={13} />{emp.email}</span>
                <span className="flex items-center gap-1.5"><Building2 size={13} />{deptName(emp.departmentId)}</span>
                <span className="flex items-center gap-1.5"><Calendar size={13} />od {emp.startDate}</span>
              </div>
            </>
          )}
        </div>

        {/* Edit actions */}
        <div className="flex items-center gap-2 shrink-0">
          {editing ? (
            <>
              <button onClick={cancelEdit} className="size-9 rounded-lg border border-border bg-card flex items-center justify-center text-muted-foreground hover:bg-accent transition-colors">
                <X size={15} />
              </button>
              <button onClick={saveEdit} disabled={saving} className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-[13px] font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50">
                <Check size={13} /> Zapisz
              </button>
            </>
          ) : (
            <button onClick={startEdit} className="h-9 px-4 rounded-lg border border-border bg-card text-[13px] font-medium flex items-center gap-2 hover:bg-accent transition-colors shadow-sm">
              <Edit2 size={13} /> Edytuj
            </button>
          )}
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Pozostały urlop', value: `${vacLeft} dni`, sub: `z ${balance?.vacationTotal ?? 26}`, icon: <Calendar size={15} />, color: 'text-[#0a6b3e]' },
          { label: 'Urlop chorobowy', value: `${balance?.sickUsed ?? 0} dni`, sub: 'wykorzystane', icon: <Clock size={15} />, color: 'text-amber-600' },
          { label: 'Oceny', value: reviews.length, sub: 'łącznie', icon: <Star size={15} />, color: 'text-blue-600' },
          { label: 'Szkolenia', value: trainings.filter(t=>t.status==='completed').length, sub: `z ${trainings.length}`, icon: <BookOpen size={15} />, color: 'text-purple-600' },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium text-muted-foreground">{s.label}</span>
              <span className={cn('opacity-70', s.color)}>{s.icon}</span>
            </div>
            <div className="text-[26px] font-semibold text-foreground leading-none">{s.value}</div>
            <div className="text-[11px] text-muted-foreground mt-1">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="leaves">
        <TabsList className="bg-background border border-border rounded-xl p-1 h-auto gap-1">
          {[
            { value: 'leaves',   label: 'Urlopy' },
            { value: 'reviews',  label: 'Oceny' },
            { value: 'trainings',label: 'Szkolenia' },
            { value: 'history',  label: 'Historia' },
          ].map(t => (
            <TabsTrigger key={t.value} value={t.value}
              className="text-[13px] font-medium px-4 py-2 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground"
            >
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Urlopy */}
        <TabsContent value="leaves" className="mt-4 space-y-4">
          {/* Balance bars */}
          {balance && (
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <h3 className="text-[13px] font-semibold text-foreground mb-4">Saldo urlopowe</h3>
              <div className="space-y-4">
                <BalanceBar label="Urlop wypoczynkowy" used={balance.vacationUsed} total={balance.vacationTotal} color="bg-[#0a6b3e]" />
                <BalanceBar label="Urlop chorobowy" used={balance.sickUsed} total={30} color="bg-amber-500" />
              </div>
            </div>
          )}
          {/* Leave history */}
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border/60">
              <h3 className="text-[13px] font-semibold text-foreground">Historia wniosków</h3>
            </div>
            {leaves.length === 0 ? (
              <div className="py-10 text-center text-[13px] text-muted-foreground">Brak wniosków urlopowych.</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-background/60 border-b border-border/40">
                    {['Typ','Okres','Dni','Status'].map(h => (
                      <th key={h} className="px-5 py-2.5 text-left text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leaves.map(l => {
                    let range = `${l.startDate} – ${l.endDate}`;
                    try { range = `${format(parseISO(l.startDate),'d MMM',{locale:pl})} – ${format(parseISO(l.endDate),'d MMM yyyy',{locale:pl})}`; } catch {}
                    return (
                      <tr key={l.id} className="border-b border-border/30 last:border-0 hover:bg-accent/30 transition-colors">
                        <td className="px-5 py-3 text-[13px] text-foreground">{LEAVE_TYPE[l.type] ?? l.type}</td>
                        <td className="px-5 py-3 text-[13px] text-muted-foreground">{range}</td>
                        <td className="px-5 py-3 text-[13px] text-muted-foreground">{l.daysCount}</td>
                        <td className="px-5 py-3">
                          <span className={cn('text-[11px] font-medium px-2 py-0.5 rounded-full', LEAVE_STATUS[l.status].cls)}>
                            {LEAVE_STATUS[l.status].label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </TabsContent>

        {/* Oceny */}
        <TabsContent value="reviews" className="mt-4 space-y-4">
          {reviews.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-10 text-center text-[13px] text-muted-foreground shadow-sm">
              Brak ocen rocznych.
            </div>
          ) : reviews.map(r => {
            const avg = Object.values(r.ratings).length
              ? (Object.values(r.ratings).reduce((a,b) => a+b, 0) / Object.values(r.ratings).length).toFixed(1)
              : '—';
            return (
              <div key={r.id} className="bg-card border border-border rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-[14px] font-semibold text-foreground">{r.period}</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{r.date}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-[28px] font-semibold text-foreground leading-none">{avg}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">średnia / 5</div>
                  </div>
                </div>
                <div className="space-y-2.5 mb-4">
                  {Object.entries(r.ratings).map(([key, val]) => (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[12px] text-muted-foreground">{REVIEW_CATEGORIES[key] ?? key}</span>
                        <span className="text-[12px] font-medium text-foreground">{val}/5</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-[#0a6b3e] rounded-full transition-all" style={{ width: `${(val/5)*100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                {r.comments && (
                  <p className="text-[12px] text-muted-foreground border-t border-border/60 pt-3 mt-3">{r.comments}</p>
                )}
              </div>
            );
          })}
        </TabsContent>

        {/* Szkolenia */}
        <TabsContent value="trainings" className="mt-4">
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border/60">
              <h3 className="text-[13px] font-semibold text-foreground">Szkolenia</h3>
            </div>
            {trainings.length === 0 ? (
              <div className="py-10 text-center text-[13px] text-muted-foreground">Brak przypisanych szkoleń.</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-background/60 border-b border-border/40">
                    {['Szkolenie','Ukończono','Wygasa','Status'].map(h => (
                      <th key={h} className="px-5 py-2.5 text-left text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {trainings.map(t => (
                    <tr key={t.id} className="border-b border-border/30 last:border-0 hover:bg-accent/30 transition-colors">
                      <td className="px-5 py-3 text-[13px] font-medium text-foreground">{trainingTitle(t.trainingId)}</td>
                      <td className="px-5 py-3 text-[13px] text-muted-foreground">{t.completedDate || '—'}</td>
                      <td className="px-5 py-3 text-[13px] text-muted-foreground">{t.expiryDate || '—'}</td>
                      <td className="px-5 py-3">
                        <span className={cn('text-[11px] font-medium px-2 py-0.5 rounded-full', TRAINING_STATUS[t.status].cls)}>
                          {TRAINING_STATUS[t.status].label}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </TabsContent>

        {/* Historia */}
        <TabsContent value="history" className="mt-4">
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border/60">
              <h3 className="text-[13px] font-semibold text-foreground">Historia zatrudnienia</h3>
            </div>
            {jobHistory.length === 0 ? (
              <div className="py-10 text-center text-[13px] text-muted-foreground">Brak historii zatrudnienia.</div>
            ) : (
              <div className="p-5 space-y-0">
                {jobHistory.map((jh, idx) => (
                  <div key={jh.id} className="flex gap-4">
                    {/* Timeline */}
                    <div className="flex flex-col items-center">
                      <div className="size-3 rounded-full bg-[#0a6b3e] shrink-0 mt-1" />
                      {idx < jobHistory.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                    </div>
                    <div className={cn('pb-5', idx === jobHistory.length - 1 && 'pb-0')}>
                      <p className="text-[13px] font-semibold text-foreground">{jh.position}</p>
                      <p className="text-[12px] text-muted-foreground mt-0.5">
                        {jh.startDate} – {jh.endDate ?? 'teraz'} · {jh.salary ? `${jh.salary.toLocaleString('pl')} PLN` : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function BalanceBar({ label, used, total, color }: { label: string; used: number; total: number; color: string }) {
  const pct = Math.min(100, Math.round((used / total) * 100));
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[12px] text-muted-foreground">{label}</span>
        <span className="text-[12px] font-medium text-foreground">{used} / {total} dni</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-8 py-8 space-y-6">
      <Skeleton className="h-4 w-24" />
      <div className="bg-card border border-border rounded-xl p-6 flex gap-5">
        <Skeleton className="size-16 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-3 w-80 mt-3" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}
