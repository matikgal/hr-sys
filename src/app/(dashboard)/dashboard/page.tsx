'use client';

import React, { useState, useEffect } from 'react';
import { ActivityChart } from '@/components/features/dashboard/activity-chart';
import { RecentActivity } from '@/components/features/dashboard/recent-activity';
import { AnomaliesAlert } from '@/components/features/dashboard/anomalies-alert';
import { getDashboardStats, DashboardStats } from '@/services/db/system';
import { Button } from '@/components/ui/button';
import { 
  RefreshCw, 
  Plus, 
  Users, 
  Clock, 
  Calendar, 
  ArrowRight,
  TrendingUp,
  MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 pb-12 pt-4 px-6">
      {/* Crisp Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Panel główny</h1>
          <p className="text-sm text-neutral-500 mt-1">Przegląd operacyjny systemów HR</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchStats} 
            disabled={loading}
            className="h-9 rounded-md border-neutral-200 font-medium"
          >
            <RefreshCw size={14} className={cn("mr-2", loading && "animate-spin")} /> Odśwież
          </Button>
          <Button size="sm" className="h-9 rounded-md bg-black text-white hover:bg-neutral-800 font-medium">
            <Plus size={14} className="mr-2" /> Nowe zadanie
          </Button>
        </div>
      </header>

      {/* Stats Row - Professional & Integrated */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 border border-neutral-200 rounded-md divide-y sm:divide-y-0 sm:divide-x divide-neutral-200 overflow-hidden bg-white">
        <StatCell 
          label="Zatrudnieni" 
          value={stats?.totalEmployees || 0} 
          icon={<Users size={16} />} 
          trend="+2"
        />
        <StatCell 
          label="Obecność" 
          value={`${stats?.presentToday || 0}%`} 
          icon={<Clock size={16} />} 
          trend="Cel: 90%"
        />
        <StatCell 
          label="Wnioski" 
          value={stats?.pendingLeaves || 0} 
          icon={<Calendar size={16} />} 
          highlight={Number(stats?.pendingLeaves) > 0}
        />
        <StatCell 
          label="Rekrutacje" 
          value={stats?.activeRecruitments || 0} 
          icon={<TrendingUp size={16} />} 
        />
      </section>

      {/* Critical Alerts */}
      {stats?.anomalies && stats.anomalies.length > 0 && (
        <AnomaliesAlert anomalies={stats.anomalies} />
      )}

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Analytics & Table */}
        <div className="lg:col-span-8 space-y-8">
          {/* Chart Section */}
          <div className="bg-white border border-neutral-200 rounded-md overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/30">
              <h3 className="text-sm font-bold text-neutral-900">Analityka aktywności (7 dni)</h3>
              <MoreHorizontal size={16} className="text-neutral-400" />
            </div>
            <div className="p-6">
              <div className="h-[300px]">
                <ActivityChart data={stats?.chartData} loading={loading} />
              </div>
            </div>
          </div>

          {/* Task Table Style */}
          <div className="bg-white border border-neutral-200 rounded-md overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50/30">
              <h3 className="text-sm font-bold text-neutral-900">Zadania wymagające uwagi</h3>
            </div>
            <div className="divide-y divide-neutral-100">
              {[
                { name: 'Jan Kowalski', action: 'Wniosek o urlop', date: 'Dziś, 10:45', status: 'Pilne' },
                { name: 'Anna Nowak', action: 'Zaległe szkolenie BHP', date: 'Dziś, 08:30', status: 'W toku' },
                { name: 'Marek Zima', action: 'Przegląd okresowy', date: 'Wczoraj', status: 'Nowe' }
              ].map((task, i) => (
                <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-neutral-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="size-8 rounded bg-neutral-100 flex items-center justify-center text-xs font-bold text-neutral-600">
                      {task.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">{task.name}</p>
                      <p className="text-xs text-neutral-500">{task.action}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-xs text-neutral-400 font-medium">{task.date}</span>
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-tight",
                      task.status === 'Pilne' ? "bg-red-50 text-red-600 border-red-100" : "bg-neutral-50 text-neutral-600 border-neutral-200"
                    )}>
                      {task.status}
                    </span>
                    <Button variant="ghost" size="icon" className="size-8 text-neutral-400 hover:text-black">
                      <ArrowRight size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-6 py-3 border-t border-neutral-100 bg-neutral-50/30 text-center">
              <button className="text-xs font-bold text-neutral-500 hover:text-black transition-colors uppercase tracking-widest">
                Zobacz wszystkie zadania
              </button>
            </div>
          </div>
        </div>

        {/* Right: Activity Log */}
        <div className="lg:col-span-4">
          <div className="bg-white border border-neutral-200 rounded-md flex flex-col h-full min-h-[500px]">
            <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50/30 flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-tighter">Ostatnia aktywność</h3>
              <div className="flex items-center gap-1.5">
                <span className="size-1.5 bg-emerald-500 rounded-full"></span>
                <span className="text-[10px] font-bold text-neutral-400 uppercase">Live</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <RecentActivity activities={stats?.recentActivity} loading={loading} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCell({ label, value, icon, trend, highlight }: any) {
  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-2">
        <div className="text-neutral-400">{icon}</div>
        <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex items-baseline justify-between">
        <span className={cn(
          "text-3xl font-bold tracking-tight",
          highlight ? "text-red-600" : "text-neutral-900"
        )}>
          {value}
        </span>
        {trend && (
          <span className="text-[10px] font-bold bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded">
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
