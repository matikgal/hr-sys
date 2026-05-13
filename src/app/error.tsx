'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <html>
      <body className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="text-red-500" size={36} />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-3">Coś poszło nie tak</h1>
          <p className="text-sm text-muted-foreground mb-2">
            Wystąpił nieoczekiwany błąd aplikacji. Spróbuj odświeżyć stronę.
          </p>
          {error.digest && (
            <p className="text-[11px] text-muted-foreground font-mono mb-6">ID błędu: {error.digest}</p>
          )}
          <Button onClick={reset} className="gap-2">
            <RefreshCw size={16} />
            Spróbuj ponownie
          </Button>
        </div>
      </body>
    </html>
  );
}
