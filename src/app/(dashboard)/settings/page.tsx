'use client';

import React, { useState, useEffect } from 'react';
import { 
  User, 
  Bell, 
  Shield, 
  Database, 
  LogOut,
  Settings as SettingsIcon,
  Mail,
  Building
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/auth-context';

export default function SettingsPage() {
  const { user, signOut } = useAuth();

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Ustawienia</h1>
        <p className="text-sm text-muted-foreground mt-1">Zarządzaj swoim kontem i preferencjami systemowymi.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <aside className="space-y-1">
          <Button variant="ghost" className="w-full justify-start bg-muted">
            <User className="mr-2 h-4 w-4" /> Profil
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <Bell className="mr-2 h-4 w-4" /> Powiadomienia
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <Shield className="mr-2 h-4 w-4" /> Bezpieczeństwo
          </Button>
          <Button variant="ghost" className="w-full justify-start text-destructive" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" /> Wyloguj się
          </Button>
        </aside>

        <div className="md:col-span-2 space-y-6">
          <Card className="shadow-none border-border">
            <CardHeader>
              <CardTitle className="text-lg">Profil użytkownika</CardTitle>
              <CardDescription>Twoje dane widoczne w systemie.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Imię i Nazwisko</Label>
                  <Input defaultValue={user?.displayName || "Marcin"} />
                </div>
                <div className="space-y-2">
                  <Label>Rola</Label>
                  <Input value={user?.role?.toUpperCase()} disabled />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user?.email || ""} disabled />
              </div>
              <Button size="sm">Zapisz zmiany</Button>
            </CardContent>
          </Card>

          <Card className="shadow-none border-border">
            <CardHeader>
              <CardTitle className="text-lg">Informacje o organizacji</CardTitle>
              <CardDescription>Dane Twojej firmy.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nazwa firmy</Label>
                <Input defaultValue="Nexus Corp" />
              </div>
              <div className="space-y-2">
                <Label>Domena</Label>
                <Input defaultValue="hr.local" disabled />
              </div>
              <Button size="sm">Zapisz ustawienia</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
