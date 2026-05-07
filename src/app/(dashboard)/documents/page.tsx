'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  FileText, Download, Upload, Search, Filter,
  FileBadge, Trash2, Lock, X, CloudUpload,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/context/auth-context';
import { uploadDocument } from '@/services/db/documents';
import { useDocuments, useDeleteDocument } from '@/hooks/use-documents';
import type { HRDocument } from '@/types';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  try {
    return format(new Date(iso), 'dd.MM.yyyy', { locale: pl });
  } catch {
    return iso;
  }
}

const STATUS_LABEL: Record<HRDocument['status'], string> = {
  available: 'Dostępny',
  pending: 'Oczekujący',
  signed: 'Podpisany',
};

export default function DocumentsPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: documents = [], isLoading: loading, refetch } = useDocuments();
  const deleteDocumentMutation = useDeleteDocument();

  const filtered = documents.filter((d) =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const signedCount = documents.filter((d) => d.status === 'signed').length;
  const pendingCount = documents.filter((d) => d.status === 'pending').length;

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) setSelectedFile(file);
  }, []);

  const handleUpload = async () => {
    if (!selectedFile || !user) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      await uploadDocument(selectedFile, user.uid, undefined, setUploadProgress);
      await refetch();
      setUploadOpen(false);
      setSelectedFile(null);
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (doc: HRDocument) => {
    if (!confirm(`Usunąć dokument "${doc.name}"?`)) return;
    deleteDocumentMutation.mutate({ id: doc.id, storagePath: doc.storagePath });
  };

  return (
    <div className="max-w-[1440px] mx-auto space-y-6 px-8 py-10 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Baza Dokumentów</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Bezpieczne przechowywanie i zarządzanie plikami pracowników.
          </p>
        </div>
        <Button size="sm" className="h-9" onClick={() => setUploadOpen(true)}>
          <Upload size={16} className="mr-2" /> Prześlij dokument
        </Button>
      </div>

      {/* Stats */}
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
            {loading ? (
              <Skeleton className="h-7 w-12" />
            ) : (
              <div className="text-lg font-bold">{signedCount}</div>
            )}
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
            {loading ? (
              <Skeleton className="h-7 w-12" />
            ) : (
              <div className="text-lg font-bold">{pendingCount}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Wymagają Twojej uwagi</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
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

      {/* Table */}
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
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="py-3 pl-6"><Skeleton className="h-5 w-56" /></TableCell>
                  <TableCell className="py-3"><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell className="py-3"><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell className="py-3"><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell className="py-3 pr-6 text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-muted-foreground text-sm">
                  Brak dokumentów
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((doc) => (
                <TableRow key={doc.id} className="group transition-colors">
                  <TableCell className="py-3 pl-6 font-medium">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 rounded text-blue-600">
                        <FileText size={16} />
                      </div>
                      <span className="truncate max-w-[280px]">{doc.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 text-sm text-muted-foreground">
                    {formatDate(doc.createdAt)}
                  </TableCell>
                  <TableCell className="py-3 text-sm text-muted-foreground">
                    {formatBytes(doc.size)}
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge
                      variant={doc.status === 'signed' ? 'default' : 'secondary'}
                      className="text-[10px]"
                    >
                      {STATUS_LABEL[doc.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3 text-right pr-6">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        aria-label="Pobierz"
                        onClick={() => window.open(doc.downloadURL, '_blank')}
                      >
                        <Download size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        aria-label="Usuń"
                        onClick={() => handleDelete(doc)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={(open) => { if (!uploading) setUploadOpen(open); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Prześlij dokument</DialogTitle>
          </DialogHeader>

          <div
            className={`mt-2 border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
              dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
            />
            <CloudUpload className="mx-auto mb-3 text-muted-foreground" size={36} />
            {selectedFile ? (
              <div className="flex items-center justify-center gap-2">
                <FileText size={16} className="text-primary" />
                <span className="text-sm font-medium text-foreground truncate max-w-[220px]">
                  {selectedFile.name}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Usuń plik"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm font-medium text-foreground">
                  Przeciągnij plik tutaj lub kliknij, aby wybrać
                </p>
                <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG, DOCX — maks. 50 MB</p>
              </>
            )}
          </div>

          {uploading && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Przesyłanie...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setUploadOpen(false)}
              disabled={uploading}
            >
              Anuluj
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
            >
              {uploading ? 'Przesyłanie...' : 'Prześlij'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
