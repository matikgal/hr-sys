'use client';

import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  UserPlus, 
  Download,
  Mail,
  Building2,
  Briefcase,
  Users,
  UserCheck,
  UserMinus,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import Link from 'next/link';
import { Employee, Department } from '@/types';
import { useEmployees, useEmployeesPaginated, useDepartments, useAddEmployee } from '@/hooks/use-employees';
import { cn } from '@/lib/utils';
import { exportToCsv } from '@/lib/export-csv';

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

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  departmentId: '',
  positionId: '',
  startDate: new Date().toISOString().split('T')[0],
  status: 'active' as Employee['status'],
};

export default function EmployeesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const {
    data: pagedData,
    isLoading: empLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useEmployeesPaginated();
  const employees = pagedData?.pages.flatMap(p => p.employees) ?? [];
  const { data: departments = [], isLoading: deptLoading } = useDepartments();
  const loading = empLoading || deptLoading;

  const addEmployeeMutation = useAddEmployee();
  const isSubmitting = addEmployeeMutation.isPending;

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addEmployeeMutation.mutateAsync({
        ...formData,
        metadata: { skills: [], languages: [] },
      });
      setIsDialogOpen(false);
      setFormData(EMPTY_FORM);
    } catch (error) {
      console.error('Error adding employee:', error);
    }
  };

  const getDepartmentName = (id: string) => {
    return departments.find(d => d.id === id)?.name || 'Nieznany';
  };

  const filteredEmployees = employees.filter(emp => 
    `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: Employee['status']) => {
    switch (status) {
      case 'active': 
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight bg-emerald-50 text-emerald-600 border border-emerald-100">Aktywny</span>;
      case 'inactive': 
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight bg-red-50 text-red-600 border border-red-100">Nieaktywny</span>;
      case 'on-leave': 
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight bg-amber-50 text-amber-600 border border-amber-100">Na urlopie</span>;
      default: 
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleRowClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsSheetOpen(true);
  };

  const stats = {
    total: employees.length,
    active: employees.filter(e => e.status === 'active').length,
    onLeave: employees.filter(e => e.status === 'on-leave').length,
    newThisMonth: 2 // Mock value
  };

  return (
    <div className="max-w-[1440px] mx-auto space-y-8 pb-12 px-8 py-10">
      {/* Crisp Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Katalog pracowników</h1>
          <p className="text-sm text-muted-foreground mt-1">Centralne repozytorium danych Twojego zespołu</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 rounded-md border-border font-medium"
            onClick={() => exportToCsv(`pracownicy_${new Date().toISOString().split('T')[0]}.csv`, employees.map(e => ({
              Imię: e.firstName,
              Nazwisko: e.lastName,
              Email: e.email,
              Dział: getDepartmentName(e.departmentId),
              Stanowisko: e.positionId,
              Status: e.status,
              'Data zatrudnienia': e.startDate,
            })))}>
            <Download size={14} className="mr-2" /> Eksportuj
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-9 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 font-medium">
                <UserPlus size={14} className="mr-2" /> Dodaj pracownika
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] border-border rounded-md">
              <form onSubmit={handleAddEmployee}>
                <DialogHeader>
                  <DialogTitle>Nowy pracownik</DialogTitle>
                  <DialogDescription>
                    Wprowadź dane podstawowe nowego pracownika.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-xs font-bold uppercase text-muted-foreground">Imię</Label>
                      <Input 
                        id="firstName" 
                        required 
                        placeholder="np. Jan" 
                        value={formData.firstName}
                        onChange={e => setFormData({...formData, firstName: e.target.value})}
                        className="rounded-md border-border h-9"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-xs font-bold uppercase text-muted-foreground">Nazwisko</Label>
                      <Input 
                        id="lastName" 
                        required 
                        placeholder="np. Kowalski" 
                        value={formData.lastName}
                        onChange={e => setFormData({...formData, lastName: e.target.value})}
                        className="rounded-md border-border h-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs font-bold uppercase text-muted-foreground">E-mail służbowy</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      required 
                      placeholder="jan.kowalski@hr.local" 
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      className="rounded-md border-border h-9"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="department" className="text-xs font-bold uppercase text-muted-foreground">Dział</Label>
                      <select 
                        id="department" 
                        className="flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                      <Label htmlFor="position" className="text-xs font-bold uppercase text-muted-foreground">Stanowisko</Label>
                      <Input 
                        id="position" 
                        required 
                        placeholder="np. Junior Developer" 
                        value={formData.positionId}
                        onChange={e => setFormData({...formData, positionId: e.target.value})}
                        className="rounded-md border-border h-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="startDate" className="text-xs font-bold uppercase text-muted-foreground">Data rozpoczęcia</Label>
                    <Input 
                      id="startDate" 
                      type="date" 
                      required 
                      value={formData.startDate}
                      onChange={e => setFormData({...formData, startDate: e.target.value})}
                      className="rounded-md border-border h-9"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" className="h-9 rounded-md" onClick={() => setIsDialogOpen(false)}>Anuluj</Button>
                  <Button type="submit" disabled={isSubmitting} className="h-9 rounded-md bg-primary text-primary-foreground hover:bg-primary/90">
                    {isSubmitting ? "Zapisywanie..." : "Dodaj pracownika"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Stats Row */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 border border-border rounded-md divide-y sm:divide-y-0 sm:divide-x divide-border overflow-hidden bg-card">
        <StatCell label="Wszyscy pracownicy" value={stats.total} icon={<Users size={16} />} />
        <StatCell label="Aktywni" value={stats.active} icon={<UserCheck size={16} />} />
        <StatCell label="Na urlopie" value={stats.onLeave} icon={<UserMinus size={16} />} highlight={stats.onLeave > 0} />
        <StatCell label="Nowi (ten miesiąc)" value={stats.newThisMonth} icon={<TrendingUp size={16} />} trend="+15%" />
      </section>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input 
            placeholder="Szukaj po nazwisku..." 
            className="pl-10 border-border rounded-md h-9 text-sm focus:ring-0 focus:border-foreground"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" size="sm" className="h-9 rounded-md border-border">
          <Filter size={14} className="mr-2" /> Filtrowanie
        </Button>
      </div>

      {/* Employee Table */}
      <div className="bg-card border border-border rounded-md overflow-hidden">
        <Table>
          <TableHeader className="bg-accent/50">
            <TableRow className="hover:bg-transparent border-border">
              <TableHead className="w-[300px] text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3 pl-6">Pracownik</TableHead>
              <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3">Dział / Stanowisko</TableHead>
              <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3">Data rozpoczęcia</TableHead>
              <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3">Status</TableHead>
              <TableHead className="text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3 pr-6">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [1, 2, 3, 4, 5].map((i) => (
                <TableRow key={i} className="border-border/50">
                  <TableCell colSpan={5} className="py-4 px-6"><Skeleton className="h-10 w-full" /></TableCell>
                </TableRow>
              ))
            ) : filteredEmployees.map((emp) => (
              <TableRow 
                key={emp.id} 
                className="group cursor-pointer hover:bg-accent/50 transition-colors border-border/50"
                onClick={() => handleRowClick(emp)}
              >
                <TableCell className="py-3 pl-6">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 border border-border rounded-md">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${emp.firstName}${emp.lastName}`} />
                      <AvatarFallback className="rounded-md">{emp.firstName[0]}{emp.lastName[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-foreground leading-tight">{emp.firstName} {emp.lastName}</span>
                      <span className="text-[11px] text-muted-foreground mt-0.5">{emp.email}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground/80">{getDepartmentName(emp.departmentId)}</span>
                    <span className="text-[11px] text-muted-foreground mt-0.5">{emp.positionId}</span>
                  </div>
                </TableCell>
                <TableCell className="py-3 text-sm text-muted-foreground font-medium">
                  {emp.startDate}
                </TableCell>
                <TableCell className="py-3">
                  {getStatusBadge(emp.status)}
                </TableCell>
                <TableCell className="py-3 text-right pr-6" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/employees/${emp.id}`} onClick={e => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md">
                        <ArrowRight size={14} />
                      </Button>
                    </Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md">
                          <MoreHorizontal size={14} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40 border-border">
                        <DropdownMenuItem onClick={() => handleRowClick(emp)}>Podgląd profilu</DropdownMenuItem>
                        <DropdownMenuItem>Edytuj dane</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">Dezaktywuj</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!loading && filteredEmployees.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-sm font-medium text-muted-foreground">Nie znaleziono pracowników.</p>
          </div>
        )}
        {hasNextPage && !searchTerm && (
          <div className="flex justify-center py-4 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
              {isFetchingNextPage ? 'Ładowanie…' : 'Załaduj więcej'}
            </Button>
          </div>
        )}
      </div>

      {/* Employee Details Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="sm:max-w-md border-border">
          {selectedEmployee && (
            <div className="space-y-8 py-4">
              <SheetHeader className="text-left">
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14 border border-border rounded-md">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedEmployee.firstName}${selectedEmployee.lastName}`} />
                    <AvatarFallback className="rounded-md">{selectedEmployee.firstName[0]}{selectedEmployee.lastName[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <SheetTitle className="text-lg font-bold text-foreground">{selectedEmployee.firstName} {selectedEmployee.lastName}</SheetTitle>
                    <SheetDescription className="flex items-center gap-1.5 mt-0.5 text-xs">
                      <Briefcase size={12} /> {selectedEmployee.positionId}
                    </SheetDescription>
                    <div className="mt-2">{getStatusBadge(selectedEmployee.status)}</div>
                  </div>
                </div>
              </SheetHeader>

              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-9 bg-muted p-1 rounded-md">
                  <TabsTrigger value="info" className="text-xs rounded-sm data-[state=active]:bg-card data-[state=active]:shadow-none">Informacje</TabsTrigger>
                  <TabsTrigger value="metadata" className="text-xs rounded-sm data-[state=active]:bg-card data-[state=active]:shadow-none">Dodatkowe</TabsTrigger>
                </TabsList>
                
                <TabsContent value="info" className="space-y-6 pt-6">
                  <div className="grid gap-4">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="size-8 rounded-md bg-muted border border-border/50 flex items-center justify-center text-muted-foreground">
                        <Mail size={14} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider leading-none mb-1">E-mail</span>
                        <span className="font-medium text-foreground">{selectedEmployee.email}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="size-8 rounded-md bg-muted border border-border/50 flex items-center justify-center text-muted-foreground">
                        <Building2 size={14} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider leading-none mb-1">Dział</span>
                        <span className="font-medium text-foreground">{getDepartmentName(selectedEmployee.departmentId)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-border/50">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-foreground mb-4">Szybkie akcje</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" className="h-9 rounded-md justify-start border-border">
                        <Mail className="mr-2 h-4 w-4" /> Wiadomość
                      </Button>
                      <Button variant="outline" size="sm" className="h-9 rounded-md justify-start border-border">
                        <TrendingUp className="mr-2 h-4 w-4" /> Rozwój
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="metadata" className="space-y-6 pt-6">
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3">Umiejętności</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedEmployee.metadata?.skills?.map((skill: string) => (
                        <span key={skill} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-muted text-foreground/70 border border-border uppercase tracking-tight">
                          {skill}
                        </span>
                      )) || <span className="text-xs text-muted-foreground italic">Brak danych</span>}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="pt-6 border-t border-border/50 flex justify-end gap-2">
                <Button variant="ghost" className="h-9 rounded-md text-sm" onClick={() => setIsSheetOpen(false)}>Zamknij</Button>
                <Link href={selectedEmployee ? `/employees/${selectedEmployee.id}` : '#'}>
                  <Button className="h-9 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm">Pełny profil</Button>
                </Link>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function StatCell({ label, value, icon, trend, highlight }: any) {
  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-2">
        <div className="text-muted-foreground">{icon}</div>
        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex items-baseline justify-between">
        <span className={cn(
          "text-3xl font-bold tracking-tight",
          highlight ? "text-red-600" : "text-foreground"
        )}>
          {value}
        </span>
        {trend && (
          <span className="text-[10px] font-bold bg-muted text-foreground/70 px-1.5 py-0.5 rounded">
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
