'use client';

import React, { useState } from 'react';
import { 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Plus, 
  LayoutGrid, 
  List 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { MOCK_LEAVES } from '@/data/mock-data';
import { cn } from '@/lib/utils';

export default function LeavesPage() {
  const [activeTab, setActiveTab] = useState<'team' | 'my'>('team');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge variant="success">Zatwierdzony</Badge>;
      case 'rejected': return <Badge variant="destructive">Odrzucony</Badge>;
      case 'pending': return <Badge variant="warning">Oczekujący</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Urlopy</h1>
          <p className="text-secondary mt-1">Zarządzaj wnioskami o wolne i czasem pracy.</p>
        </div>
        <Button variant="accent">
          <Plus size={18} className="mr-2" /> Nowy wniosek
        </Button>
      </div>

      <div className="flex items-center gap-1 p-1 bg-card/60 rounded-xl enterprise-shadow w-fit">
        <button
          onClick={() => setActiveTab('team')}
          className={cn(
            "px-6 py-2 rounded-lg text-sm font-medium transition-all",
            activeTab === 'team' ? "bg-background text-accent shadow-sm" : "text-secondary hover:text-accent/70"
          )}
        >
          Wnioski zespołu
        </button>
        <button
          onClick={() => setActiveTab('my')}
          className={cn(
            "px-6 py-2 rounded-lg text-sm font-medium transition-all",
            activeTab === 'my' ? "bg-background text-accent shadow-sm" : "text-secondary hover:text-accent/70"
          )}
        >
          Moje wnioski
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Leave Summary Cards */}
        <Card className="border-none enterprise-shadow bg-blue-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-white/80 uppercase tracking-wider">Pozostały urlop</p>
              <Calendar size={20} className="text-white/60" />
            </div>
            <p className="text-3xl font-bold mt-2">18 dni</p>
            <p className="text-xs mt-4 text-white/70">Z 26 dni dostępnych w 2026</p>
          </CardContent>
        </Card>
        
        <Card className="border-none enterprise-shadow bg-card/60">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-secondary uppercase tracking-wider">Wnioski w toku</p>
              <Clock size={20} className="text-accent" />
            </div>
            <p className="text-3xl font-bold mt-2">3</p>
            <p className="text-xs mt-4 text-secondary">Oczekują na Twoją akceptację</p>
          </CardContent>
        </Card>

        <Card className="border-none enterprise-shadow bg-card/60">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-secondary uppercase tracking-wider">Na urlopie dzisiaj</p>
              <Avatar src="" fallback="8" className="bg-emerald-500/10 text-emerald-600 border-none" />
            </div>
            <p className="text-3xl font-bold mt-2">8 osób</p>
            <p className="text-xs mt-4 text-secondary">Z Twojego działu (Marketing)</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none enterprise-shadow bg-card/60 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{activeTab === 'team' ? 'Historia wniosków zespołu' : 'Twoja historia urlopów'}</CardTitle>
            <CardDescription>Pełne zestawienie wszystkich zgłoszonych wniosków.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-secondary">
              <LayoutGrid size={18} />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-accent bg-accent/10">
              <List size={18} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {MOCK_LEAVES.map((leaf) => (
              <div key={leaf.id} className="flex flex-col md:flex-row md:items-center justify-between p-5 rounded-xl bg-background/50 border border-border/50 group transition-all hover:border-accent/30">
                <div className="flex items-center gap-5">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                    leaf.type === 'Vacation' ? "bg-blue-500/10 text-blue-600" :
                    leaf.type === 'Sick Leave' ? "bg-red-500/10 text-red-600" :
                    "bg-emerald-500/10 text-emerald-600"
                  )}>
                    <Calendar size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-foreground">{leaf.employeeName}</p>
                      <Badge variant="secondary" className="text-[10px] font-bold">{leaf.type}</Badge>
                    </div>
                    <p className="text-sm text-secondary mt-1">{leaf.reason}</p>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center gap-8 mt-4 md:mt-0">
                  <div className="flex flex-col text-right">
                    <p className="text-xs text-secondary uppercase font-bold tracking-widest">Termin</p>
                    <p className="text-sm font-semibold">{leaf.startDate} - {leaf.endDate}</p>
                  </div>
                  
                  <div className="flex flex-col md:items-end gap-2">
                    {getStatusBadge(leaf.status)}
                  </div>

                  {leaf.status === 'pending' && (
                    <div className="flex items-center gap-2 pt-2 md:pt-0">
                      <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50 h-9 w-9">
                        <XCircle size={20} />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-emerald-500 hover:bg-emerald-50 h-9 w-9">
                        <CheckCircle2 size={20} />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
