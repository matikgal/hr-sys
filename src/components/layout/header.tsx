'use client';

import React from 'react';
import Link from 'next/link';
import { Bell, Search, Settings, User, LogOut } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
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

export function Header() {
  const { user, signOut } = useAuth();

  const notifications = [
    { id: 1, title: "Nowy wniosek o urlop", time: "5 min temu", read: false },
    { id: 2, title: "Przypomnienie o szkoleniu BHP", time: "2 godz. temu", read: false },
    { id: 3, title: "Zatwierdzono premię kwartalną", time: "1 dzień temu", read: true },
  ];

  return (
    <header className="h-16 border-b border-neutral-200 bg-white sticky top-0 z-10 px-6 flex items-center justify-between">
      <div className="flex-1 max-w-xl">
        <div className="relative group flex items-center">
          <Search className="absolute left-3 text-neutral-400" size={14} />
          <input 
            placeholder="Szukaj pracowników, dokumentów, zadań..." 
            className="pl-10 pr-4 bg-neutral-50 border border-neutral-200 rounded-md w-full max-w-sm h-9 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 placeholder:text-neutral-400 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Popover>
          <PopoverTrigger asChild>
            <button className="relative size-9 flex items-center justify-center rounded-md border border-neutral-200 text-neutral-500 hover:text-black hover:bg-neutral-50 transition-all">
              <Bell size={16} />
              <span className="absolute top-2 right-2.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-white"></span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0 rounded-md border-neutral-200 shadow-xl mt-2 overflow-hidden" align="end">
            <div className="p-4 border-b border-neutral-100 bg-neutral-50/50">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-neutral-900">Powiadomienia</h4>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map((n) => (
                  <div key={n.id} className={cn(
                    "p-4 border-b border-neutral-50 last:border-0 hover:bg-neutral-50 transition-colors cursor-pointer",
                    !n.read && "bg-blue-50/30"
                  )}>
                    <p className="text-xs font-semibold text-neutral-900 leading-normal">{n.title}</p>
                    <p className="text-[10px] text-neutral-400 mt-1 font-medium">{n.time}</p>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-neutral-400">Brak nowych powiadomień</div>
              )}
            </div>
            <div className="p-3 border-t border-neutral-100 text-center bg-neutral-50/30">
              <button className="text-[10px] font-bold text-neutral-500 hover:text-black uppercase tracking-widest">Wyczyść wszystko</button>
            </div>
          </PopoverContent>
        </Popover>
        
        <div className="h-6 w-[1px] bg-neutral-200"></div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 p-1 rounded-md hover:bg-neutral-50 transition-all">
              <div className="text-right hidden sm:block px-1">
                <p className="text-[11px] font-bold text-neutral-900 leading-none uppercase tracking-tight">{user?.displayName || "Administrator"}</p>
                <p className="text-[10px] text-neutral-400 mt-1 uppercase tracking-widest font-medium">{user?.role || "Dyrektor HR"}</p>
              </div>
              <div className="size-8 rounded-md border border-neutral-200 overflow-hidden bg-neutral-100 shrink-0">
                <img src={user?.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.displayName || "Admin"}`} alt="avatar" className="size-full object-cover" />
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 rounded-md border-neutral-200 shadow-xl mt-2 p-1" align="end">
            <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 px-3 py-2">Konto</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <Link href="/profile">
              <DropdownMenuItem className="text-xs font-semibold px-3 py-2 cursor-pointer rounded-sm">
                <User className="mr-2 h-3.5 w-3.5" />
                <span>Mój profil</span>
              </DropdownMenuItem>
            </Link>
            <Link href="/settings">
              <DropdownMenuItem className="text-xs font-semibold px-3 py-2 cursor-pointer rounded-sm">
                <Settings className="mr-2 h-3.5 w-3.5" />
                <span>Ustawienia</span>
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-xs font-semibold px-3 py-2 text-red-600 cursor-pointer rounded-sm hover:bg-red-50 focus:bg-red-50 focus:text-red-600" onClick={signOut}>
              <LogOut className="mr-2 h-3.5 w-3.5" />
              <span>Wyloguj się</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
