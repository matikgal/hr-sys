'use client';

import React from 'react';
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
  Database,
  Building2,
  ListTodo,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';

const navigation = [
  { name: 'Panel główny', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Pracownicy', href: '/employees', icon: Users },
  { name: 'Czas pracy', href: '/attendance', icon: Clock },
  { name: 'Urlopy i nieobecności', href: '/leaves', icon: CalendarDays },
  { name: 'Rekrutacja', href: '/recruitment', icon: UserPlus },
  { name: 'Oceny roczne', href: '/performance', icon: BarChart3 },
  { name: 'Zadania', href: '/tasks', icon: ListTodo },
  { name: 'Szkolenia', href: '/learning', icon: GraduationCap },
  { name: 'Benefity', href: '/benefits', icon: HeartHandshake },
  { name: 'Dokumenty', href: '/documents', icon: FileText },
  { name: 'Ustawienia', href: '/settings', icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  onCollapsedChange: (v: boolean) => void;
}

export function Sidebar({ collapsed, onCollapsedChange }: SidebarProps) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const initials = user?.displayName
    ? user.displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'HR';

  return (
    <aside
      className={cn(
        "flex flex-col h-full",
        "border border-sidebar-border bg-sidebar",
        "rounded-[18px]",
        "shadow-[0_6px_20px_rgba(14,16,20,0.06),0_1px_2px_rgba(14,16,20,0.04)]",
        "overflow-hidden",
      )}
    >
      {/* Brand */}
      <div className={cn(
        "flex items-center border-b border-sidebar-border shrink-0",
        collapsed ? "justify-center px-0 py-4" : "px-[18px] py-4"
      )}>
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="size-[30px] rounded-lg bg-sidebar-primary flex items-center justify-center shrink-0">
            <Building2 size={14} className="text-sidebar-primary-foreground" strokeWidth={2} />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <span className="font-semibold text-[14px] text-sidebar-foreground whitespace-nowrap">HR Manager</span>
              <div className="text-[9px] text-sidebar-foreground/40 font-medium tracking-widest uppercase whitespace-nowrap">Enterprise</div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-[14px] py-3 space-y-0.5 overflow-y-auto no-scrollbar">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link key={item.name} href={item.href} className="block">
              <div
                title={collapsed ? item.name : undefined}
                className={cn(
                  "flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg transition-colors duration-150 cursor-pointer text-[13px] border",
                  collapsed && "justify-center",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium border-transparent border-l-[3px] border-l-sidebar-primary pl-[7px]"
                    : "text-sidebar-foreground/60 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground border-transparent"
                )}
              >
                <item.icon
                  className={cn(
                    "shrink-0 size-4",
                    isActive ? "text-sidebar-primary" : "text-sidebar-foreground/40"
                  )}
                  strokeWidth={isActive ? 2 : 1.7}
                />
                {!collapsed && (
                  <span className="whitespace-nowrap">{item.name}</span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-[14px] pb-3 pt-2 border-t border-sidebar-border space-y-0.5 shrink-0">
        {!collapsed && (
          <Link href="/admin/seed">
            <div className="flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-sidebar-foreground/40 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground transition-colors cursor-pointer text-[13px]">
              <Database size={15} strokeWidth={1.7} />
              <span className="font-medium">Baza danych</span>
            </div>
          </Link>
        )}

        <button
          onClick={() => onCollapsedChange(!collapsed)}
          title={collapsed ? "Rozwiń menu" : "Zwiń menu"}
          className={cn(
            "w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-sidebar-foreground/40 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground transition-colors text-[13px]",
            collapsed && "justify-center"
          )}
        >
          {collapsed ? <ChevronRight size={15} strokeWidth={1.7} /> : <ChevronLeft size={15} strokeWidth={1.7} />}
          {!collapsed && <span className="font-medium text-sidebar-foreground/60">Zwiń menu</span>}
        </button>

        {/* User card */}
        {!collapsed && (
          <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-sidebar-accent/40 transition-colors cursor-pointer mt-1">
            <div className="size-7 rounded-full bg-sidebar-primary flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-sidebar-primary-foreground">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium text-sidebar-foreground truncate">{user?.displayName || 'Administrator'}</p>
              <p className="text-[10px] text-sidebar-foreground/50 truncate">{user?.role || 'Dyrektor HR'}</p>
            </div>
            <button
              onClick={signOut}
              title="Wyloguj się"
              className="text-sidebar-foreground/30 hover:text-destructive transition-colors shrink-0"
            >
              <LogOut size={13} strokeWidth={1.7} />
            </button>
          </div>
        )}

        {collapsed && (
          <button
            onClick={signOut}
            className="w-full flex items-center justify-center px-2.5 py-[7px] rounded-lg text-sidebar-foreground/40 hover:bg-destructive/10 hover:text-destructive transition-colors"
            title="Wyloguj się"
          >
            <LogOut size={15} strokeWidth={1.7} />
          </button>
        )}
      </div>
    </aside>
  );
}
