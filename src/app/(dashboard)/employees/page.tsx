'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  UserPlus, 
  Download,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Briefcase,
  Building2,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { getAllEmployees, addEmployee } from '@/services/db/employees';
import { getDepartments } from '@/services/db/system';
import { Employee, Department } from '@/types';

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

export default function EmployeesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    departmentId: '',
    positionId: '',
    startDate: new Date().toISOString().split('T')[0],
    status: 'active' as Employee['status']
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [empData, deptData] = await Promise.all([
        getAllEmployees(),
        getDepartments()
      ]);
      setEmployees(empData);
      setDepartments(deptData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addEmployee({
        ...formData,
        metadata: { skills: [], languages: [] }
      });
      setIsDialogOpen(false);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        departmentId: '',
        positionId: '',
        startDate: new Date().toISOString().split('T')[0],
        status: 'active'
      });
      await fetchData();
    } catch (error) {
      console.error("Error adding employee:", error);
    } finally {
      setIsSubmitting(false);
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
      case 'active': return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 shadow-none">Aktywny</Badge>;
      case 'inactive': return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-100 shadow-none">Nieaktywny</Badge>;
      case 'on-leave': return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-100 shadow-none">Na urlopie</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleRowClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsSheetOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Katalog pracowników</h1>
          <p className="text-sm text-muted-foreground mt-1">Centralne repozytorium danych Twojego zespołu.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="h-9">
            <Download size={16} className="mr-2" /> Eksportuj
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-9">
                <UserPlus size={16} className="mr-2" /> Dodaj pracownika
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] shadow-2xl border-border">
              <form onSubmit={handleAddEmployee}>
                <DialogHeader>
                  <DialogTitle>Nowy pracownik</DialogTitle>
                  <DialogDescription>
                    Wprowadź dane podstawowe nowego pracownika, aby dodać go do systemu HR Nexus.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Imię</Label>
                      <Input 
                        id="firstName" 
                        required 
                        placeholder="np. Jan" 
                        value={formData.firstName}
                        onChange={e => setFormData({...formData, firstName: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Nazwisko</Label>
                      <Input 
                        id="lastName" 
                        required 
                        placeholder="np. Kowalski" 
                        value={formData.lastName}
                        onChange={e => setFormData({...formData, lastName: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail służbowy</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      required 
                      placeholder="jan.kowalski@hr.local" 
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="department">Dział</Label>
                      <select 
                        id="department" 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                      <Label htmlFor="position">Stanowisko</Label>
                      <Input 
                        id="position" 
                        required 
                        placeholder="np. Junior Developer" 
                        value={formData.positionId}
                        onChange={e => setFormData({...formData, positionId: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Data rozpoczęcia</Label>
                    <Input 
                      id="startDate" 
                      type="date" 
                      required 
                      value={formData.startDate}
                      onChange={e => setFormData({...formData, startDate: e.target.value})}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Anuluj</Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Zapisywanie..." : "Dodaj pracownika"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input 
            placeholder="Szukaj po nazwisku..." 
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
              <TableHead className="w-[300px] text-xs font-bold uppercase tracking-wider py-4 pl-6">Pracownik</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider py-4">Dział / Stanowisko</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider py-4">Data rozpoczęcia</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider py-4">Status</TableHead>
              <TableHead className="text-right text-xs font-bold uppercase tracking-wider py-4 pr-6">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [1, 2, 3, 4, 5].map((i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5} className="py-4 px-6"><Skeleton className="h-10 w-full" /></TableCell>
                </TableRow>
              ))
            ) : filteredEmployees.map((emp) => (
              <TableRow 
                key={emp.id} 
                className="group cursor-pointer transition-colors border-border hover:bg-muted/50"
                onClick={() => handleRowClick(emp)}
              >
                <TableCell className="py-3 pl-6">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border border-border">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${emp.firstName}${emp.lastName}`} />
                      <AvatarFallback>{emp.firstName[0]}{emp.lastName[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-foreground leading-tight">{emp.firstName} {emp.lastName}</span>
                      <span className="text-xs text-muted-foreground mt-0.5">{emp.email}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">{getDepartmentName(emp.departmentId)}</span>
                    <span className="text-xs text-muted-foreground mt-0.5">{emp.positionId}</span>
                  </div>
                </TableCell>
                <TableCell className="py-3 text-sm text-muted-foreground font-medium">
                  {emp.startDate}
                </TableCell>
                <TableCell className="py-3">
                  {getStatusBadge(emp.status)}
                </TableCell>
                <TableCell className="py-3 text-right pr-6" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <MoreHorizontal size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={() => handleRowClick(emp)}>Podgląd profilu</DropdownMenuItem>
                      <DropdownMenuItem>Edytuj dane</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">Dezaktywuj</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!loading && filteredEmployees.length === 0 && (
          <div className="py-20 text-center text-sm text-muted-foreground">Nie znaleziono pracowników.</div>
        )}
      </Card>

      {/* Employee Details Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
          {selectedEmployee && (
            <div className="space-y-6 py-4">
              <SheetHeader className="text-left">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-2 border-primary/10">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedEmployee.firstName}${selectedEmployee.lastName}`} />
                    <AvatarFallback>{selectedEmployee.firstName[0]}{selectedEmployee.lastName[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <SheetTitle className="text-xl font-bold">{selectedEmployee.firstName} {selectedEmployee.lastName}</SheetTitle>
                    <SheetDescription className="flex items-center gap-1.5 mt-1">
                      <Briefcase size={14} /> {selectedEmployee.positionId}
                    </SheetDescription>
                    <div className="mt-2">{getStatusBadge(selectedEmployee.status)}</div>
                  </div>
                </div>
              </SheetHeader>

              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="info">Informacje</TabsTrigger>
                  <TabsTrigger value="metadata">Dodatkowe</TabsTrigger>
                </TabsList>
                
                <TabsContent value="info" className="space-y-4 pt-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="text-muted-foreground" size={16} />
                      <span>{selectedEmployee.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Building2 className="text-muted-foreground" size={16} />
                      <span>{getDepartmentName(selectedEmployee.departmentId)}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="text-muted-foreground" size={16} />
                      <span>Dołączył(a): {selectedEmployee.startDate}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <h4 className="text-sm font-semibold mb-3">Szybkie akcje</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" className="justify-start">
                        <Mail className="mr-2 h-4 w-4" /> E-mail
                      </Button>
                      <Button variant="outline" size="sm" className="justify-start">
                        <Clock className="mr-2 h-4 w-4" /> Grafik
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="metadata" className="space-y-4 pt-4">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Umiejętności</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedEmployee.metadata?.skills?.map((skill: string) => (
                        <Badge key={skill} variant="secondary" className="text-[10px]">{skill}</Badge>
                      )) || <span className="text-sm text-muted-foreground">Brak danych</span>}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Języki</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedEmployee.metadata?.languages?.map((lang: string) => (
                        <Badge key={lang} variant="secondary" className="text-[10px]">{lang}</Badge>
                      )) || <span className="text-sm text-muted-foreground">Brak danych</span>}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="pt-6 mt-6 border-t border-border flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setIsSheetOpen(false)}>Zamknij</Button>
                <Button>Pełny profil</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
