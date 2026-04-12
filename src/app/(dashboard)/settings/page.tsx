'use client';

import React, { useState } from 'react';
import { 
  User, 
  Bell, 
  Palette, 
  Shield, 
  Smartphone,
  Check
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('account');

  const tabs = [
    { id: 'account', name: 'Konto', icon: User },
    { id: 'notifications', name: 'Powiadomienia', icon: Bell },
    { id: 'appearance', name: 'Wygląd', icon: Palette },
    { id: 'security', name: 'Bezpieczeństwo', icon: Shield },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ustawienia</h1>
        <p className="text-secondary mt-1">Zarządzaj swoją konfiguracją i preferencjami systemowymi.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Settings Navigation */}
        <aside className="w-full md:w-64 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                activeTab === tab.id 
                  ? "bg-accent text-accent-foreground shadow-sm" 
                  : "text-secondary hover:bg-accent/10 hover:text-accent"
              )}
            >
              <tab.icon size={18} />
              {tab.name}
            </button>
          ))}
        </aside>

        {/* Settings Content */}
        <div className="flex-1 space-y-6">
          {activeTab === 'account' && (
            <Card className="border-none enterprise-shadow bg-card/60">
              <CardHeader>
                <CardTitle>Dane konta</CardTitle>
                <CardDescription>Zaktualizuj swoje podstawowe informacje profilowe.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Imię</label>
                    <Input defaultValue="Marcin" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Nazwisko</label>
                    <Input defaultValue="Kowalski" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Email służbowy</label>
                  <Input defaultValue="marcin.kowalski@hrnexus.pl" type="email" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Biografię</label>
                  <textarea 
                    className="w-full min-h-[100px] rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-all"
                    placeholder="Opisz krótko swoje doświadczenie..."
                  />
                </div>
                <div className="flex justify-end pt-4">
                  <Button variant="accent" className="px-8">Zapisz zmiany</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'appearance' && (
            <Card className="border-none enterprise-shadow bg-card/60">
              <CardHeader>
                <CardTitle>Motyw aplikacji</CardTitle>
                <CardDescription>Dostosuj kolory i styl interfejsu do swoich preferencji.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative group cursor-pointer">
                    <div className="aspect-video bg-white border-2 border-accent rounded-xl p-4 flex flex-col gap-2">
                      <div className="w-1/2 h-2 bg-slate-100 rounded"></div>
                      <div className="w-full h-8 bg-slate-50 rounded"></div>
                      <div className="absolute top-2 right-2 w-5 h-5 bg-accent rounded-full flex items-center justify-center text-white">
                        <Check size={12} />
                      </div>
                    </div>
                    <p className="text-center text-xs font-bold mt-2 text-accent uppercase tracking-widest">Jasny</p>
                  </div>
                  <div className="relative group cursor-pointer opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all">
                    <div className="aspect-video bg-slate-900 border-2 border-transparent rounded-xl p-4 flex flex-col gap-2">
                      <div className="w-1/2 h-2 bg-slate-800 rounded"></div>
                      <div className="w-full h-8 bg-slate-800 rounded"></div>
                    </div>
                    <p className="text-center text-xs font-bold mt-2 text-secondary uppercase tracking-widest">Ciemny</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Mock content for other tabs */}
          {activeTab !== 'account' && activeTab !== 'appearance' && (
             <div className="p-12 text-center bg-card/20 rounded-3xl border-2 border-dashed border-border">
                <Smartphone className="mx-auto text-secondary mb-4" size={48} />
                <h3 className="text-lg font-bold">Moduł w budowie</h3>
                <p className="text-secondary text-sm">Pracujemy nad tymi ustawieniami. Pojawią się wkrótce.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
