'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[600px] px-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <AlertTriangle className="text-red-500" size={28} />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">Błąd modułu</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Ten moduł napotkał nieoczekiwany problem. Pozostałe sekcje działają normalnie.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button onClick={reset} className="gap-2">
            <RefreshCw size={14} />
            Spróbuj ponownie
          </Button>
          <Link href="/dashboard">
            <Button variant="outline" className="gap-2">
              <ArrowLeft size={14} />
              Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
