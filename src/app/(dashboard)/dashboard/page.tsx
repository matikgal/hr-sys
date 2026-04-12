'use client';

import React from 'react';
import { 
  Users, 
  CalendarClock, 
  Briefcase, 
  TrendingUp, 
  Plus, 
  ArrowRight,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { MOCK_EMPLOYEES, MOCK_LEAVES } from '@/data/mock-data';

const stats = [
  { name: 'Razem pracowników', value: '124', icon: Users, change: '+4 w tym miesiącu', trend: 'up' },
  { name: 'Dzisiaj na urlopie', value: '8', icon: CalendarClock, change: '2 powroty jutro', trend: 'neutral' },
  { name: 'Aktywne rekrutacje', value: '12', icon: Briefcase, change: '3 nowe ogłoszenia', trend: 'up' },
  { name: 'Retencja', value: '94%', icon: TrendingUp, change: '+1.2% od zeszłego kwartału', trend: 'up' },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Witaj, Marcin!</h1>
          <p className="text-secondary mt-1">Oto co dzieje się dzisiaj w Twojej organizacji.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="enterprise-shadow">Generuj raport</Button>
          <Button variant="accent" className="enterprise-shadow">
            <Plus size={18} className="mr-2" /> Dodaj pracownika
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.name} className="overflow-hidden border-none bg-card/60 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-accent/10 rounded-lg text-accent">
                  <stat.icon size={24} />
                </div>
                <Badge variant={stat.trend === 'up' ? 'success' : 'secondary'} className="font-medium">
                  {stat.change}
                </Badge>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-secondary uppercase tracking-wider">{stat.name}</p>
                <p className="text-3xl font-bold mt-1">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pending Requests */}
        <Card className="lg:col-span-2 enterprise-shadow border-none bg-card/40 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Oczekujące wnioski</CardTitle>
              <CardDescription>Wnioski urlopowe wymagające Twojej uwagi.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-accent hover:text-accent">
              Zobacz wszystkie <ArrowRight size={14} className="ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {MOCK_LEAVES.filter(l => l.status === 'pending').map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 rounded-xl bg-background/50 border border-border/50 transition-all hover:border-accent/30 group">
                  <div className="flex items-center gap-4">
                    <Avatar alt={request.employeeName} fallback={request.employeeName.substring(0, 2)} />
                    <div>
                      <p className="font-semibold text-sm">{request.employeeName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-[10px]">{request.type}</Badge>
                        <span className="text-xs text-secondary flex items-center gap-1">
                          <Clock size={12} /> {request.startDate} - {request.endDate}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="outline" className="h-8 text-xs border-red-200 text-red-600 hover:bg-red-50">Odrzuć</Button>
                    <Button size="sm" variant="accent" className="h-8 text-xs">Zatwierdź</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions / Recent Activity */}
        <Card className="enterprise-shadow border-none bg-card/40 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Szybkie akcje</CardTitle>
            <CardDescription>Najczęściej używane narzędzia.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start h-12 border-border/50 bg-background/50 hover:bg-accent/10 hover:text-accent transition-all group">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center mr-3 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                <Plus size={18} />
              </div>
              Złóż wniosek o urlop
            </Button>
            <Button variant="outline" className="w-full justify-start h-12 border-border/50 bg-background/50 hover:bg-accent/10 hover:text-accent transition-all group">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center mr-3 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                <Briefcase size={18} />
              </div>
              Nowe ogłoszenie o pracę
            </Button>
            <Button variant="outline" className="w-full justify-start h-12 border-border/50 bg-background/50 hover:bg-accent/10 hover:text-accent transition-all group">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center mr-3 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                <Users size={18} />
              </div>
              Przegląd zespołu
            </Button>
          </CardContent>
          <div className="p-6 pt-0 mt-4">
             <div className="rounded-xl bg-accent/5 p-4 border border-accent/10">
                <p className="text-xs font-bold text-accent uppercase tracking-widest mb-2">Tip dnia</p>
                <p className="text-sm text-secondary leading-relaxed">
                  Pamiętaj o zatwierdzeniu planów urlopowych na nadchodzący kwartał do końca tego tygodnia.
                </p>
             </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
