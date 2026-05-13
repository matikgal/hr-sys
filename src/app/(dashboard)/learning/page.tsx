'use client';

import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Award,
  AlertTriangle,
  ShieldCheck,
  Cpu,
  Plus,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { EmployeeTraining } from '@/types';
import { differenceInDays, parseISO } from 'date-fns';
import {
  useTrainings,
  useEmployeeTrainings,
  useAllEmployeeTrainings,
  useCreateTraining,
  useDeleteTraining,
  useEnrollInTraining,
} from '@/hooks/use-learning';
import { useAuth } from '@/context/auth-context';
import { toast } from 'sonner';

export default function LearningPage() {
  const { user } = useAuth();
  const canManage = user?.role === 'admin' || user?.role === 'hr' || user?.role === 'manager';

  const { data: trainings = [], isLoading: trainingsLoading } = useTrainings();
  const { data: myTrainings = [], isLoading: myLoading } = useEmployeeTrainings(user?.uid);
  const { data: allAssignments = [] } = useAllEmployeeTrainings(canManage);
  const loading = trainingsLoading || myLoading;

  const createMutation = useCreateTraining();
  const deleteMutation = useDeleteTraining();
  const enrollMutation = useEnrollInTraining();

  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newMandatory, setNewMandatory] = useState(false);
  const [newValidity, setNewValidity] = useState('12');
  const [tab, setTab] = useState<'my' | 'catalog'>('catalog');

  const enrolledTrainingIds = useMemo(
    () => new Set(myTrainings.map(t => t.trainingId)),
    [myTrainings]
  );

  const enrollCountMap = useMemo(() => {
    const map = new Map<string, number>();
    allAssignments.forEach(a => {
      map.set(a.trainingId, (map.get(a.trainingId) ?? 0) + 1);
    });
    return map;
  }, [allAssignments]);

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    createMutation.mutate(
      {
        title: newTitle.trim(),
        mandatory: newMandatory,
        validityMonths: parseInt(newValidity) || 12,
      },
      {
        onSuccess: () => {
          toast.success('Szkolenie dodane do katalogu.');
          setShowAdd(false);
          setNewTitle('');
          setNewMandatory(false);
          setNewValidity('12');
        },
        onError: () => toast.error('Nie udalo sie dodac szkolenia.'),
      }
    );
  };

  const handleEnroll = (trainingId: string) => {
    if (!user?.uid) return;
    enrollMutation.mutate(
      { employeeId: user.uid, trainingId },
      {
        onSuccess: () => toast.success('Zapisano na szkolenie.'),
        onError: () => toast.error('Nie udalo sie zapisac na szkolenie.'),
      }
    );
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success('Szkolenie usuniete.'),
      onError: () => toast.error('Nie udalo sie usunac szkolenia.'),
    });
  };

  const getStatusBadge = (et: EmployeeTraining) => {
    if (et.status === 'completed') {
      return (
        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none">
          <CheckCircle2 size={12} className="mr-1" /> Ukonczone
        </Badge>
      );
    }

    const daysLeft = differenceInDays(parseISO(et.expiryDate), new Date());
    if (daysLeft < 0) {
      return (
        <Badge variant="destructive">
          <AlertTriangle size={12} className="mr-1" /> Przeterminowane
        </Badge>
      );
    }
    if (daysLeft <= 14) {
      return (
        <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100 border-none">
          <Clock size={12} className="mr-1" /> Wygasa za {daysLeft} dni
        </Badge>
      );
    }

    return (
      <Badge variant="secondary">
        <Clock size={12} className="mr-1" /> W toku
      </Badge>
    );
  };

  return (
    <div className="max-w-[1440px] mx-auto space-y-6 px-8 py-10 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Szkolenia i Rozwoj</h1>
          <p className="text-sm text-muted-foreground mt-1">Podnosj swoje kompetencje i zarzadzaj certyfikatami.</p>
        </div>
        <div className="flex items-center gap-3">
          {canManage && (
            <Button size="sm" className="h-9" onClick={() => setShowAdd(true)}>
              <Plus size={16} className="mr-2" /> Dodaj szkolenie
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-none border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="text-amber-500" size={18} /> Moje Certyfikaty
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myTrainings.filter(t => t.status === 'completed').length}</div>
            <p className="text-xs text-muted-foreground mt-1">Aktywne uprawnienia</p>
          </CardContent>
        </Card>
        <Card className="shadow-none border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="text-blue-600" size={18} /> W trakcie
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myTrainings.filter(t => t.status === 'pending').length}</div>
            <p className="text-xs text-muted-foreground mt-1">Kursy do ukonczenia</p>
          </CardContent>
        </Card>
        <Card className="shadow-none border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="text-violet-600" size={18} /> Katalog
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trainings.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Dostepne szkolenia</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
        <button
          onClick={() => setTab('catalog')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            tab === 'catalog' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Katalog szkolen
        </button>
        <button
          onClick={() => setTab('my')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            tab === 'my' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Moje szkolenia
        </button>
      </div>

      {/* Catalog tab */}
      {tab === 'catalog' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            [1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full" />)
          ) : trainings.length === 0 ? (
            <div className="col-span-full py-16 text-center text-sm text-muted-foreground">
              Brak szkolen w katalogu.
            </div>
          ) : (
            trainings.map(training => {
              const enrolled = enrolledTrainingIds.has(training.id);
              const participantCount = enrollCountMap.get(training.id) ?? 0;

              return (
                <Card key={training.id} className="shadow-none border-border group hover:border-primary/30 transition-all duration-200 rounded-xl overflow-hidden flex flex-col">
                  <CardHeader className="pb-3 pt-5 px-5">
                    <div className="flex justify-between items-start mb-3">
                      <div className={cn(
                        "size-10 rounded-xl flex items-center justify-center shrink-0",
                        training.title.toLowerCase().includes('it') || training.title.toLowerCase().includes('cyber') 
                          ? "bg-blue-50 text-blue-600" 
                          : "bg-emerald-50 text-emerald-600"
                      )}>
                        {training.title.toLowerCase().includes('it') || training.title.toLowerCase().includes('cyber') ? (
                          <Cpu size={18} />
                        ) : (
                          <ShieldCheck size={18} />
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        {training.mandatory && (
                          <Badge variant="outline" className="text-[10px] bg-red-50 text-red-600 border-red-200 shadow-none">
                            Obowiązkowe
                          </Badge>
                        )}
                        {enrolled && (
                          <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 shadow-none">
                            Zapisany
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardTitle className="text-base font-semibold leading-tight">{training.title}</CardTitle>
                    <CardDescription className="text-[12px] mt-1.5 flex items-center gap-1.5">
                      <Clock size={12} className="text-muted-foreground" />
                      Ważność: {training.validityMonths > 0 ? `${training.validityMonths} mies.` : 'Bezterminowe'}
                      {canManage && (
                        <>
                          <span className="text-border mx-1">•</span>
                          <UserPlus size={12} className="text-muted-foreground" />
                          {participantCount} {participantCount === 1 ? 'uczestnik' : 'uczestników'}
                        </>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="pt-0 pb-5 px-5 mt-auto flex gap-2">
                    {!enrolled ? (
                      <Button
                        size="sm"
                        variant="default"
                        className="flex-1 h-9 text-[12px] font-medium transition-colors"
                        onClick={() => handleEnroll(training.id)}
                        disabled={enrollMutation.isPending}
                      >
                        <UserPlus size={14} className="mr-1.5" /> Dołącz do szkolenia
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" className="flex-1 h-9 text-[12px] font-medium shadow-none" disabled>
                        <CheckCircle2 size={14} className="mr-1.5 text-emerald-600" /> Już zapisany
                      </Button>
                    )}
                    {canManage && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 px-2.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => handleDelete(training.id)}
                        disabled={deleteMutation.isPending}
                        title="Usuń szkolenie"
                      >
                        <Trash2 size={16} />
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* My trainings tab */}
      {tab === 'my' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            [1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full" />)
          ) : myTrainings.length === 0 ? (
            <div className="col-span-full py-16 text-center text-sm text-muted-foreground">
              Nie jestes zapisany na zadne szkolenie. Przejdz do katalogu, aby sie zapisac.
            </div>
          ) : (
            myTrainings.map(et => {
              const training = trainings.find(t => t.id === et.trainingId);
              if (!training) return null;

              return (
                <Card key={et.id} className="shadow-none border-border group hover:border-primary/30 transition-all duration-200 rounded-xl overflow-hidden flex flex-col">
                  <CardHeader className="pb-3 pt-5 px-5">
                    <div className="flex justify-between items-start mb-3">
                      <div className={cn(
                        "size-10 rounded-xl flex items-center justify-center shrink-0",
                        training.title.toLowerCase().includes('it') || training.title.toLowerCase().includes('cyber') 
                          ? "bg-blue-50 text-blue-600" 
                          : "bg-emerald-50 text-emerald-600"
                      )}>
                        {training.title.toLowerCase().includes('it') || training.title.toLowerCase().includes('cyber') ? (
                          <Cpu size={18} />
                        ) : (
                          <ShieldCheck size={18} />
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        {getStatusBadge(et)}
                      </div>
                    </div>
                    <CardTitle className="text-base font-semibold leading-tight">{training.title}</CardTitle>
                    <CardDescription className="text-[12px] mt-1.5 flex items-center gap-1.5">
                      <ShieldCheck size={12} className="text-muted-foreground" />
                      Wymagane: {training.mandatory ? 'Tak' : 'Nie'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-4 px-5">
                    <div className="space-y-2.5">
                      <div className="flex justify-between text-[11px] font-medium text-muted-foreground">
                        <span>Postęp</span>
                        <span className={et.status === 'completed' ? 'text-emerald-600' : ''}>
                          {et.status === 'completed' ? '100%' : '25%'}
                        </span>
                      </div>
                      <Progress 
                        value={et.status === 'completed' ? 100 : 25} 
                        className="h-1.5" 
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0 pb-5 px-5 mt-auto">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full h-9 text-[12px] font-medium group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                    >
                      {et.status === 'completed' ? 'Podgląd certyfikatu' : 'Kontynuuj naukę'}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Add training dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nowe szkolenie</DialogTitle>
            <DialogDescription>Dodaj szkolenie do katalogu organizacji.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="training-title">Nazwa szkolenia</Label>
              <Input
                id="training-title"
                placeholder="np. Szkolenie BHP"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="training-validity">Waznosc (miesiace)</Label>
              <Input
                id="training-validity"
                type="number"
                min="0"
                placeholder="12"
                value={newValidity}
                onChange={e => setNewValidity(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">0 = bezterminowe</p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newMandatory}
                onChange={e => setNewMandatory(e.target.checked)}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              <span className="text-sm font-medium">Szkolenie obowiazkowe</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>
              Anuluj
            </Button>
            <Button onClick={handleCreate} disabled={!newTitle.trim() || createMutation.isPending}>
              {createMutation.isPending ? 'Dodawanie...' : 'Dodaj'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
