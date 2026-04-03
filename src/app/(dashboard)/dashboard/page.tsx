'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  ArrowUpRight, 
  ArrowRight,
  TrendingUp,
  AlertCircle
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
    <div className="space-y-10 pb-20 max-w-7xl mx-auto">
      {/* Friendly Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-black">Witaj ponownie, Admin</h1>
          <p className="text-neutral-500 mt-1 font-medium">Sprawdź, co dzieje się dzisiaj w Twoim zespole.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchStats} disabled={loading} className="h-11 px-5 rounded-xl border-neutral-200 font-semibold hover:bg-neutral-50">
            <RefreshCw size={16} className={cn("mr-2", loading && "animate-spin")} /> Aktualizuj
          </Button>
          <Button size="sm" className="h-11 px-5 rounded-xl font-semibold bg-black text-white hover:bg-neutral-800 shadow-lg shadow-neutral-200">
            <Plus size={16} className="mr-2" /> Nowe zadanie
          </Button>
        </div>
      </div>

      {/* Critical Alerts - Softer version */}
      {stats?.anomalies && stats.anomalies.length > 0 && (
        <section className="animate-in fade-in slide-in-from-top-4 duration-500">
          <AnomaliesAlert anomalies={stats.anomalies} />
        </section>
      )}

      {/* Key Metrics - Soft Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          label="Zatrudnieni" 
          value={stats?.totalEmployees || 0} 
          sub="Aktywne umowy" 
          icon={<Users size={20} />}
          trend="+2 w tym msc"
        />
        <MetricCard 
          label="Dzisiejsza obecność" 
          value={stats?.presentToday || 0} 
          sub="Osoby w biurze/zdalnie" 
          icon={<Clock size={20} />}
          trend="94%"
          trendPositive
        />
        <MetricCard 
          label="Wnioski urlopowe" 
          value={stats?.pendingLeaves || 0} 
          sub="Oczekują na akceptację" 
          icon={<Calendar size={20} />}
          highlight={Number(stats?.pendingLeaves) > 0}
        />
        <MetricCard 
          label="Rekrutacje" 
          value={stats?.activeRecruitments || 0} 
          sub="Otwarte procesy" 
          icon={<TrendingUp size={20} />}
        />
      </section>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Activity Chart Container */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-bold text-black">Analityka aktywności</h3>
                <p className="text-sm text-neutral-500 font-medium">Suma godzin pracy w ostatnim tygodniu</p>
              </div>
              <div className="size-10 bg-neutral-50 rounded-xl flex items-center justify-center text-neutral-400">
                <TrendingUp size={20} />
              </div>
            </div>
            <div className="h-[350px]">
              <ActivityChart data={stats?.chartData} loading={loading} />
            </div>
          </div>

          {/* Tasks/Decisions Section */}
          <div className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm">
            <h3 className="text-lg font-bold text-black mb-6">Wymagają uwagi</h3>
            <div className="space-y-2">
              {[1, 2].map(i => (
                <div key={i} className="group p-4 rounded-2xl border border-neutral-50 flex items-center justify-between hover:border-neutral-200 hover:bg-neutral-50/50 transition-all cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-xl bg-neutral-100 flex items-center justify-center font-bold text-neutral-600">
                      {i === 1 ? 'JK' : 'AN'}
                    </div>
                    <div>
                      <p className="font-bold text-black">{i === 1 ? 'Jan Kowalski' : 'Anna Nowak'}</p>
                      <p className="text-sm text-neutral-500 font-medium">{i === 1 ? 'Wniosek o urlop wypoczynkowy' : 'Zaległe szkolenie BHP'}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="rounded-lg font-bold text-xs hover:bg-white">
                    PRZEGLĄDAJ <ArrowRight className="ml-2 size-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Style Side Content */}
        <aside className="space-y-8">
          <div className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-black">Ostatnie logi</h3>
              <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Live</div>
            </div>
            <RecentActivity activities={stats?.recentActivity} loading={loading} />
          </div>

          <div className="bg-neutral-900 p-8 rounded-3xl text-white shadow-xl shadow-neutral-200 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 size-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all"></div>
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-400 mb-4">Status Systemu</h3>
            <div className="flex items-center gap-3 mb-6">
              <div className="size-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.5)]"></div>
              <span className="text-sm font-bold tracking-tight">Wszystkie moduły aktywne</span>
            </div>
            <div className="space-y-3 opacity-80">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-neutral-400">Opóźnienie API</span>
                <span>24ms</span>
              </div>
              <div className="flex justify-between text-xs font-medium">
                <span className="text-neutral-400">Uptime</span>
                <span>99.99%</span>
              </div>
            </div>
            <Button className="w-full mt-8 bg-white/10 hover:bg-white/20 border-none text-white rounded-xl text-xs font-bold py-6">
              RAPORT TECHNICZNY
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function MetricCard({ label, value, sub, icon, trend, trendPositive, highlight }: any) {
  return (
    <div className={cn(
      "bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm hover:shadow-md hover:border-neutral-200 transition-all group",
      highlight && "border-amber-100 bg-amber-50/10"
    )}>
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-neutral-50 rounded-xl text-neutral-400 group-hover:bg-black group-hover:text-white transition-colors">
          {icon}
        </div>
        {trend && (
          <span className={cn(
            "text-[11px] font-bold px-2 py-1 rounded-lg",
            trendPositive ? "bg-emerald-50 text-emerald-600" : "bg-neutral-100 text-neutral-600"
          )}>
            {trend}
          </span>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-sm font-bold text-neutral-500 uppercase tracking-widest">{label}</p>
        <div className="text-4xl font-black text-black tracking-tighter">{value}</div>
        <p className="text-xs font-medium text-neutral-400">{sub}</p>
      </div>
    </div>
  );
}
