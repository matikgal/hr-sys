'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User, Bell, Shield, LogOut, CheckCircle2, ScrollText, Briefcase, Trash2, Plus,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/auth-context';
import { getUserSettings, saveUserSettings } from '@/services/db/settings';
import type { UserSettings } from '@/types';
import { useAuditLog } from '@/hooks/use-audit';
import { usePositions, useAddPosition, useDeletePosition } from '@/hooks/use-positions';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

const profileSchema = z.object({
  displayName: z.string().min(2, 'Minimum 2 znaki'),
  companyName: z.string().min(2, 'Minimum 2 znaki'),
});

const notifSchema = z.object({
  email: z.boolean(),
  push: z.boolean(),
  leaveRequests: z.boolean(),
  attendance: z.boolean(),
});

type ProfileForm = z.infer<typeof profileSchema>;
type NotifForm = z.infer<typeof notifSchema>;

type Section = 'profile' | 'notifications' | 'security' | 'audit' | 'positions';

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const [section, setSection] = useState<Section>('profile');
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedProfile, setSavedProfile] = useState(false);
  const [savedNotif, setSavedNotif] = useState(false);

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { displayName: '', companyName: '' },
  });

  const notifForm = useForm<NotifForm>({
    resolver: zodResolver(notifSchema),
    defaultValues: { email: true, push: true, leaveRequests: true, attendance: false },
  });

  useEffect(() => {
    if (!user) return;
    getUserSettings(user.uid).then((s) => {
      setSettings(s);
      profileForm.reset({
        displayName: s.displayName || user.displayName || '',
        companyName: s.companyName,
      });
      notifForm.reset(s.notifications);
      setLoading(false);
    });
  }, [user]);

  const onSaveProfile = async (data: ProfileForm) => {
    if (!settings || !user) return;
    const updated = { ...settings, ...data };
    await saveUserSettings(updated);
    setSettings(updated);
    setSavedProfile(true);
    setTimeout(() => setSavedProfile(false), 2500);
  };

  const onSaveNotif = async (data: NotifForm) => {
    if (!settings || !user) return;
    const updated = { ...settings, notifications: data };
    await saveUserSettings(updated);
    setSettings(updated);
    setSavedNotif(true);
    setTimeout(() => setSavedNotif(false), 2500);
  };

  const { data: auditLogs = [], isLoading: auditLoading } = useAuditLog({ limit: 50 });
  const { data: positions = [], isLoading: posLoading } = usePositions();
  const addPositionMutation = useAddPosition();
  const deletePositionMutation = useDeletePosition();
  const [newPositionName, setNewPositionName] = useState('');
  const [newPositionLevel, setNewPositionLevel] = useState<'junior'|'mid'|'senior'|'lead'|'manager'|'director'>('mid');

  const navItems: { id: Section; label: string; Icon: React.ElementType }[] = [
    { id: 'profile', label: 'Profil', Icon: User },
    { id: 'notifications', label: 'Powiadomienia', Icon: Bell },
    { id: 'security', label: 'Bezpieczeństwo', Icon: Shield },
    { id: 'positions', label: 'Stanowiska', Icon: Briefcase },
    { id: 'audit', label: 'Dziennik zdarzeń', Icon: ScrollText },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 px-8 py-10 pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Ustawienia</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Zarządzaj swoim kontem i preferencjami systemowymi.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <aside className="space-y-1">
          {navItems.map(({ id, label, Icon }) => (
            <Button
              key={id}
              variant="ghost"
              className={`w-full justify-start ${section === id ? 'bg-muted' : ''}`}
              onClick={() => setSection(id)}
            >
              <Icon className="mr-2 h-4 w-4" /> {label}
            </Button>
          ))}
          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive"
            onClick={signOut}
          >
            <LogOut className="mr-2 h-4 w-4" /> Wyloguj się
          </Button>
        </aside>

        <div className="md:col-span-2 space-y-6">
          {/* Profile section */}
          {section === 'profile' && (
            <Card className="shadow-none border-border">
              <CardHeader>
                <CardTitle className="text-lg">Profil użytkownika</CardTitle>
                <CardDescription>Twoje dane widoczne w systemie.</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-9 w-32" />
                  </div>
                ) : (
                  <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="displayName">Imię i Nazwisko</Label>
                        <Input
                          id="displayName"
                          {...profileForm.register('displayName')}
                          aria-invalid={!!profileForm.formState.errors.displayName}
                        />
                        {profileForm.formState.errors.displayName && (
                          <p className="text-xs text-destructive">
                            {profileForm.formState.errors.displayName.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Rola</Label>
                        <Input value={user?.role?.toUpperCase() ?? ''} disabled />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input value={user?.email ?? ''} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Nazwa firmy</Label>
                      <Input
                        id="companyName"
                        {...profileForm.register('companyName')}
                        aria-invalid={!!profileForm.formState.errors.companyName}
                      />
                      {profileForm.formState.errors.companyName && (
                        <p className="text-xs text-destructive">
                          {profileForm.formState.errors.companyName.message}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        size="sm"
                        type="submit"
                        disabled={profileForm.formState.isSubmitting}
                      >
                        {profileForm.formState.isSubmitting ? 'Zapisywanie...' : 'Zapisz zmiany'}
                      </Button>
                      {savedProfile && (
                        <span className="flex items-center gap-1 text-sm text-emerald-600">
                          <CheckCircle2 size={14} /> Zapisano
                        </span>
                      )}
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          )}

          {/* Notifications section */}
          {section === 'notifications' && (
            <Card className="shadow-none border-border">
              <CardHeader>
                <CardTitle className="text-lg">Powiadomienia</CardTitle>
                <CardDescription>Wybierz, o czym chcesz być informowany.</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-6 w-full" />
                    ))}
                  </div>
                ) : (
                  <form onSubmit={notifForm.handleSubmit(onSaveNotif)} className="space-y-5">
                    {([
                      { name: 'email', label: 'Powiadomienia e-mail', desc: 'Otrzymuj podsumowania na skrzynkę.' },
                      { name: 'push', label: 'Powiadomienia push', desc: 'Alerty w przeglądarce.' },
                      { name: 'leaveRequests', label: 'Wnioski urlopowe', desc: 'Gdy pracownik złoży wniosek.' },
                      { name: 'attendance', label: 'Obecność', desc: 'Spóźnienia i anomalie czasu pracy.' },
                    ] as const).map(({ name, label, desc }) => (
                      <label key={name} className="flex items-start gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          className="mt-0.5 h-4 w-4 rounded border-border accent-primary cursor-pointer"
                          {...notifForm.register(name)}
                        />
                        <div>
                          <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                            {label}
                          </p>
                          <p className="text-xs text-muted-foreground">{desc}</p>
                        </div>
                      </label>
                    ))}
                    <div className="flex items-center gap-3 pt-1">
                      <Button
                        size="sm"
                        type="submit"
                        disabled={notifForm.formState.isSubmitting}
                      >
                        {notifForm.formState.isSubmitting ? 'Zapisywanie...' : 'Zapisz preferencje'}
                      </Button>
                      {savedNotif && (
                        <span className="flex items-center gap-1 text-sm text-emerald-600">
                          <CheckCircle2 size={14} /> Zapisano
                        </span>
                      )}
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          )}

          {/* Security section */}
          {section === 'security' && (
            <Card className="shadow-none border-border">
              <CardHeader>
                <CardTitle className="text-lg">Bezpieczeństwo</CardTitle>
                <CardDescription>Zarządzaj hasłem i sesjami.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Uwierzytelnianie</Label>
                  <p className="text-sm text-muted-foreground">
                    Konto zabezpieczone przez Firebase Authentication (JWT).
                    Sesja odświeżana automatycznie.
                  </p>
                </div>
                <div className="rounded-lg border border-border p-4 space-y-1">
                  <p className="text-sm font-medium">Ostatnie logowanie</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={signOut}
                >
                  Wyloguj się ze wszystkich sesji
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Positions section */}
          {section === 'positions' && (
            <Card className="shadow-none border-border">
              <CardHeader>
                <CardTitle className="text-lg">Stanowiska</CardTitle>
                <CardDescription>Zarządzaj katalogiem stanowisk w organizacji.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Nazwa stanowiska"
                    value={newPositionName}
                    onChange={e => setNewPositionName(e.target.value)}
                    className="h-9"
                  />
                  <select
                    value={newPositionLevel}
                    onChange={e => setNewPositionLevel(e.target.value as typeof newPositionLevel)}
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {['junior','mid','senior','lead','manager','director'].map(l => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    className="h-9 shrink-0"
                    disabled={!newPositionName.trim() || addPositionMutation.isPending}
                    onClick={() => {
                      if (!newPositionName.trim()) return;
                      addPositionMutation.mutate({ name: newPositionName.trim(), level: newPositionLevel });
                      setNewPositionName('');
                    }}
                  >
                    <Plus size={14} className="mr-1" /> Dodaj
                  </Button>
                </div>
                <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
                  {posLoading ? (
                    <div className="p-4 text-sm text-muted-foreground">Ładowanie…</div>
                  ) : positions.length === 0 ? (
                    <div className="p-4 text-sm text-muted-foreground">Brak stanowisk.</div>
                  ) : positions.map(pos => (
                    <div key={pos.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/30">
                      <div>
                        <span className="text-[13px] font-medium">{pos.name}</span>
                        {pos.level && <span className="ml-2 text-[10px] text-muted-foreground uppercase font-bold">{pos.level}</span>}
                      </div>
                      <button
                        onClick={() => deletePositionMutation.mutate(pos.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Audit log section */}
          {section === 'audit' && (
            <Card className="shadow-none border-border">
              <CardHeader>
                <CardTitle className="text-lg">Dziennik zdarzeń</CardTitle>
                <CardDescription>Historia akcji wykonanych w systemie (ostatnie 50).</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {auditLoading ? (
                  <div className="p-6 space-y-3">
                    {[1,2,3,4,5].map(i => <div key={i} className="h-10 bg-muted rounded animate-pulse" />)}
                  </div>
                ) : auditLogs.length === 0 ? (
                  <div className="py-16 text-center text-sm text-muted-foreground">Brak zdarzeń.</div>
                ) : (
                  <div className="divide-y divide-border">
                    {auditLogs.map(log => (
                      <div key={log.id} className="px-6 py-3 flex items-start justify-between gap-4 hover:bg-muted/30">
                        <div className="space-y-0.5 min-w-0">
                          <p className="text-[13px] font-medium text-foreground">{log.action.replace(/_/g, ' ')}</p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {log.actorName} · {log.module}
                            {log.targetName ? ` · ${log.targetName}` : ''}
                          </p>
                        </div>
                        <span className="text-[11px] text-muted-foreground shrink-0 mt-0.5">
                          {format(new Date(log.createdAt), 'd MMM yyyy, HH:mm', { locale: pl })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
