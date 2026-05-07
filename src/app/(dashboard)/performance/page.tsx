'use client';

import React, { useState, useMemo } from 'react';
import { Star, TrendingUp, Plus, ArrowRight, Target, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
} from 'recharts';
import { Review, Employee } from '@/types';
import { useReviews, useSubmitReview } from '@/hooks/use-performance';
import { useEmployees } from '@/hooks/use-employees';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from '@/lib/utils';

const REVIEW_CATEGORIES: { key: string; label: string; labelShort: string }[] = [
  { key: 'quality',        label: 'Jakość pracy',    labelShort: 'Jakość' },
  { key: 'communication',  label: 'Komunikacja',      labelShort: 'Komunik.' },
  { key: 'teamwork',       label: 'Praca zespołowa',  labelShort: 'Zespół' },
  { key: 'initiative',     label: 'Inicjatywa',       labelShort: 'Inicjat.' },
  { key: 'reliability',    label: 'Rzetelność',       labelShort: 'Rzeteln.' },
];

const DEFAULT_RATINGS = Object.fromEntries(REVIEW_CATEGORIES.map(c => [c.key, 3]));

function StarRater({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          className="p-0.5 focus:outline-none"
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(star)}
        >
          <Star
            size={20}
            className={cn(
              'transition-colors',
              (hover || value) >= star ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'
            )}
          />
        </button>
      ))}
    </div>
  );
}

