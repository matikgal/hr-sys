'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, Calendar, FileText, Briefcase, BarChart2, BookOpen,
  Gift, Settings, LayoutDashboard, Clock,
} from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { useEmployees } from '@/hooks/use-employees';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Pracownicy', href: '/employees', icon: Users },
  { label: 'Czas pracy', href: '/attendance', icon: Clock },
  { label: 'Urlopy', href: '/leaves', icon: Calendar },
  { label: 'Rekrutacja', href: '/recruitment', icon: Briefcase },
  { label: 'Oceny', href: '/performance', icon: BarChart2 },
  { label: 'Szkolenia', href: '/learning', icon: BookOpen },
  { label: 'Benefity', href: '/benefits', icon: Gift },
  { label: 'Dokumenty', href: '/documents', icon: FileText },
  { label: 'Ustawienia', href: '/settings', icon: Settings },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearch({ open, onOpenChange }: Props) {
  const router = useRouter();
  const { data: employees = [] } = useEmployees();

  const run = (href: string) => {
    router.push(href);
    onOpenChange(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title="Wyszukaj" description="Szukaj pracowników i nawiguj po aplikacji">
      <CommandInput placeholder="Szukaj pracowników, stron…" />
      <CommandList>
        <CommandEmpty>Brak wyników.</CommandEmpty>

        <CommandGroup heading="Nawigacja">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem key={item.href} value={item.label} onSelect={() => run(item.href)}>
                <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                {item.label}
              </CommandItem>
            );
          })}
        </CommandGroup>

        {employees.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Pracownicy">
              {employees.slice(0, 10).map((emp) => (
                <CommandItem
                  key={emp.id}
                  value={`${emp.firstName} ${emp.lastName} ${emp.email}`}
                  onSelect={() => run(`/employees/${emp.id}`)}
                >
                  <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{emp.firstName} {emp.lastName}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{emp.email}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
