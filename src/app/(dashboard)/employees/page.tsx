'use client';

import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  UserPlus, 
  Download,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { MOCK_EMPLOYEES } from '@/data/mock-data';

export default function EmployeesPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEmployees = MOCK_EMPLOYEES.filter(emp => 
    `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge variant="success">Aktywny</Badge>;
      case 'inactive': return <Badge variant="destructive">Nieaktywny</Badge>;
      case 'on-leave': return <Badge variant="warning">Na urlopie</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pracownicy</h1>
          <p className="text-secondary mt-1">Zarządzaj zespołem i danymi pracowników.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Download size={18} className="mr-2" /> Eksportuj
          </Button>
          <Button variant="accent">
            <UserPlus size={18} className="mr-2" /> Nowy pracownik
          </Button>
        </div>
      </div>

      <Card className="border-none enterprise-shadow bg-card/60 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={18} />
              <Input 
                placeholder="Szukaj po imieniu, nazwisku lub dziale..." 
                className="pl-10 bg-background/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" className="shrink-0">
              <Filter size={18} className="mr-2" /> Filtry
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border text-secondary text-sm font-medium">
                  <th className="pb-4 pl-2">Pracownik</th>
                  <th className="pb-4">Dział / Stanowisko</th>
                  <th className="pb-4">Data dołączenia</th>
                  <th className="pb-4">Status</th>
                  <th className="pb-4 text-right pr-2">Akcje</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="group hover:bg-accent/5 transition-colors">
                    <td className="py-4 pl-2">
                      <div className="flex items-center gap-3">
                        <Avatar src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${emp.firstName}${emp.lastName}`} alt={emp.firstName} />
                        <div>
                          <p className="font-semibold text-sm">{emp.firstName} {emp.lastName}</p>
                          <p className="text-xs text-secondary">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <div>
                        <p className="text-sm font-medium">{emp.department}</p>
                        <p className="text-xs text-secondary">{emp.position}</p>
                      </div>
                    </td>
                    <td className="py-4 text-sm text-secondary">
                      {emp.startDate}
                    </td>
                    <td className="py-4">
                      {getStatusBadge(emp.status)}
                    </td>
                    <td className="py-4 text-right pr-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-secondary hover:text-accent">
                        <MoreHorizontal size={18} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredEmployees.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-secondary">Nie znaleziono pracowników spełniających kryteria.</p>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between border-t border-border pt-6">
            <p className="text-sm text-secondary">Pokazano {filteredEmployees.length} z {MOCK_EMPLOYEES.length} pracowników</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>Poprzednia</Button>
              <Button variant="outline" size="sm" className="bg-accent text-accent-foreground border-accent">1</Button>
              <Button variant="outline" size="sm">2</Button>
              <Button variant="outline" size="sm">Następna</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
