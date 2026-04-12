'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Clock, 
  CalendarDays, 
  UserPlus, 
  BarChart3, 
  GraduationCap, 
  HeartHandshake, 
  FileText, 
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Database
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { motion, AnimatePresence } from 'framer-motion';

const navigation = [
  { name: 'Panel główny', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Pracownicy', href: '/employees', icon: Users },
  { name: 'Czas pracy', href: '/attendance', icon: Clock },
  { name: 'Urlopy i nieobecności', href: '/leaves', icon: CalendarDays },
  { name: 'Rekrutacja', href: '/recruitment', icon: UserPlus },
  { name: 'Oceny roczne', href: '/performance', icon: BarChart3 },
  { name: 'Szkolenia', href: '/learning', icon: GraduationCap },
  { name: 'Benefity', href: '/benefits', icon: HeartHandshake },
  { name: 'Dokumenty', href: '/documents', icon: FileText },
  { name: 'Ustawienia', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const { signOut } = useAuth();

  return (
    <aside
      className={cn(
        "relative flex flex-col h-screen bg-white border-r border-neutral-100 transition-all duration-500 ease-in-out z-20",
        isCollapsed ? "w-20" : "w-72"
      )}
    >
      {/* Logo Area - Simplified & Elegant */}
      <div className={cn(
        "flex items-center h-20 px-8 border-b border-neutral-50",
        isCollapsed ? "justify-center px-0" : "justify-start"
      )}>
        {!isCollapsed ? (
          <div className="flex flex-col">
            <span className="font-black text-xl tracking-tighter text-black uppercase">HR Nexus</span>
            <div className="h-0.5 w-6 bg-black mt-0.5"></div>
          </div>
        ) : (
          <span className="font-black text-xl text-black">N</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2.5 overflow-y-auto no-scrollbar">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link key={item.name} href={item.href} className="block mb-1 last:mb-0">
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 group relative",
                  isActive 
                    ? "bg-neutral-900 text-white" 
                    : "text-neutral-500 hover:bg-neutral-100 hover:text-black"
                )}
              >
                <item.icon className={cn(
                  "shrink-0 size-4 transition-colors duration-200",
                  isActive ? "text-white" : "text-neutral-400 group-hover:text-black"
                )} strokeWidth={isActive ? 2 : 1.5} />
                
                {!isCollapsed && (
                  <span className={cn(
                    "text-[14px] font-medium tracking-tight whitespace-nowrap",
                    isActive ? "text-white" : "text-neutral-700"
                  )}>{item.name}</span>
                )}

                {isActive && !isCollapsed && (
                  <motion.div 
                    layoutId="active-indicator"
                    className="absolute right-2 size-1.5 bg-white rounded-full"
                  />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer Actions */}
      <div className="p-4 border-t border-neutral-50 space-y-2 bg-neutral-50/30">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center gap-4 px-4 py-3 text-neutral-500 hover:bg-white hover:text-black rounded-xl transition-all duration-300"
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          {!isCollapsed && <span className="text-[14px] font-medium">Zwiń menu</span>}
        </button>
        
        <button
          onClick={signOut}
          className="w-full flex items-center gap-4 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-all duration-300"
        >
          <LogOut size={20} />
          {!isCollapsed && <span className="text-[14px] font-semibold">Wyloguj się</span>}
        </button>

        {!isCollapsed && (
          <Link href="/admin/seed">
            <div className="mt-2 px-4 py-3 rounded-xl bg-neutral-100 text-neutral-400 flex items-center gap-4 hover:bg-neutral-200 hover:text-neutral-600 transition-all">
              <Database size={16} />
              <span className="text-[12px] font-bold uppercase tracking-widest">Baza danych</span>
            </div>
          </Link>
        )}
      </div>
    </aside>
  );
}
