'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Briefcase, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  UserCheck,
  Columns2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  getActiveJobs,
  getAllCandidates,
  updateCandidateStage,
  hireCandidate,
  createJob
} from '@/services/db/recruitment';
import { getDepartments } from '@/services/db/system';
import { Candidate, Job, Department } from '@/types';

const STAGES: { id: Candidate['stage']; label: string; color: string }[] = [
  { id: 'applied', label: 'Nowi', color: 'bg-blue-100 text-blue-800' },
  { id: 'screening', label: 'Screening', color: 'bg-purple-100 text-purple-800' },
  { id: 'interview', label: 'Wywiad', color: 'bg-amber-100 text-amber-800' },
  { id: 'offer', label: 'Oferta', color: 'bg-emerald-100 text-emerald-800' },
  { id: 'hired', label: 'Zatrudnieni', color: 'bg-green-100 text-green-800' },
  { id: 'rejected', label: 'Odrzuceni', color: 'bg-red-100 text-red-800' }
];

export default function RecruitmentPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    departmentId: '',
    status: 'open' as const,
    salaryRange: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [jobsData, candidatesData, deptsData] = await Promise.all([
        getActiveJobs(),
        getAllCandidates(),
        getDepartments()
      ]);
      setJobs(jobsData);
      setCandidates(candidatesData);
      setDepartments(deptsData);
    } catch (error) {
      console.error("Error fetching recruitment data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createJob(formData);
      setIsDialogOpen(false);
      setFormData({ title: '', departmentId: '', status: 'open', salaryRange: '' });
      await fetchData();
    } catch (error) {
      console.error("Error creating job:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStageChange = async (candidateId: string, stage: Candidate['stage']) => {
    try {
      await updateCandidateStage(candidateId, stage);
      fetchData();
    } catch (error) {
      console.error("Error updating stage:", error);
    }
  };

  const handleHire = async (candidateId: string, jobId: string) => {
    if (!confirm("Czy na pewno chcesz zatrudnić tego kandydata? Spowoduje to utworzenie nowego rekordu pracownika.")) return;
    
    setIsSubmitting(true);
    try {
      await hireCandidate(candidateId, jobId);
      fetchData();
    } catch (error) {
      console.error("Error hiring candidate:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDepartmentName = (id: string) => {
    return departments.find(d => d.id === id)?.name || id;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Rekrutacja (ATS)</h1>
          <p className="text-sm text-muted-foreground mt-1">Zarządzaj procesami rekrutacyjnymi i kandydatami.</p>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-9 shadow-sm">
                <Plus size={16} className="mr-2" /> Dodaj ogłoszenie
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] shadow-2xl border-border">
              <form onSubmit={handleCreateJob}>
                <DialogHeader>
                  <DialogTitle>Nowe ogłoszenie o pracę</DialogTitle>
                  <DialogDescription>
                    Opublikuj nowe ogłoszenie, aby rozpocząć proces rekrutacyjny w HR Nexus.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Tytuł stanowiska</Label>
                    <Input 
                      id="title" 
                      required 
                      placeholder="np. Senior React Developer" 
                      value={formData.title}
                      onChange={e => setFormData({...formData, title: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Dział</Label>
                    <select 
                      id="department" 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      required
                      value={formData.departmentId}
                      onChange={e => setFormData({...formData, departmentId: e.target.value})}
                    >
                      <option value="">Wybierz dział...</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="salary">Widełki płacowe (opcjonalnie)</Label>
                    <Input 
                      id="salary" 
                      placeholder="np. 15 000 - 20 000 PLN" 
                      value={formData.salaryRange}
                      onChange={e => setFormData({...formData, salaryRange: e.target.value})}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Anuluj</Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Tworzenie..." : "Opublikuj ogłoszenie"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="kanban" className="w-full">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="kanban" className="gap-2">
            <Columns2 size={14} /> Tablica Kanban
          </TabsTrigger>
          <TabsTrigger value="jobs" className="gap-2">
            <Briefcase size={14} /> Ogłoszenia
          </TabsTrigger>
        </TabsList>

        <TabsContent value="kanban" className="mt-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input 
                placeholder="Szukaj kandydata..." 
                className="pl-10 bg-card border-border shadow-none h-10 text-sm focus-visible:ring-primary/20"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto pb-4">
            {STAGES.map((stage) => (
              <div key={stage.id} className="flex flex-col gap-4 min-w-[200px]">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    {stage.label}
                    <Badge variant="secondary" className="bg-muted text-[10px] px-1.5 h-4 min-w-4 flex items-center justify-center">
                      {candidates.filter(c => c.stage === stage.id).length}
                    </Badge>
                  </h3>
                </div>

                <div className="flex flex-col gap-3 bg-muted/10 p-2 rounded-lg border border-border/50 min-h-[500px]">
                  {loading ? (
                    <Skeleton className="h-24 w-full" />
                  ) : (
                    candidates
                      .filter(c => c.stage === stage.id)
                      .filter(c => `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map((candidate) => (
                        <Card key={candidate.id} className="shadow-none border-border hover:border-primary/50 transition-colors cursor-default group bg-card">
                          <CardContent className="p-3 space-y-3">
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <h4 className="text-sm font-semibold">{candidate.firstName} {candidate.lastName}</h4>
                                <p className="text-[10px] text-muted-foreground truncate max-w-[140px]">{candidate.email}</p>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreVertical size={14} />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuLabel>Zmień etap</DropdownMenuLabel>
                                  {STAGES.filter(s => s.id !== stage.id).map(s => (
                                    <DropdownMenuItem key={s.id} onClick={() => handleStageChange(candidate.id, s.id)}>
                                      Przesuń do: {s.label}
                                    </DropdownMenuItem>
                                  ))}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-red-600">Odrzuć kandydata</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[9px] font-normal py-0 shadow-none">
                                Wynik: {candidate.score}%
                              </Badge>
                            </div>

                            {stage.id === 'offer' && (
                              <Button 
                                className="w-full h-7 text-[10px] bg-emerald-600 hover:bg-emerald-700 shadow-sm" 
                                size="sm"
                                disabled={isSubmitting}
                                onClick={() => handleHire(candidate.id, candidate.jobId)}
                              >
                                <UserCheck size={12} className="mr-1" /> Zatrudnij
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      ))
                  )}
                  {!loading && candidates.filter(c => c.stage === stage.id).length === 0 && (
                    <div className="flex flex-col items-center justify-center h-20 text-[10px] text-muted-foreground italic">
                      Brak kandydatów
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="jobs" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              [1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-full" />)
            ) : (
              jobs.map(job => (
                <Card key={job.id} className="shadow-none border-border group hover:border-primary/20 transition-all">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="bg-primary/5 p-2 rounded-lg mb-2">
                        <Briefcase className="text-primary" size={20} />
                      </div>
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 shadow-none">Aktywne</Badge>
                    </div>
                    <CardTitle className="text-lg">{job.title}</CardTitle>
                    <CardDescription>{getDepartmentName(job.departmentId)}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users size={14} />
                        <span>{candidates.filter(c => c.jobId === job.id).length} kandydatów</span>
                      </div>
                      <Button variant="outline" size="sm" className="h-8 shadow-sm">Szczegóły</Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
