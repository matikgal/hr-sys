'use client';

import React from 'react';
import { Building2, Key, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen bg-background overflow-hidden">
      {/* Left side: Branding/Visual */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-primary items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-accent/20 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-accent/10 rounded-full blur-[120px]"></div>
        </div>
        
        <div className="relative z-10 max-w-lg text-primary-foreground space-y-8 animate-in slide-in-from-left duration-700">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center">
              <Building2 size={28} className="text-accent-foreground" />
            </div>
            <span className="text-4xl font-bold tracking-tight">HR Nexus</span>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-5xl font-extrabold leading-[1.1]">
              Przyszłość zarządzania ludźmi zaczyna się tutaj.
            </h1>
            <p className="text-xl text-primary-foreground/70 leading-relaxed font-light">
              Nowoczesna platforma HR klasy enterprise, która łączy intuicyjny design z potężną analityką. Zadbaj o swój zespół z HR Nexus.
            </p>
          </div>

          <div className="pt-8 flex items-center gap-8">
            <div className="space-y-1">
              <p className="text-3xl font-bold">500+</p>
              <p className="text-sm text-primary-foreground/60 uppercase tracking-widest">Firm partnerskich</p>
            </div>
            <div className="w-px h-12 bg-primary-foreground/20"></div>
            <div className="space-y-1">
              <p className="text-3xl font-bold">98%</p>
              <p className="text-sm text-primary-foreground/60 uppercase tracking-widest">Zadowolenia HR</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background relative">
        <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="text-center space-y-2">
            <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
              <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center text-accent-foreground">
                <Building2 size={24} />
              </div>
              <span className="text-2xl font-bold tracking-tight text-foreground">HR Nexus</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Witaj ponownie</h2>
            <p className="text-secondary">Wprowadź swoje dane, aby uzyskać dostęp do panelu.</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground ml-1" htmlFor="email">Email</label>
              <Input id="email" type="email" placeholder="jan.nowak@firma.pl" className="h-12" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label className="text-sm font-medium text-foreground" htmlFor="password">Hasło</label>
                <Link href="#" className="text-xs text-accent hover:underline font-medium">Zapomniałeś hasła?</Link>
              </div>
              <Input id="password" type="password" placeholder="••••••••" className="h-12" />
            </div>
            
            <Button 
              className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20" 
              variant="primary"
              onClick={() => router.push('/dashboard')}
            >
              Zaloguj się
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-4 text-secondary font-medium tracking-widest">Lub kontynuuj przez</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="h-11 border-border/50 hover:bg-muted/50">
              <Key className="mr-2 h-4 w-4" /> SSO
            </Button>
            <Button variant="outline" className="h-11 border-border/50 hover:bg-muted/50">
              <Mail className="mr-2 h-4 w-4" /> Google
            </Button>
          </div>

          <p className="text-center text-sm text-secondary">
            Nie masz konta? <Link href="#" className="text-accent hover:underline font-semibold">Skontaktuj się z administratorem</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
