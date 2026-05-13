'use client';

import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Search, 
  Filter, 
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  CalendarCheck
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet";
import { Leave, LeaveBalance, Employee } from '@/types';
import { useAuth } from '@/context/auth-context';
import { useLeaves, useLeaveBalance, useRequestLeave, useApproveLeave, useRejectLeave } from '@/hooks/use-leaves';
import { exportToCsv } from '@/lib/export-csv';
import { useEmployeeByAuthId } from '@/hooks/use-employees';
import { format, differenceInBusinessDays, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameDay } from 'date-fns';
import { pl } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LeavesPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: 'vacation' as Leave['type'],
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });
  const [error, setError] = useState<string | null>(null);

  const { data: currentEmployee } = useEmployeeByAuthId(user?.uid);
  const empId = currentEmployee?.id ?? 'EMP-001';

  const { data: leaves = [], isLoading: leavesLoading } = useLeaves();
  const { data: balance, isLoading: balanceLoading } = useLeaveBalance(empId);
  const loading = leavesLoading || balanceLoading;

  const requestLeaveMutation = useRequestLeave();
  const approveMutation = useApproveLeave();
  const rejectMutation = useRejectLeave();

  const canManageLeaves = user?.role === 'admin' || user?.role === 'hr' || user?.role === 'manager';

  const filteredLeaves = leaves.filter(l => 
    l.employeeName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: Leave['status']) => {
    switch (status) {
      case 'approved': return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 shadow-none"><CheckCircle2 size={12} className="mr-1" /> Zatwierdzony</Badge>;
      case 'auto_approved': return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 shadow-none"><CheckCircle2 size={12} className="mr-1" /> Auto-zatwierdzony</Badge>;
      case 'rejected': return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-100 shadow-none"><XCircle size={12} className="mr-1" /> Odrzucony</Badge>;
      case 'pending': return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-100 shadow-none"><Clock size={12} className="mr-1" /> Oczekujący</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: Leave['type']) => {
    const types: Record<string, string> = {
      vacation: 'Wypoczynkowy',
      sick: 'Chorobowy',
      paternity: 'Ojcowski',
      unpaid: 'Bezpłatny'
    };
    return <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-tighter">{types[type] || type}</Badge>;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const start = parseISO(formData.startDate);
      const end = parseISO(formData.endDate);
      if (end < start) throw new Error('Data zakończenia nie może być wcześniejsza niż data rozpoczęcia.');

      const daysCount = differenceInBusinessDays(end, start) + 1;
      const employeeName = currentEmployee
        ? `${currentEmployee.firstName} ${currentEmployee.lastName}`
        : (user?.displayName || user?.email || 'Pracownik');

      await requestLeaveMutation.mutateAsync({
        employeeId: empId,
        employeeName,
        type: formData.type,
        startDate: formData.startDate,
        endDate: formData.endDate,
        daysCount,
        createdAt: new Date().toISOString(),
      });

      setIsSheetOpen(false);
    } catch (err: any) {
      setError(err.message || 'Wystąpił błąd podczas składania wniosku.');
    }
  };

  const isSubmitting = requestLeaveMutation.isPending;

  const vacationPercent = balance ? (balance.vacationUsed / balance.vacationTotal) * 100 : 0;

  return (
    <div className="max-w-[1440px] mx-auto space-y-6 px-8 py-10 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Wnioski urlopowe</h1>
          <p className="text-sm text-muted-foreground mt-1">Zarządzaj nieobecnościami i planuj grafik zespołu.</p>
        </div>
        <div className="flex items-center gap-3">
          {canManageLeaves && (
            <Button variant="outline" size="sm" className="h-9"
              onClick={() => exportToCsv(`urlopy_${new Date().toISOString().split('T')[0]}.csv`, leaves.map(l => ({
                Pracownik: l.employeeName ?? l.employeeId,
                Typ: l.type,
                'Data od': l.startDate,
                'Data do': l.endDate,
                'Liczba dni': l.daysCount,
                Status: l.status,
                'Data złożenia': l.createdAt,
              })))}>
              <FileText size={14} className="mr-2" /> Eksportuj CSV
            </Button>
          )}
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button size="sm" className="h-9">
                <Plus size={16} className="mr-2" /> Nowy wniosek
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[400px] sm:w-[540px]">
              <SheetHeader>
                <SheetTitle>Nowy wniosek urlopowy</SheetTitle>
                <SheetDescription>
                  Wypełnij poniższe pola, aby złożyć wniosek o urlop.
                </SheetDescription>
              </SheetHeader>
              <form onSubmit={handleSubmit} className="space-y-6 py-6">
                <div className="space-y-2">
                  <Label htmlFor="type">Typ urlopu</Label>
                  <select 
                    id="type"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as Leave['type']})}
                  >
                    <option value="vacation">Wypoczynkowy</option>
                    <option value="sick">Chorobowy</option>
                    <option value="paternity">Ojcowski</option>
                    <option value="unpaid">Bezpłatny</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Data rozpoczęcia</Label>
                    <Input 
                      id="startDate" 
                      type="date" 
                      value={formData.startDate}
                      onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">Data zakończenia</Label>
                    <Input 
                      id="endDate" 
                      type="date" 
                      value={formData.endDate}
                      onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                      required 
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-md flex items-center gap-2 text-red-700 text-sm">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </div>
                )}

                <SheetFooter>
                  <Button type="button" variant="outline" onClick={() => setIsSheetOpen(false)}>Anuluj</Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Wysyłanie..." : "Złóż wniosek"}
                  </Button>
                </SheetFooter>
              </form>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-none border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CalendarCheck className="text-blue-600" size={18} /> Saldo urlopowe
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-20 w-full" /> : (
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-2xl font-bold">{balance ? balance.vacationTotal - balance.vacationUsed : 0}</span>
                  <span className="text-sm text-muted-foreground">dni pozostało</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Wykorzystano: {balance?.vacationUsed || 0} dni</span>
                    <span>Razem: {balance?.vacationTotal || 0} dni</span>
                  </div>
                  <Progress value={vacationPercent} className="h-2" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-none border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="text-amber-600" size={18} /> W oczekiwaniu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leaves.filter(l => l.status === 'pending').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Wnioski wymagające decyzji</p>
          </CardContent>
        </Card>

        <Card className="shadow-none border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="text-emerald-600" size={18} /> Dzisiejsze nieobecności
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leaves.filter(l => {
                const today = format(new Date(), 'yyyy-MM-dd');
                return (l.status === 'approved' || l.status === 'auto_approved') && 
                       today >= l.startDate && today <= l.endDate;
              }).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Osób przebywających na urlopie</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="list">
        <TabsList className="bg-background border border-border rounded-xl p-1 h-auto gap-1 mb-4">
          <TabsTrigger value="list" className="text-[13px] font-medium px-4 py-2 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground">
            Lista
          </TabsTrigger>
          <TabsTrigger value="calendar" className="text-[13px] font-medium px-4 py-2 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground">
            Kalendarz zespołu
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                placeholder="Szukaj pracownika..."
                className="pl-10 bg-card border-border shadow-none h-10 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm" className="h-10 px-4">
              <Filter size={16} className="mr-2" /> Filtrowanie
            </Button>
          </div>

          <Card className="shadow-none border-border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-bold uppercase tracking-wider py-4 pl-6">Pracownik</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider py-4">Typ urlopu</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider py-4">Okres</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider py-4">Dni</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider py-4">Status</TableHead>
                  <TableHead className="text-right text-xs font-bold uppercase tracking-wider py-4 pr-6">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [1, 2, 3, 4, 5].map((i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6} className="py-4 px-6"><Skeleton className="h-10 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredLeaves.map((leave) => (
                  <TableRow key={leave.id} className="group transition-colors border-border">
                    <TableCell className="py-3 pl-6">
                      <span className="text-sm font-semibold">{leave.employeeName || 'Nieznany'}</span>
                    </TableCell>
                    <TableCell className="py-3">{getTypeBadge(leave.type)}</TableCell>
                    <TableCell className="py-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <CalendarIcon size={14} />
                        <span>{format(parseISO(leave.startDate), 'dd MMM yyyy', { locale: pl })} – {format(parseISO(leave.endDate), 'dd MMM yyyy', { locale: pl })}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 text-sm">{leave.daysCount}</TableCell>
                    <TableCell className="py-3">{getStatusBadge(leave.status)}</TableCell>
                    <TableCell className="py-3 text-right pr-6">
                      {canManageLeaves && leave.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs text-red-600 border-red-200 hover:bg-red-50"
                            disabled={rejectMutation.isPending}
                            onClick={() => rejectMutation.mutate({ leaveId: leave.id, approverId: user!.uid })}
                          >
                            <XCircle size={13} className="mr-1" /> Odrzuć
                          </Button>
                          <Button
                            size="sm"
                            className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                            disabled={approveMutation.isPending}
                            onClick={() => approveMutation.mutate({ leaveId: leave.id, approverId: user!.uid })}
                          >
                            <CheckCircle2 size={13} className="mr-1" /> Zatwierdź
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {!loading && filteredLeaves.length === 0 && (
              <div className="py-20 text-center">
                <FileText size={48} className="text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">Brak wniosków urlopowych.</p>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="calendar">
          <TeamCalendar leaves={leaves} loading={loading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ---- Team Calendar ---- */
const DAY_NAMES = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'];

function TeamCalendar({ leaves, loading }: { leaves: Leave[]; loading: boolean }) {
  const [month, setMonth] = useState(new Date());

  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
  // Monday-first: getDay returns 0=Sun, map to Mon-first offset
  const startOffset = ((getDay(days[0]) + 6) % 7);

  const activeLeaves = leaves.filter(l => l.status === 'approved' || l.status === 'auto_approved' || l.status === 'pending');

  const getLeavesForDay = (day: Date) => {
    const ds = format(day, 'yyyy-MM-dd');
    return activeLeaves.filter(l => ds >= l.startDate && ds <= l.endDate);
  };

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border/60 flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-foreground capitalize">
          {format(month, 'LLLL yyyy', { locale: pl })}
        </h3>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-3 text-[12px] text-muted-foreground mr-4">
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-[#0a6b3e]" /> Zatwierdzone</span>
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-amber-400" /> Oczekujące</span>
          </div>
          <button onClick={() => setMonth(m => subMonths(m, 1))} className="size-8 flex items-center justify-center rounded-lg border border-border bg-card hover:bg-accent transition-colors">
            <ChevronLeft size={15} />
          </button>
          <button onClick={() => setMonth(new Date())} className="h-8 px-3 text-[12px] rounded-lg border border-border bg-card hover:bg-accent transition-colors font-medium">
            Dziś
          </button>
          <button onClick={() => setMonth(m => addMonths(m, 1))} className="size-8 flex items-center justify-center rounded-lg border border-border bg-card hover:bg-accent transition-colors">
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-6"><Skeleton className="h-64 w-full rounded-lg" /></div>
      ) : (
        <div className="p-4">
          {/* Day names */}
          <div className="grid grid-cols-7 mb-2">
            {DAY_NAMES.map(d => (
              <div key={d} className="text-center text-[11px] font-medium text-muted-foreground py-2">{d}</div>
            ))}
          </div>
          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: startOffset }).map((_, i) => <div key={`empty-${i}`} />)}
            {days.map(day => {
              const dayLeaves = getLeavesForDay(day);
              const isToday = isSameDay(day, new Date());
              return (
                <div key={day.toISOString()} className={cn(
                  'min-h-[72px] rounded-lg p-1.5 border',
                  isToday ? 'border-[#0a6b3e] bg-[#e6f1ea]/40' : 'border-border/40 bg-background/40',
                )}>
                  <div className={cn(
                    'text-[11px] font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full',
                    isToday ? 'bg-[#0a6b3e] text-white' : 'text-muted-foreground',
                  )}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-0.5">
                    {dayLeaves.slice(0, 3).map(l => (
                      <div key={l.id} className={cn(
                        'text-[9px] font-medium px-1 py-0.5 rounded truncate',
                        l.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-[#e6f1ea] text-[#064a2a]',
                      )}>
                        {l.employeeName?.split(' ')[0] ?? '—'}
                      </div>
                    ))}
                    {dayLeaves.length > 3 && (
                      <div className="text-[9px] text-muted-foreground px-1">+{dayLeaves.length - 3}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
