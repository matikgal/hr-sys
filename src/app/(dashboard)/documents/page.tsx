'use client';

import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Upload, 
  Search, 
  Filter,
  FileBadge,
  Eye,
  Trash2,
  Lock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function DocumentsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const documents = [
    { id: 'DOC-001', name: 'Umowa o pracę - Jan Kowalski', type: 'PDF', size: '2.4 MB', date: '2026-01-15', status: 'signed' },
    { id: 'DOC-002', name: 'Regulamin Pracy 2026', type: 'PDF', size: '1.1 MB', date: '2026-01-01', status: 'available' },
    { id: 'DOC-003', name: 'Certyfikat BHP - IT', type: 'JPG', size: '0.8 MB', date: '2026-03-10', status: 'available' },
    { id: 'DOC-004', name: 'Aneks do umowy - Podwyżka', type: 'PDF', size: '1.5 MB', date: '2026-04-01', status: 'pending' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Baza Dokumentów</h1>
          <p className="text-sm text-muted-foreground mt-1">Bezpieczne przechowywanie i zarządzanie plikami pracowników.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button size="sm" className="h-9">
            <Upload size={16} className="mr-2" /> Prześlij dokument
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-none border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-primary">
              <Lock size={18} /> Bezpieczeństwo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">AES-256</div>
            <p className="text-xs text-muted-foreground mt-1">Dokumenty są w pełni szyfrowane</p>
          </CardContent>
        </Card>
        <Card className="shadow-none border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-emerald-600">
              <FileBadge size={18} /> Podpisane
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">128</div>
            <p className="text-xs text-muted-foreground mt-1">Zweryfikowane cyfrowo</p>
          </CardContent>
        </Card>
        <Card className="shadow-none border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-amber-600">
              <FileText size={18} /> Oczekujące
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">5</div>
            <p className="text-xs text-muted-foreground mt-1">Wymagają Twojej uwagi</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input 
            placeholder="Szukaj dokumentu..." 
            className="pl-10 bg-card border-border shadow-none h-10 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" size="sm" className="h-10 px-4">
          <Filter size={16} className="mr-2" /> Typ pliku
        </Button>
      </div>

      <Card className="shadow-none border-border overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="text-xs font-bold uppercase tracking-wider py-4 pl-6">Nazwa pliku</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider py-4">Data dodania</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider py-4">Rozmiar</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider py-4">Status</TableHead>
              <TableHead className="text-right text-xs font-bold uppercase tracking-wider py-4 pr-6">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc) => (
              <TableRow key={doc.id} className="group transition-colors">
                <TableCell className="py-3 pl-6 font-medium">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded text-blue-600">
                      <FileText size={16} />
                    </div>
                    <span>{doc.name}</span>
                  </div>
                </TableCell>
                <TableCell className="py-3 text-sm text-muted-foreground">{doc.date}</TableCell>
                <TableCell className="py-3 text-sm text-muted-foreground">{doc.size}</TableCell>
                <TableCell className="py-3">
                  <Badge variant={doc.status === 'signed' ? 'default' : 'secondary'} className="text-[10px]">
                    {doc.status === 'signed' ? 'Podpisany' : doc.status === 'pending' ? 'Oczekujący' : 'Dostępny'}
                  </Badge>
                </TableCell>
                <TableCell className="py-3 text-right pr-6">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Eye size={14} /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Download size={14} /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
