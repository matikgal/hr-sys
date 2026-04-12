'use client';

import React from 'react';
import { Bell, Search, User } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { MOCK_USER } from '@/data/mock-data';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function Header() {
  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-10 px-8 flex items-center justify-between">
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary group-focus-within:text-accent transition-colors" size={18} />
          <Input 
            placeholder="Szukaj pracowników, wniosków..." 
            className="pl-10 bg-background/50 border-none enterprise-shadow focus-visible:ring-1 focus-visible:ring-accent w-full"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative text-secondary hover:text-accent">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-card"></span>
        </Button>
        
        <div className="h-8 w-[1px] bg-border mx-2"></div>

        <div className="flex items-center gap-3 pl-2">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-foreground leading-none">{MOCK_USER.displayName}</p>
            <p className="text-xs text-secondary mt-1 capitalize">{MOCK_USER.role}</p>
          </div>
          <Avatar src={MOCK_USER.photoURL} alt={MOCK_USER.displayName || ""} />
        </div>
      </div>
    </header>
  );
}
