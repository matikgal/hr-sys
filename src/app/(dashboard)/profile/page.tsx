'use client';

import React from 'react';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Mail, 
  Briefcase, 
  Calendar, 
  MapPin, 
  Shield, 
  Edit,
  FileText,
  Award,
  Clock
} from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="relative h-48 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
        <Button variant="outline" size="sm" className="absolute top-4 right-4 bg-white/10 border-white/20 text-white hover:bg-white/20">
          <Edit size={14} className="mr-2" /> Edytuj tło
        </Button>
      </div>

      <div className="relative px-6 -mt-20">
        <div className="flex flex-col md:flex-row items-end gap-6">
          <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
            <AvatarImage src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.displayName}`} />
            <AvatarFallback className="text-2xl">{user.displayName?.[0] || 'U'}</AvatarFallback>
          </Avatar>
          <div className="flex-1 pb-2 space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-foreground">{user.displayName || 'Użytkownik Systemu'}</h1>
              <Badge className="bg-primary/10 text-primary border-none">{user.role?.toUpperCase()}</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><Briefcase size={14} /> Software Engineer</span>
              <span className="flex items-center gap-1.5"><MapPin size={14} /> Warszawa, PL</span>
              <span className="flex items-center gap-1.5"><Calendar size={14} /> Dołączył w 2024</span>
            </div>
          </div>
          <div className="flex gap-2 pb-2">
            <Button variant="outline" size="sm">
              <Mail size={14} className="mr-2" /> Wiadomość
            </Button>
            <Button size="sm">
              <Edit size={14} className="mr-2" /> Edytuj profil
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6 lg:col-span-1">
          <Card className="shadow-none border-border">
            <CardHeader>
              <CardTitle className="text-base">Dane kontaktowe</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <div className="p-2 bg-muted rounded-lg text-muted-foreground"><Mail size={16} /></div>
                <div>
                  <p className="font-medium">E-mail służbowy</p>
                  <p className="text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="p-2 bg-muted rounded-lg text-muted-foreground"><Shield size={16} /></div>
                <div>
                  <p className="font-medium">Uprawnienia</p>
                  <p className="text-muted-foreground">{user.role}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none border-border">
            <CardHeader>
              <CardTitle className="text-base">Osiągnięcia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                <Award className="text-amber-600" size={24} />
                <div>
                  <p className="text-sm font-bold text-amber-900">Top Performer 2025</p>
                  <p className="text-[10px] text-amber-700">Wyróżnienie za wyniki techniczne</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="shadow-none border-border">
              <CardContent className="pt-6 text-center space-y-1">
                <FileText className="mx-auto text-blue-600 mb-2" size={20} />
                <p className="text-2xl font-bold">12</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Projekty</p>
              </CardContent>
            </Card>
            <Card className="shadow-none border-border">
              <CardContent className="pt-6 text-center space-y-1">
                <Clock className="mx-auto text-emerald-600 mb-2" size={20} />
                <p className="text-2xl font-bold">160h</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">W tym msc</p>
              </CardContent>
            </Card>
            <Card className="shadow-none border-border">
              <CardContent className="pt-6 text-center space-y-1">
                <Calendar className="mx-auto text-amber-600 mb-2" size={20} />
                <p className="text-2xl font-bold">5</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Dni urlopu</p>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-none border-border">
            <CardHeader>
              <CardTitle className="text-base">O mnie</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Pasjonat nowoczesnych technologii webowych i architektury systemowej. W Nexus Corp zajmuję się rozwojem kluczowych modułów platformy HR, dbając o wysoką jakość kodu i skalowalność rozwiązań. W wolnym czasie dzielę się wiedzą na meetupach i eksperymentuję z AI.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
