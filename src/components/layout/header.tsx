'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Search, Settings, User, LogOut, Sun, Moon, MessageSquare } from 'lucide-react';
import { GlobalSearch } from '@/components/features/global-search';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/lib/use-theme';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const PAGE_NAMES: Record<string, string> = {
  '/dashboard': 'Panel główny',
  '/employees': 'Pracownicy',
  '/attendance': 'Czas pracy',
  '/leaves': 'Urlopy',
  '/recruitment': 'Rekrutacja',
  '/performance': 'Oceny roczne',
  '/learning': 'Szkolenia',
  '/benefits': 'Benefity',
  '/documents': 'Dokumenty',
  '/settings': 'Ustawienia',
  '/profile': 'Profil',
};

export function Header() {
  const { user, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen(open => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const pageName = Object.entries(PAGE_NAMES).find(([key]) => pathname.startsWith(key))?.[1] ?? 'HR Manager';

  const notifications = [
    { id: 1, title: "Nowy wniosek o urlop", time: "5 min temu", read: false },
    { id: 2, title: "Przypomnienie o szkoleniu BHP", time: "2 godz. temu", read: false },
    { id: 3, title: "Zatwierdzono premię kwartalną", time: "1 dzień temu", read: true },
  ];

  const unread = notifications.filter(n => !n.read).length;

  const initials = user?.displayName
    ? user.displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'HR';

  return (
    <header className="flex items-center justify-between px-8 pt-5 pb-2 bg-transparent shrink-0">
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
      {/* Breadcrumb */}
      <p className="text-[12px] text-muted-foreground tracking-[0.2px]">
        HR Manager · <b className="text-foreground font-semibold font-sans">{pageName}</b> · Przegląd
      </p>

      <div className="flex items-center gap-2">
        {/* Search */}
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-2 bg-card border border-border rounded-[10px] px-3 py-[7px] text-[13px] text-muted-foreground min-w-[220px] cursor-pointer hover:border-primary/30 hover:bg-accent/30 transition-colors"
        >
          <Search size={13} strokeWidth={1.8} className="shrink-0" />
          <span>Szukaj pracowników, raportów…</span>
          <kbd className="ml-auto text-[10px] bg-background border border-border rounded px-1 py-0.5 font-mono leading-none">⌘K</kbd>
        </button>

        {/* Dark mode toggle */}
        <button
          onClick={toggle}
          aria-label="Przełącz motyw"
          className="size-[34px] flex items-center justify-center rounded-[10px] border border-border bg-card text-muted-foreground hover:bg-accent transition-colors"
        >
          {theme === 'dark' ? <Sun size={15} strokeWidth={1.8} /> : <Moon size={15} strokeWidth={1.8} />}
        </button>

        {/* Notifications */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="relative size-[34px] flex items-center justify-center rounded-[10px] border border-border bg-card text-muted-foreground hover:bg-accent transition-colors">
              <Bell size={15} strokeWidth={1.8} />
              {unread > 0 && (
                <span className="absolute top-[7px] right-[7px] w-[7px] h-[7px] bg-amber-500 rounded-full border-2 border-card" />
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0 rounded-xl border-border bg-popover shadow-lg mt-2 overflow-hidden" align="end">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h4 className="text-[12px] font-semibold text-foreground uppercase tracking-wide">Powiadomienia</h4>
              {unread > 0 && (
                <span className="text-[10px] font-semibold bg-muted text-foreground px-2 py-0.5 rounded-full">
                  {unread} nowe
                </span>
              )}
            </div>
            <div className="max-h-72 overflow-y-auto">
              {notifications.map((n) => (
                <div key={n.id} className={cn(
                  "px-4 py-3 border-b border-border last:border-0 hover:bg-accent transition-colors cursor-pointer",
                  !n.read && "bg-accent/50"
                )}>
                  <div className="flex items-start gap-2.5">
                    {!n.read && <div className="mt-1.5 size-1.5 rounded-full bg-primary shrink-0" />}
                    <div className={cn(!n.read ? "" : "pl-4")}>
                      <p className="text-[13px] font-medium text-foreground leading-snug">{n.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{n.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 py-3 border-t border-border text-center">
              <button className="text-[11px] font-semibold text-muted-foreground hover:text-foreground uppercase tracking-wide transition-colors">
                Wyczyść wszystko
              </button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Messages */}
        <button className="size-[34px] flex items-center justify-center rounded-[10px] border border-border bg-card text-muted-foreground hover:bg-accent transition-colors">
          <MessageSquare size={15} strokeWidth={1.8} />
        </button>

        {/* Profile — minimal avatar only */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="size-[34px] flex items-center justify-center rounded-[10px] bg-primary hover:bg-primary/90 transition-colors shrink-0">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="avatar" className="size-full object-cover rounded-[10px]" />
              ) : (
                <span className="text-[11px] font-bold text-primary-foreground">{initials}</span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-52 rounded-xl border-border bg-popover shadow-lg mt-2 p-1.5" align="end">
            <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground px-2.5 py-1.5">
              {user?.displayName || 'Administrator'}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border" />
            <Link href="/profile">
              <DropdownMenuItem className="text-[13px] font-medium px-2.5 py-2 cursor-pointer rounded-lg text-foreground hover:bg-accent focus:bg-accent">
                <User className="mr-2 h-4 w-4 text-muted-foreground" strokeWidth={1.8} />
                Mój profil
              </DropdownMenuItem>
            </Link>
            <Link href="/settings">
              <DropdownMenuItem className="text-[13px] font-medium px-2.5 py-2 cursor-pointer rounded-lg text-foreground hover:bg-accent focus:bg-accent">
                <Settings className="mr-2 h-4 w-4 text-muted-foreground" strokeWidth={1.8} />
                Ustawienia
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem
              className="text-[13px] font-medium px-2.5 py-2 text-destructive cursor-pointer rounded-lg hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive"
              onClick={signOut}
            >
              <LogOut className="mr-2 h-4 w-4" strokeWidth={1.8} />
              Wyloguj się
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
