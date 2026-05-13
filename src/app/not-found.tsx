'use client';

import Link from 'next/link';
import { FileQuestion, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-6">
          <FileQuestion className="text-muted-foreground" size={36} />
        </div>
        <h1 className="text-6xl font-bold text-foreground mb-2">404</h1>
        <h2 className="text-xl font-semibold text-foreground mb-3">Strona nie istnieje</h2>
        <p className="text-sm text-muted-foreground mb-8">
          Podany adres URL nie odpowiada żadnej stronie w systemie. Sprawdź adres lub wróć do panelu głównego.
        </p>
        <Link href="/dashboard">
          <Button className="gap-2">
            <ArrowLeft size={16} />
            Wróć do dashboardu
          </Button>
        </Link>
      </div>
    </div>
  );
}
