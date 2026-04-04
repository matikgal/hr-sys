'use client';

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  Award,
  AlertTriangle,
  Search,
  ArrowRight,
  ShieldCheck,
  Cpu
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { getAvailableTrainings, getEmployeeTrainings } from '@/services/db/trainings';
import { Training, EmployeeTraining } from '@/types';
import { format, differenceInDays, parseISO } from 'date-fns';

export default function LearningPage() {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [empTrainings, setEmpTrainings] = useState<EmployeeTraining[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [available, assigned] = await Promise.all([
          getAvailableTrainings(),
          getEmployeeTrainings("EMP-001") // Mock current user
        ]);
        setTrainings(available);
        setEmpTrainings(assigned);
      } catch (error) {
        console.error("Error fetching learning data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const getStatusBadge = (training: EmployeeTraining) => {
    if (training.status === 'completed') {
      return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none"><CheckCircle2 size={12} className="mr-1" /> Ukończono</Badge>;
    }
    
    const daysLeft = differenceInDays(parseISO(training.expiryDate), new Date());
    if (daysLeft < 0) {
      return <Badge variant="destructive"><AlertTriangle size={12} className="mr-1" /> Przeterminowane</Badge>;
    }
    if (daysLeft <= 14) {
      return <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100 border-none"><Clock size={12} className="mr-1" /> Wygasa za {daysLeft} dni</Badge>;
    }
    
    return <Badge variant="secondary"><Clock size={12} className="mr-1" /> W toku</Badge>;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Szkolenia i Rozwój</h1>
          <p className="text-sm text-muted-foreground mt-1">Podnoś swoje kompetencje i zarządzaj certyfikatami.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button size="sm" className="h-9">
            <BookOpen size={16} className="mr-2" /> Katalog kursów
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-none border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="text-amber-500" size={18} /> Moje Certyfikaty
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{empTrainings.filter(t => t.status === 'completed').length}</div>
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
            <div className="text-2xl font-bold">{empTrainings.filter(t => t.status === 'pending').length}</div>
            <p className="text-xs text-muted-foreground mt-1">Kursy do ukończenia</p>
          </CardContent>
        </Card>
        <Card className="shadow-none border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShieldCheck className="text-emerald-600" size={18} /> Compliance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">100%</div>
            <p className="text-xs text-muted-foreground mt-1">Szkolenia obowiązkowe</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Twoja ścieżka rozwoju</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            [1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full" />)
          ) : (
            empTrainings.map((et) => {
              const training = trainings.find(t => t.id === et.trainingId);
              if (!training) return null;
              
              return (
                <Card key={et.id} className="shadow-none border-border group overflow-hidden">
                  <div className={`h-2 w-full ${training.mandatory ? 'bg-red-500' : 'bg-blue-500'}`} />
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="bg-muted p-2 rounded-lg">
                        {training.title.toLowerCase().includes('it') ? <Cpu size={20} className="text-blue-600" /> : <ShieldCheck size={20} className="text-emerald-600" />}
                      </div>
                      {getStatusBadge(et)}
                    </div>
                    <CardTitle className="text-base">{training.title}</CardTitle>
                    <CardDescription className="text-xs">Wymagane: {training.mandatory ? 'Tak' : 'Nie'}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>Postęp</span>
                        <span>{et.status === 'completed' ? '100%' : '25%'}</span>
                      </div>
                      <Progress value={et.status === 'completed' ? 100 : 25} className="h-1.5" />
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button variant="ghost" size="sm" className="w-full h-8 text-xs group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      {et.status === 'completed' ? 'Podgląd certyfikatu' : 'Kontynuuj naukę'} <ArrowRight size={14} className="ml-2" />
                    </Button>
                  </CardFooter>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
