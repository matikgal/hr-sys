'use client';

import React from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  Calendar, 
  ShieldCheck,
  Edit,
  FileText,
  History
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { MOCK_USER } from '@/data/mock-data';

export default function ProfilePage() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Profile Header */}
      <div className="relative">
        <div className="h-48 w-full bg-gradient-to-r from-primary to-accent rounded-3xl overflow-hidden enterprise-shadow">
          <div className="absolute inset-0 opacity-20">
             <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.2),transparent)]"></div>
          </div>
        </div>
        <div className="px-8 -mt-20 flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
            <div className="p-2 bg-background rounded-full enterprise-shadow">
              <Avatar src={MOCK_USER.photoURL} alt={MOCK_USER.displayName || ""} className="w-32 h-32 text-2xl" />
            </div>
            <div className="text-center md:text-left pb-2">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">{MOCK_USER.displayName}</h1>
              <p className="text-secondary font-medium mt-1 flex items-center justify-center md:justify-start gap-2">
                <Briefcase size={16} /> Senior HR Manager
              </p>
            </div>
          </div>
          <div className="pb-2 flex gap-3">
            <Button variant="outline" className="enterprise-shadow bg-background/50 backdrop-blur-sm">
              <FileText size={18} className="mr-2" /> Eksportuj CV
            </Button>
            <Button variant="accent" className="enterprise-shadow">
              <Edit size={18} className="mr-2" /> Edytuj profil
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Contact Info */}
        <div className="space-y-6">
          <Card className="border-none enterprise-shadow bg-card/60">
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-widest text-accent font-bold">Informacje kontaktowe</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0">
                  <Mail size={16} />
                </div>
                <span className="text-secondary break-all">{MOCK_USER.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0">
                  <Phone size={16} />
                </div>
                <span className="text-secondary">+48 600 000 000</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0">
                  <MapPin size={16} />
                </div>
                <span className="text-secondary">Warszawa, Polska</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none enterprise-shadow bg-card/60">
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-widest text-accent font-bold">Szczegóły zatrudnienia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-secondary flex items-center gap-2"><Calendar size={16} /> Data dołączenia</span>
                <span className="font-semibold text-foreground">01.09.2020</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-secondary flex items-center gap-2"><ShieldCheck size={16} /> Uprawnienia</span>
                <span className="font-semibold text-foreground uppercase tracking-tighter text-xs px-2 py-0.5 bg-accent/10 text-accent rounded-full">{MOCK_USER.role}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-secondary flex items-center gap-2"><History size={16} /> Typ umowy</span>
                <span className="font-semibold text-foreground">UOP (Brak limitu)</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-none enterprise-shadow bg-card/60">
            <CardHeader>
              <CardTitle>O mnie</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-secondary leading-relaxed">
                Doświadczony manager HR z ponad 8-letnim stażem w branży technologicznej. Specjalizuję się w budowaniu zespołów inżynierskich, zarządzaniu talentami oraz optymalizacji procesów HR. W HR Nexus odpowiadam za strategię personalną i kulturę organizacyjną.
              </p>
            </CardContent>
          </Card>

          <Card className="border-none enterprise-shadow bg-card/60">
            <CardHeader>
              <CardTitle>Struktura raportowania</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-background/50 border border-border/50">
                  <Avatar src="" fallback="JD" />
                  <div>
                    <p className="font-bold text-sm">Jan Dyrektor</p>
                    <p className="text-xs text-secondary uppercase font-bold tracking-tighter">Przełożony (CEO)</p>
                  </div>
                </div>
                
                <div className="ml-8 border-l-2 border-accent/20 pl-8 space-y-4">
                   <div className="flex items-center gap-4 p-3 rounded-xl bg-accent/10 border border-accent/20">
                    <Avatar src={MOCK_USER.photoURL} alt={MOCK_USER.displayName || ""} />
                    <div>
                      <p className="font-bold text-sm">{MOCK_USER.displayName} (Ty)</p>
                      <p className="text-xs text-secondary uppercase font-bold tracking-tighter">Senior HR Manager</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 ml-8">
                     <div className="flex items-center gap-3 p-3 rounded-xl bg-background/50 border border-border/50">
                        <Avatar src="" fallback="AN" className="w-8 h-8" />
                        <div>
                          <p className="font-bold text-xs">Anna Nowak</p>
                          <p className="text-[10px] text-secondary">HR Specialist</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-background/50 border border-border/50">
                        <Avatar src="" fallback="KW" className="w-8 h-8" />
                        <div>
                          <p className="font-bold text-xs">Kasia Wiśniewska</p>
                          <p className="text-[10px] text-secondary">Recruiter</p>
                        </div>
                      </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
