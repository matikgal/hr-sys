'use client';

import React, { useState, useRef, useMemo } from 'react';
import { toast } from 'sonner';
import {
  Users, Briefcase, Plus, Search, MoreVertical, UserCheck, Columns2,
  CheckCircle2, Clock, ArrowRight, FileText, Download, Upload,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Candidate, Job } from '@/types';
import {
  useJobs, useCandidates, useRecruitmentDepartments,
  useUpdateCandidateStage, useHireCandidate, useCreateJob, useUpdateCandidateNotes,
  useApplyForJob, useMyApplications,
} from '@/hooks/use-recruitment';
import { useAuth } from '@/context/auth-context';
import { uploadCV } from '@/services/storage/cv';
import { cn } from '@/lib/utils';

const STAGES: { id: Candidate['stage']; label: string; badgeLabel: string; accent: string; color: string }[] = [
  { id: 'applied',   label: 'Nowi',        badgeLabel: 'Aplikacja wysłana', accent: 'border-t-blue-400',    color: 'bg-blue-50 text-blue-700 border-blue-100' },
  { id: 'screening', label: 'Screening',   badgeLabel: 'Weryfikacja',       accent: 'border-t-violet-400',  color: 'bg-violet-50 text-violet-700 border-violet-100' },
  { id: 'interview', label: 'Wywiad',      badgeLabel: 'Wywiad',            accent: 'border-t-amber-400',   color: 'bg-amber-50 text-amber-700 border-amber-100' },
  { id: 'offer',     label: 'Oferta',      badgeLabel: 'Oferta',            accent: 'border-t-emerald-400', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  { id: 'hired',     label: 'Zatrudnieni', badgeLabel: 'Zatrudniony',       accent: 'border-t-green-500',   color: 'bg-green-50 text-green-700 border-green-100' },
  { id: 'rejected',  label: 'Odrzuceni',   badgeLabel: 'Odrzucona',         accent: 'border-t-red-400',     color: 'bg-red-50 text-red-700 border-red-100' },
];

const STAGE_LABELS = Object.fromEntries(STAGES.map(s => [s.id, s.badgeLabel])) as Record<Candidate['stage'], string>;
const STAGE_COLORS = Object.fromEntries(STAGES.map(s => [s.id, s.color])) as Record<Candidate['stage'], string>;

// ─── Employee Job Board ────────────────────────────────────────────────────────

function JobBoard() {
  const { user } = useAuth();
  const { data: jobs = [], isLoading: jobsLoading } = useJobs();
  const { data: departments = [] } = useRecruitmentDepartments();
  const { data: myApplications = [], isLoading: appsLoading } = useMyApplications(user?.email);
  const applyMutation = useApplyForJob();

  const [applyJob, setApplyJob] = useState<Job | null>(null);
  const [phone, setPhone] = useState('');
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const deptMap = useMemo(() => new Map(departments.map(d => [d.id, d.name])), [departments]);
  const appliedJobIds = useMemo(
    () => new Set(myApplications.filter(a => a.stage !== 'rejected').map(a => a.jobId)),
    [myApplications],
  );

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyJob || !user?.email) return;
    setUploading(true);
    try {
      let cvUrl: string | undefined;
      if (cvFile) {
        cvUrl = await uploadCV(cvFile, user.email);
      }
      const nameParts = (user.displayName ?? user.email).split(' ');
      await applyMutation.mutateAsync({
        jobId: applyJob.id,
        firstName: nameParts[0] ?? '',
        lastName: nameParts.slice(1).join(' ') ?? '',
        email: user.email,
        phone,
        ...(cvUrl ? { cvUrl } : {}),
        stage: 'applied',
        score: 0,
      } as Omit<Candidate, 'id'>);
      toast.success('Aplikacja wysłana!', { description: `Aplikowałeś na stanowisko: ${applyJob.title}` });
      setApplyJob(null);
      setPhone('');
      setCvFile(null);
    } catch (err: unknown) {
      console.error('[apply]', err);
      const msg = err instanceof Error ? err.message : String(err);
      toast.error('Błąd podczas wysyłania aplikacji.', { description: msg });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Open jobs */}
      <div>
        <h2 className="text-base font-semibold mb-4">Otwarte oferty pracy</h2>
        {jobsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-44 w-full" />)}
          </div>
        ) : jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
            <Briefcase size={32} className="opacity-40" />
            <p className="text-sm">Brak aktywnych ofert pracy.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map(job => {
              const applied = appliedJobIds.has(job.id);
              return (
                <Card key={job.id} className="shadow-none border-border hover:border-primary/30 transition-all flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="bg-primary/5 p-2 rounded-lg">
                        <Briefcase className="text-primary" size={18} />
                      </div>
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 shadow-none text-[10px]">
                        Aktywne
                      </Badge>
                    </div>
                    <CardTitle className="text-base leading-snug">{job.title}</CardTitle>
                    <CardDescription className="text-xs">{deptMap.get(job.departmentId) ?? job.departmentId}</CardDescription>
                    {job.salaryRange && (
                      <p className="text-xs font-medium text-foreground/70 mt-1">{job.salaryRange}</p>
                    )}
                    {job.description && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-3">{job.description}</p>
                    )}
                  </CardHeader>
                  <CardContent className="mt-auto pt-0">
                    {applied ? (
                      <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium">
                        <CheckCircle2 size={14} /> Aplikacja wysłana
                      </div>
                    ) : (
                      <Button size="sm" className="w-full h-8 text-xs" onClick={() => setApplyJob(job)}>
                        Aplikuj <ArrowRight size={13} className="ml-1" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* My applications */}
      <div>
        <h2 className="text-base font-semibold mb-4">Moje aplikacje</h2>
        {appsLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : myApplications.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nie wysłałeś jeszcze żadnej aplikacji.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {myApplications.map(app => {
              const job = jobs.find(j => j.id === app.jobId);
              return (
                <div key={app.id} className="flex items-center justify-between border border-border rounded-xl px-4 py-3 bg-card">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">{job?.title ?? app.jobId}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock size={11} /> {deptMap.get(job?.departmentId ?? '') ?? job?.departmentId ?? ''}
                    </p>
                  </div>
                  <Badge variant="outline" className={cn('text-[11px] shadow-none', STAGE_COLORS[app.stage])}>
                    {STAGE_LABELS[app.stage]}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Apply dialog */}
      <Dialog open={!!applyJob} onOpenChange={open => {
        if (!open) { setApplyJob(null); setPhone(''); setCvFile(null); }
      }}>
        <DialogContent className="sm:max-w-[460px]">
          <form onSubmit={handleApply}>
            <DialogHeader>
              <DialogTitle>Aplikuj na stanowisko</DialogTitle>
              <DialogDescription>{applyJob?.title}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Imię i nazwisko</Label>
                <Input value={user?.displayName ?? user?.email ?? ''} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input value={user?.email ?? ''} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon <span className="text-muted-foreground text-xs">(opcjonalnie)</span></Label>
                <Input id="phone" placeholder="+48 000 000 000"
                  value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>CV (PDF)</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={e => setCvFile(e.target.files?.[0] ?? null)}
                />
                {cvFile ? (
                  <div className="flex items-center gap-2 border border-border rounded-lg px-3 py-2 bg-muted/40">
                    <FileText size={15} className="text-primary shrink-0" />
                    <span className="text-sm flex-1 truncate">{cvFile.name}</span>
                    <button type="button" onClick={() => setCvFile(null)}
                      className="text-xs text-muted-foreground hover:text-destructive transition-colors">
                      Usuń
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg px-3 py-4 text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
                  >
                    <Upload size={15} /> Wybierz plik PDF
                  </button>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setApplyJob(null); setCvFile(null); }}>Anuluj</Button>
              <Button type="submit" disabled={applyMutation.isPending || uploading}>
                {uploading ? 'Wysyłanie CV...' : applyMutation.isPending ? 'Wysyłanie...' : 'Wyślij aplikację'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── HR / Admin ATS ───────────────────────────────────────────────────────────

function ATSBoard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [candidateNotes, setCandidateNotes] = useState('');
  const dragCandidate = useRef<Candidate | null>(null);
  const [formData, setFormData] = useState({
    title: '', departmentId: '', status: 'open' as const, salaryRange: '', description: '',
  });

  const { data: jobs = [], isLoading: jobsLoading } = useJobs();
  const { data: candidates = [], isLoading: candidatesLoading } = useCandidates();
  const { data: departments = [] } = useRecruitmentDepartments();
  const loading = jobsLoading || candidatesLoading;

  const createJobMutation = useCreateJob();
  const updateStageMutation = useUpdateCandidateStage();
  const hireMutation = useHireCandidate();
  const notesMutation = useUpdateCandidateNotes();
  const isSubmitting = createJobMutation.isPending || hireMutation.isPending;

  const openCandidate = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setCandidateNotes(candidate.notes ?? '');
  };

  const saveNotes = () => {
    if (!selectedCandidate) return;
    notesMutation.mutate(
      { id: selectedCandidate.id, notes: candidateNotes },
      { onSuccess: () => setSelectedCandidate(prev => prev ? { ...prev, notes: candidateNotes } : null) }
    );
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createJobMutation.mutateAsync(formData);
      setIsDialogOpen(false);
      setFormData({ title: '', departmentId: '', status: 'open', salaryRange: '', description: '' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleStageChange = (candidateId: string, stage: Candidate['stage']) => {
    updateStageMutation.mutate({ id: candidateId, stage });
  };

  const handleHire = (candidateId: string, jobId: string) => {
    if (!confirm('Czy na pewno chcesz zatrudnić tego kandydata? Spowoduje to utworzenie nowego rekordu pracownika.')) return;
    hireMutation.mutate({ candidateId, jobId }, {
      onSuccess: (employeeId) => {
        toast.success('Kandydat zatrudniony!', { description: 'Profil pracownika został utworzony.' });
        window.location.href = `/employees/detail?id=${employeeId}`;
      },
      onError: () => toast.error('Błąd podczas zatrudniania kandydata.'),
    });
  };

  const deptMap = useMemo(() => new Map(departments.map(d => [d.id, d.name])), [departments]);
  const candidatesByStage = useMemo(() => {
    const lower = searchTerm.toLowerCase();
    const map = new Map<Candidate['stage'], Candidate[]>(STAGES.map(s => [s.id, []]));
    candidates.forEach(c => {
      if (`${c.firstName} ${c.lastName}`.toLowerCase().includes(lower)) {
        map.get(c.stage)?.push(c);
      }
    });
    return map;
  }, [candidates, searchTerm]);
  const candidateCountByJob = useMemo(() => {
    const counts = new Map<string, number>();
    candidates.forEach(c => counts.set(c.jobId, (counts.get(c.jobId) ?? 0) + 1));
    return counts;
  }, [candidates]);
  const onDragStart = (candidate: Candidate) => { dragCandidate.current = candidate; };
  const onDrop = async (stageId: Candidate['stage']) => {
    const c = dragCandidate.current;
    if (!c || c.stage === stageId) { setDragOverStage(null); return; }
    await handleStageChange(c.id, stageId);
    dragCandidate.current = null;
    setDragOverStage(null);
  };

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Rekrutacja (ATS)</h1>
          <p className="text-sm text-muted-foreground mt-1">Zarządzaj procesami rekrutacyjnymi i kandydatami.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-9"><Plus size={16} className="mr-2" /> Dodaj ogłoszenie</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] shadow-2xl border-border">
            <form onSubmit={handleCreateJob}>
              <DialogHeader>
                <DialogTitle>Nowe ogłoszenie o pracę</DialogTitle>
                <DialogDescription>Opublikuj ogłoszenie, aby rozpocząć proces rekrutacyjny.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Tytuł stanowiska</Label>
                  <Input id="title" required placeholder="np. Senior React Developer"
                    value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Dział</Label>
                  <select id="department"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    required value={formData.departmentId}
                    onChange={e => setFormData({ ...formData, departmentId: e.target.value })}>
                    <option value="">Wybierz dział...</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salary">Widełki płacowe <span className="text-muted-foreground text-xs">(opcjonalnie)</span></Label>
                  <Input id="salary" placeholder="np. 15 000 – 20 000 PLN"
                    value={formData.salaryRange} onChange={e => setFormData({ ...formData, salaryRange: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Opis stanowiska <span className="text-muted-foreground text-xs">(opcjonalnie)</span></Label>
                  <textarea
                    id="description"
                    rows={4}
                    placeholder="Zakres obowiązków, wymagania, benefity..."
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring/20"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Anuluj</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Tworzenie...' : 'Opublikuj'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="kanban" className="w-full">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="kanban" className="gap-2"><Columns2 size={14} /> Tablica Kanban</TabsTrigger>
          <TabsTrigger value="jobs" className="gap-2"><Briefcase size={14} /> Ogłoszenia</TabsTrigger>
        </TabsList>

        <TabsContent value="kanban" className="mt-6 space-y-5">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
            <Input placeholder="Szukaj kandydata..."
              className="pl-9 bg-card border-border shadow-none h-9 text-sm"
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: 540 }}>
            {STAGES.map(stage => {
              const stageCandidates = candidatesByStage.get(stage.id) ?? [];
              const isOver = dragOverStage === stage.id;

              return (
                <div
                  key={stage.id}
                  className="flex flex-col gap-3 shrink-0"
                  style={{ width: 210 }}
                  onDragOver={e => { e.preventDefault(); setDragOverStage(stage.id); }}
                  onDragLeave={() => setDragOverStage(null)}
                  onDrop={() => onDrop(stage.id)}
                >
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{stage.label}</span>
                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5 bg-muted">
                      {stageCandidates.length}
                    </Badge>
                  </div>

                  <div className={cn(
                    'flex flex-col gap-2 rounded-xl border-2 border-dashed p-2 flex-1 transition-colors',
                    isOver ? 'border-primary/40 bg-primary/5' : 'border-border/60 bg-muted/20'
                  )}>
                    {loading ? (
                      <Skeleton className="h-24 w-full rounded-lg" />
                    ) : stageCandidates.length === 0 ? (
                      <div className="flex items-center justify-center h-16 text-[10px] text-muted-foreground italic">
                        Brak kandydatów
                      </div>
                    ) : stageCandidates.map(candidate => (
                      <Card
                        key={candidate.id}
                        draggable
                        onDragStart={() => onDragStart(candidate)}
                        onDragEnd={() => { dragCandidate.current = null; setDragOverStage(null); }}
                        onClick={() => openCandidate(candidate)}
                        className={cn(
                          'shadow-none border-border cursor-pointer active:cursor-grabbing active:opacity-60 group bg-card',
                          `border-t-2 ${stage.accent}`,
                          'hover:shadow-sm transition-all'
                        )}
                      >
                        <CardContent className="p-3 space-y-2">
                          <div className="flex justify-between items-start">
                            <div className="space-y-0.5">
                              <h4 className="text-[13px] font-semibold leading-tight">
                                {candidate.firstName} {candidate.lastName}
                              </h4>
                              <p className="text-[10px] text-muted-foreground truncate max-w-[130px]">
                                {candidate.email}
                              </p>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon"
                                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                  onClick={e => e.stopPropagation()}>
                                  <MoreVertical size={13} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44">
                                <DropdownMenuLabel className="text-xs">Zmień etap</DropdownMenuLabel>
                                {STAGES.filter(s => s.id !== stage.id).map(s => (
                                  <DropdownMenuItem key={s.id} className="text-sm"
                                    onClick={() => handleStageChange(candidate.id, s.id)}>
                                    → {s.label}
                                  </DropdownMenuItem>
                                ))}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600 text-sm"
                                  onClick={() => handleStageChange(candidate.id, 'rejected')}>
                                  Odrzuć
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full rounded-full bg-primary/70"
                                style={{ width: `${candidate.score}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-muted-foreground font-medium">{candidate.score}%</span>
                          </div>

                          {candidate.cvUrl && (
                            <div className="flex items-center gap-1 text-[10px] text-primary">
                              <FileText size={10} /> CV załączone
                            </div>
                          )}

                          {stage.id === 'offer' && (
                            <Button
                              className="w-full h-6 text-[10px] bg-emerald-600 hover:bg-emerald-700"
                              size="sm"
                              disabled={isSubmitting}
                              onClick={e => { e.stopPropagation(); handleHire(candidate.id, candidate.jobId); }}
                            >
                              <UserCheck size={11} className="mr-1" /> Zatrudnij
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="jobs" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              [1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-full" />)
            ) : jobs.map(job => (
              <Card key={job.id} className="shadow-none border-border hover:border-primary/20 transition-all flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="bg-primary/5 p-2 rounded-lg mb-2">
                      <Briefcase className="text-primary" size={20} />
                    </div>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 shadow-none">
                      Aktywne
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{job.title}</CardTitle>
                  <CardDescription>{deptMap.get(job.departmentId) ?? job.departmentId}</CardDescription>
                  {job.salaryRange && (
                    <p className="text-sm font-medium text-foreground/70 mt-1">{job.salaryRange}</p>
                  )}
                  {job.description && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{job.description}</p>
                  )}
                </CardHeader>
                <CardContent className="mt-auto">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users size={14} />
                      <span>{candidateCountByJob.get(job.id) ?? 0} kandydatów</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Candidate detail Sheet */}
      <Sheet open={!!selectedCandidate} onOpenChange={open => { if (!open) setSelectedCandidate(null); }}>
        <SheetContent side="right" className="w-[400px] sm:w-[480px] flex flex-col gap-0 p-0">
          {selectedCandidate && (
            <>
              <SheetHeader className="px-6 py-5 border-b border-border">
                <SheetTitle>{selectedCandidate.firstName} {selectedCandidate.lastName}</SheetTitle>
                <SheetDescription>{selectedCandidate.email}</SheetDescription>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/50 rounded-xl p-4">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Etap</p>
                    <p className="text-[14px] font-semibold">{STAGES.find(s => s.id === selectedCandidate.stage)?.label ?? selectedCandidate.stage}</p>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-4">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Wynik</p>
                    <p className="text-[14px] font-semibold">{selectedCandidate.score}%</p>
                    <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary/70 rounded-full" style={{ width: `${selectedCandidate.score}%` }} />
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-2">Oferta pracy</p>
                  <p className="text-[13px]">{jobs.find(j => j.id === selectedCandidate.jobId)?.title ?? selectedCandidate.jobId}</p>
                </div>

                {selectedCandidate.phone && (
                  <div>
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-2">Telefon</p>
                    <p className="text-[13px]">{selectedCandidate.phone}</p>
                  </div>
                )}

                {selectedCandidate.cvUrl && (
                  <div>
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-2">CV</p>
                    <a
                      href={selectedCandidate.cvUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card hover:bg-accent text-[13px] font-medium transition-colors"
                    >
                      <Download size={13} /> Pobierz CV (PDF)
                    </a>
                  </div>
                )}

                <div>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-2">Zmień etap</p>
                  <div className="flex flex-wrap gap-2">
                    {STAGES.filter(s => s.id !== selectedCandidate.stage).map(s => (
                      <button
                        key={s.id}
                        onClick={() => {
                          updateStageMutation.mutate({ id: selectedCandidate.id, stage: s.id });
                          setSelectedCandidate(prev => prev ? { ...prev, stage: s.id } : null);
                        }}
                        className="text-[11px] px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-accent transition-colors font-medium"
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-2">Notatki rekrutera</p>
                  <textarea
                    value={candidateNotes}
                    onChange={e => setCandidateNotes(e.target.value)}
                    rows={5}
                    placeholder="Dodaj notatki o kandydacie..."
                    className="w-full px-3 py-2 text-[13px] border border-border rounded-lg bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring/20"
                  />
                  <button
                    onClick={saveNotes}
                    disabled={notesMutation.isPending}
                    className="mt-2 h-8 px-4 text-[12px] font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    {notesMutation.isPending ? 'Zapisywanie...' : 'Zapisz notatki'}
                  </button>
                </div>

                {selectedCandidate.stage === 'offer' && (
                  <button
                    onClick={() => { setSelectedCandidate(null); handleHire(selectedCandidate.id, selectedCandidate.jobId); }}
                    disabled={hireMutation.isPending}
                    className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                  >
                    <UserCheck size={15} /> Zatrudnij kandydata
                  </button>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RecruitmentPage() {
  const { user } = useAuth();
  const isEmployee = user?.role === 'employee';

  if (isEmployee) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 px-8 py-10 pb-12">
        <div className="border-b border-border pb-6">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Oferty pracy</h1>
          <p className="text-sm text-muted-foreground mt-1">Przeglądaj aktualne oferty i aplikuj na wybrane stanowiska.</p>
        </div>
        <JobBoard />
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto space-y-6 px-8 py-10 pb-12">
      <ATSBoard />
    </div>
  );
}