function avgRating(ratings: Record<string, number>): number {
  const vals = Object.values(ratings);
  if (!vals.length) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

const DEFAULT_FORM = {
  employeeId: '',
  period: 'Q2 2026',
  ratings: { ...DEFAULT_RATINGS } as Record<string, number>,
  comments: '',
  status: 'submitted' as const,
};

export default function PerformancePage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState(DEFAULT_FORM);

  const { data: reviews = [], isLoading: reviewsLoading } = useReviews();
  const { data: employees = [], isLoading: empLoading } = useEmployees();
  const loading = reviewsLoading || empLoading;

  const submitReviewMutation = useSubmitReview();
  const isSubmitting = submitReviewMutation.isPending;

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await submitReviewMutation.mutateAsync({
        ...formData,
        reviewerId: 'admin-id',
        date: new Date().toISOString().split('T')[0],
      });
      setIsDialogOpen(false);
      setFormData(DEFAULT_FORM);
    } catch (err) {
      console.error(err);
    }
  };

  const getEmployeeName = (id: string) => {
    const emp = employees.find(e => e.id === id);
    return emp ? `${emp.firstName} ${emp.lastName}` : `ID: ${id}`;
  };

  const getEmployeeInitials = (id: string) => {
    const emp = employees.find(e => e.id === id);
    return emp ? `${emp.firstName[0]}${emp.lastName[0]}` : '?';
  };

  // Radar: average per category across all reviews
  const radarData = useMemo(() => REVIEW_CATEGORIES.map(cat => {
    const vals = reviews.map(r => r.ratings?.[cat.key] ?? 0).filter(Boolean);
    const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    return { subject: cat.labelShort, A: Math.round(avg * 20), fullMark: 100 };
  }), [reviews]);

  // Top performers: aggregate by employee, take top 5
  const topPerformers = useMemo(() => {
    const byEmp: Record<string, number[]> = {};
    reviews.forEach(r => {
      if (!byEmp[r.employeeId]) byEmp[r.employeeId] = [];
      byEmp[r.employeeId].push(avgRating(r.ratings));
    });
    return Object.entries(byEmp)
      .map(([id, avgs]) => ({ id, avg: avgs.reduce((a, b) => a + b, 0) / avgs.length }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 5);
  }, [reviews]);

  return (
    <div className="max-w-[1440px] mx-auto space-y-6 px-8 py-10 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Oceny i Wydajność</h1>
          <p className="text-sm text-muted-foreground mt-1">Zarządzaj cyklami ocen i śledź rozwój pracowników.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-9"><Plus size={16} className="mr-2" /> Nowa ocena</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[520px] shadow-2xl border-border">
            <form onSubmit={handleSubmitReview}>
              <DialogHeader>
                <DialogTitle>Wystaw nową ocenę</DialogTitle>
                <DialogDescription>Wypełnij formularz oceny pracowniczej (5 kategorii, skala 1–5 gwiazdek).</DialogDescription>
              </DialogHeader>
              <div className="grid gap-5 py-4">
                <div className="space-y-2">
                  <Label htmlFor="employee">Pracownik</Label>
                  <select
                    id="employee"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    required
                    value={formData.employeeId}
                    onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
                  >
                    <option value="">Wybierz pracownika...</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="period">Okres</Label>
                  <Input
                    id="period" required
                    value={formData.period}
                    onChange={e => setFormData({ ...formData, period: e.target.value })}
                    placeholder="np. Q2 2026"
                    className="w-40"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Oceny kategorii</Label>
                  <div className="space-y-3">
                    {REVIEW_CATEGORIES.map(cat => (
                      <div key={cat.key} className="flex items-center justify-between">
                        <span className="text-sm text-foreground w-36">{cat.label}</span>
                        <StarRater
                          value={formData.ratings[cat.key] ?? 3}
                          onChange={v => setFormData({ ...formData, ratings: { ...formData.ratings, [cat.key]: v } })}
                        />
                        <span className="text-sm font-semibold text-muted-foreground w-4 text-right">
                          {formData.ratings[cat.key]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="comments">Komentarz podsumowujący</Label>
                  <textarea
                    id="comments"
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Wpisz uzasadnienie oceny..."
                    value={formData.comments}
                    onChange={e => setFormData({ ...formData, comments: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Anuluj</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Zapisywanie...' : 'Zatwierdź ocenę'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Radar */}
        <Card className="shadow-none border-border lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="text-primary" size={18} /> Balans kompetencji
            </CardTitle>
            <CardDescription>Średnia ocen zespołu wg kategorii</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[250px] w-full rounded-xl" />
            ) : reviews.length === 0 ? (
              <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground">Brak danych</div>
            ) : (
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#64748b' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="Zespół" dataKey="A" stroke="#0a6b3e" fill="#0a6b3e" fillOpacity={0.25} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top performers */}
        <Card className="shadow-none border-border lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Trophy className="text-amber-500" size={18} /> Najwyżej oceniani
            </CardTitle>
            <CardDescription>Pracownicy z najlepszą średnią ocen</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}</div>
            ) : topPerformers.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">Brak ocen do wyświetlenia</div>
            ) : (
              <div className="space-y-3">
                {topPerformers.map(({ id, avg }, idx) => (
                  <div key={id} className="flex items-center justify-between p-3 border border-border rounded-xl bg-card hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-muted-foreground w-5 text-center">{idx + 1}</span>
                      <div className="h-9 w-9 rounded-full bg-[#e6f1ea] flex items-center justify-center text-[#0a6b3e] text-xs font-bold">
                        {getEmployeeInitials(id)}
                      </div>
                      <p className="text-sm font-semibold">{getEmployeeName(id)}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Star size={13} className="text-amber-400 fill-amber-400" />
                      <span className="text-sm font-bold">{avg.toFixed(1)}</span>
                      <span className="text-xs text-muted-foreground">/ 5</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reviews table */}
      <Card className="shadow-none border-border overflow-hidden">
        <CardHeader className="bg-muted/30 pb-4">
          <CardTitle className="text-base">Historia ocen okresowych</CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-bold uppercase tracking-wider py-4 pl-6">Pracownik</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider py-4">Okres</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider py-4">Status</TableHead>
              {REVIEW_CATEGORIES.map(cat => (
                <TableHead key={cat.key} className="text-xs font-bold uppercase tracking-wider py-4">{cat.labelShort}</TableHead>
              ))}
              <TableHead className="text-xs font-bold uppercase tracking-wider py-4">Śr.</TableHead>
              <TableHead className="text-right text-xs font-bold uppercase tracking-wider py-4 pr-6">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [1, 2, 3].map(i => (
                <TableRow key={i}>
                  <TableCell colSpan={9} className="py-4 px-6"><Skeleton className="h-10 w-full" /></TableCell>
                </TableRow>
              ))
            ) : reviews.map(review => {
              const avg = avgRating(review.ratings);
              return (
                <TableRow key={review.id} className="transition-colors border-border">
                  <TableCell className="py-3 pl-6 font-medium">{getEmployeeName(review.employeeId)}</TableCell>
                  <TableCell className="py-3 text-sm">{review.period}</TableCell>
                  <TableCell className="py-3">
                    <Badge variant={review.status === 'submitted' ? 'default' : 'secondary'} className="text-[10px]">
                      {review.status === 'submitted' ? 'Zakończona' : 'Robocza'}
                    </Badge>
                  </TableCell>
                  {REVIEW_CATEGORIES.map(cat => (
                    <TableCell key={cat.key} className="py-3 text-sm text-center">
                      {review.ratings?.[cat.key] != null ? (
                        <span className="flex items-center gap-0.5 justify-center">
                          <Star size={10} className="text-amber-400 fill-amber-400" />
                          {review.ratings[cat.key]}
                        </span>
                      ) : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                  ))}
                  <TableCell className="py-3">
                    <span className="flex items-center gap-1">
                      <Star size={11} className="text-amber-400 fill-amber-400" />
                      <span className="text-sm font-semibold">{avg.toFixed(1)}</span>
                    </span>
                  </TableCell>
                  <TableCell className="py-3 text-right pr-6">
                    <Button variant="ghost" size="sm" className="h-8">Szczegóły <ArrowRight size={14} className="ml-1" /></Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {!loading && reviews.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-sm text-muted-foreground">Brak wystawionych ocen.</p>
          </div>
        )}
      </Card>
    </div>
  );
}
