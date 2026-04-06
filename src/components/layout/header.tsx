'use client';

import React from 'react';
import Link from 'next/link';
import { Bell, Search, Settings, User, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
    <header className="h-16 border-b border-neutral-200 bg-white sticky top-0 z-10 px-8 flex items-center justify-between dark:bg-neutral-900 dark:border-neutral-800">
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-neutral-400" size={14} />
          <input 
            placeholder="Search team, documents, tasks..." 
            className="pl-6 bg-transparent border-none w-full max-w-sm h-10 text-xs font-medium focus:outline-none focus:ring-0 placeholder:text-neutral-400 dark:text-white"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <Popover>
          <PopoverTrigger asChild>
            <button className="relative text-neutral-400 hover:text-black dark:hover:text-white transition-colors">
              <Bell size={16} />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-black dark:bg-white rounded-none border border-white dark:border-black"></span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0 rounded-none border-neutral-200 shadow-none mt-2" align="end">
            <div className="p-4 border-b border-neutral-100">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500">Inbox</h4>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.map((n) => (
                <div key={n.id} className={cn(
                  "p-4 border-b border-neutral-50 last:border-0 hover:bg-neutral-50 transition-colors cursor-pointer",
                  !n.read && "bg-neutral-50/50"
                )}>
                  <p className="text-xs font-bold text-black">{n.title}</p>
                  <p className="text-[10px] text-neutral-400 mt-1 uppercase tracking-tight">{n.time}</p>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        
        <div className="h-4 w-[1px] bg-neutral-200 dark:bg-neutral-800"></div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 group">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-bold text-black dark:text-white leading-none uppercase tracking-wider">{user?.displayName || "Użytkownik"}</p>
                <p className="text-[9px] text-neutral-400 mt-1 uppercase tracking-widest">{user?.role}</p>
              </div>
              <div className="size-8 rounded-none border border-neutral-200 overflow-hidden dark:border-neutral-800">
                <img src={user?.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.displayName}`} alt="avatar" className="size-full object-cover" />
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 rounded-none border-neutral-200 shadow-none mt-2" align="end">
            <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <Link href="/profile">
              <DropdownMenuItem className="text-xs font-bold uppercase tracking-tight cursor-pointer">
                <User className="mr-2 h-3.5 w-3.5" />
                <span>Profile</span>
              </DropdownMenuItem>
            </Link>
            <Link href="/settings">
              <DropdownMenuItem className="text-xs font-bold uppercase tracking-tight cursor-pointer">
                <Settings className="mr-2 h-3.5 w-3.5" />
                <span>Settings</span>
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-xs font-bold uppercase tracking-tight text-red-600 cursor-pointer" onClick={signOut}>
              <LogOut className="mr-2 h-3.5 w-3.5" />
              <span>Log Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
