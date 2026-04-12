'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  CalendarDays, 
  UserCircle, 
  Settings, 
  ChevronLeft,
  ChevronRight,
  LogOut,
  Building2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Pracownicy', href: '/employees', icon: Users },
  { name: 'Urlopy', href: '/leaves', icon: CalendarDays },
  { name: 'Profil', href: '/profile', icon: UserCircle },
  { name: 'Ustawienia', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? '80px' : '260px' }}
      className={cn(
        "relative flex flex-col h-screen bg-card border-r border-border transition-all duration-300 ease-in-out z-20",
        isCollapsed ? "px-2" : "px-4"
      )}
    >
      <div className={cn(
        "flex items-center h-16 mb-6",
        isCollapsed ? "justify-center" : "justify-between px-2"
      )}>
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-accent-foreground">
              <Building2 size={20} />
            </div>
            <span className="font-bold text-xl tracking-tight text-foreground">HR Nexus</span>
          </div>
        )}
        {isCollapsed && (
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-accent-foreground">
            <Building2 size={20} />
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-4 top-6 w-8 h-8 rounded-full border border-border bg-card shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </Button>
      </div>

      <nav className="flex-1 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                  isActive 
                    ? "bg-accent text-accent-foreground shadow-sm" 
                    : "text-secondary hover:bg-accent/10 hover:text-accent"
                )}
              >
                <item.icon className={cn(
                  "shrink-0",
                  isActive ? "text-accent-foreground" : "text-secondary group-hover:text-accent"
                )} size={20} />
                {!isCollapsed && (
                  <span className="font-medium text-sm">{item.name}</span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className={cn(
        "mt-auto py-4 border-t border-border",
        isCollapsed ? "px-2" : "px-2"
      )}>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50",
            isCollapsed && "justify-center px-0"
          )}
        >
          <LogOut size={20} className={cn(!isCollapsed && "mr-3")} />
          {!isCollapsed && <span className="font-medium">Wyloguj się</span>}
        </Button>
      </div>
    </motion.aside>
  );
}
