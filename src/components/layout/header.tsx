'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Settings, User, LogOut, Sun, Moon, MessageSquare } from 'lucide-react';
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

import { subscribeToConversations } from '@/services/db/chat';
import { Conversation } from '@/types';

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

interface HeaderProps {
  onChatOpen?: () => void;
}

export function Header({ onChatOpen }: HeaderProps) {
  const { user, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = subscribeToConversations(user.uid, setConversations);
    return unsub;
  }, [user?.uid]);

  const unreadChat = conversations.reduce(
    (sum, c) => sum + (c.unreadCounts?.[user?.uid ?? ''] ?? 0),
    0
  );

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



        {/* Messages */}
        <button
          onClick={onChatOpen}
          className="relative size-[34px] flex items-center justify-center rounded-[10px] border border-border bg-card text-muted-foreground hover:bg-accent transition-colors"
        >
          <MessageSquare size={15} strokeWidth={1.8} />
          {unreadChat > 0 && (
            <span className="absolute top-[7px] right-[7px] w-[7px] h-[7px] bg-primary rounded-full border-2 border-card" />
          )}
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
