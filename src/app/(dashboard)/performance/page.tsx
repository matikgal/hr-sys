'use client';

import React, { useState, useEffect } from 'react';
import { 
  Star, 
  TrendingUp, 
  Plus,
  ArrowRight,
  Target
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
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import { getAllReviews, submitReview } from '@/services/db/performance';
import { getAllEmployees } from '@/services/db/employees';
import { Review, Employee } from '@/types';

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
import { Input } from "@/components/ui/input";

export default function PerformancePage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    employeeId: '',
    period: 'Q1 2024',
    ratings: {
      technical: 3,
      communication: 3,
      teamwork: 3
    },
    comments: '',
    status: 'submitted' as const
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reviewData, empData] = await Promise.all([
        getAllReviews(),
        getAllEmployees()
      ]);
      setReviews(reviewData);
      setEmployees(empData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await submitReview({
        ...formData,
        reviewerId: 'admin-id', // Mock reviewer
        date: new Date().toISOString().split('T')[0]
      });
      setIsDialogOpen(false);
      setFormData({
        employeeId: '',
        period: 'Q1 2024',
        ratings: { technical: 3, communication: 3, teamwork: 3 },
        comments: '',
        status: 'submitted'
      });
      await fetchData();
    } catch (error) {
      console.error("Error submitting review:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getEmployeeName = (id: string) => {
    const emp = employees.find(e => e.id === id);
    return emp ? `${emp.firstName} ${emp.lastName}` : `ID: ${id}`;
  };

  const radarData = [
    { subject: 'Techniczne', A: 85, fullMark: 100 },
    { subject: 'Komunikacja', A: 80, fullMark: 100 },
    { subject: 'Zespół', A: 90, fullMark: 100 },
    { subject: 'Cele', A: 75, fullMark: 100 },
    { subject: 'Rozwój', A: 70, fullMark: 100 },
  ];

  return (
    <div className="max-w-[1440px] mx-auto space-y-6 px-8 py-10 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Oceny i Wydajność</h1>
          <p className="text-sm text-muted-foreground mt-1">Zarządzaj cyklami ocen i śledź rozwój pracowników.</p>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-9">
                <Plus size={16} className="mr-2" /> Nowa ocena
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] shadow-2xl border-border">
              <form onSubmit={handleSubmitReview}>
                <DialogHeader>
                  <DialogTitle>Wystaw nową ocenę</DialogTitle>
                  <DialogDescription>
                    Wypełnij formularz oceny pracowniczej. Wszystkie dane zostaną zapisane w historii.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="employee">Pracownik</Label>
                    <select 
                      id="employee" 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      required
                      value={formData.employeeId}
                      onChange={e => setFormData({...formData, employeeId: e.target.value})}
                    >
                      <option value="">Wybierz pracownika...</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="period">Okres</Label>
                      <Input 
                        id="period" 
                        required 
                        value={formData.period}
                        onChange={e => setFormData({...formData, period: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-4 pt-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Oceny (1-5)</Label>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="tech" className="text-[10px]">Techniczne</Label>
                        <Input 
                          id="tech" type="number" min="1" max="5" 
                          value={formData.ratings.technical}
                          onChange={e => setFormData({
                            ...formData, 
                            ratings: {...formData.ratings, technical: parseInt(e.target.value)}
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="comm" className="text-[10px]">Komunikacja</Label>
                        <Input 
                          id="comm" type="number" min="1" max="5"
                          value={formData.ratings.communication}
                          onChange={e => setFormData({
                            ...formData, 
                            ratings: {...formData.ratings, communication: parseInt(e.target.value)}
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="team" className="text-[10px]">Zespół</Label>
                        <Input 
                          id="team" type="number" min="1" max="5"
                          value={formData.ratings.teamwork}
                          onChange={e => setFormData({
                            ...formData, 
                            ratings: {...formData.ratings, teamwork: parseInt(e.target.value)}
                          })}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="comments">Komentarz podsumowujący</Label>
                    <textarea 
                      id="comments" 
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      placeholder="Wpisz uzasadnienie oceny..."
                      value={formData.comments}
                      onChange={e => setFormData({...formData, comments: e.target.value})}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Anuluj</Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Zapisywanie..." : "Zatwierdź ocenę"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="shadow-none border-border lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="text-primary" size={18} /> Balans umiejętności
            </CardTitle>
            <CardDescription>Średnia ocena kompetencji w zespole</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar
                    name="Zespół"
                    dataKey="A"
                    stroke="#2563eb"
                    fill="#3b82f6"
                    fillOpacity={0.5}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none border-border lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="text-blue-600" size={18} /> Najwyżej oceniani
            </CardTitle>
            <CardDescription>Pracownicy z najlepszymi wynikami w tym kwartale</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 border border-border rounded-lg bg-card hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold">
                      {i === 1 ? 'JK' : i === 2 ? 'AN' : 'MZ'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{i === 1 ? 'Jan Kowalski' : i === 2 ? 'Anna Nowak' : 'Marek Zieliński'}</p>
                      <p className="text-xs text-muted-foreground">Software Engineer • IT</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star size={14} className="text-amber-500 fill-amber-500" />
                    <span className="text-sm font-bold">{4.8 + (i * -0.1)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

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
              <TableHead className="text-xs font-bold uppercase tracking-wider py-4">Średnia</TableHead>
              <TableHead className="text-right text-xs font-bold uppercase tracking-wider py-4 pr-6">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [1, 2, 3].map((i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5} className="py-4 px-6"><Skeleton className="h-10 w-full" /></TableCell>
                </TableRow>
              ))
            ) : reviews.map((review) => (
              <TableRow key={review.id} className="group transition-colors border-border">
                <TableCell className="py-3 pl-6 font-medium">
                  {getEmployeeName(review.employeeId)}
                </TableCell>
                <TableCell className="py-3">
                  {review.period}
                </TableCell>
                <TableCell className="py-3">
                  <Badge variant={review.status === 'submitted' ? 'default' : 'secondary'} className="text-[10px]">
                    {review.status === 'submitted' ? 'Zakończona' : 'Wersja robocza'}
                  </Badge>
                </TableCell>
                <TableCell className="py-3">
                  <div className="flex items-center gap-1">
                    <Star size={12} className="text-amber-500 fill-amber-500" />
                    <span>{(Object.values(review.ratings).reduce((a, b) => a + b, 0) / Object.values(review.ratings).length).toFixed(1)}</span>
                  </div>
                </TableCell>
                <TableCell className="py-3 text-right pr-6">
                  <Button variant="ghost" size="sm" className="h-8">Szczegóły <ArrowRight size={14} className="ml-1" /></Button>
                </TableCell>
              </TableRow>
            ))}
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
