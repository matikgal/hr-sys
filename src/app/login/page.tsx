"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { AlertCircle, Lock, Mail, Building2, ArrowRight, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = "/dashboard";
    } catch (err: any) {
      setError("Nieprawidłowy email lub hasło.");
      console.error(err);
      setLoading(false);
    }
  };

  const QUICK_ACCOUNTS = [
    { label: 'Admin', email: 'admin@hr.local', color: 'text-violet-600' },
    { label: 'HR', email: 'hr@hr.local', color: 'text-blue-600' },
    { label: 'Manager', email: 'manager@hr.local', color: 'text-amber-600' },
    { label: 'Pracownik', email: 'user@hr.local', color: 'text-emerald-600' },
  ] as const;

  const quickLogin = async (email: string) => {
    setLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, "haslo123");
      window.location.href = "/dashboard";
    } catch {
      setError("Błąd szybkiego logowania. Upewnij się, że baza została zainicjowana.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: `radial-gradient(circle, #cbd5e1 1px, transparent 1px)`,
          backgroundSize: '28px 28px'
        }}
      />

      <div className="relative w-full max-w-sm">
        {/* Logo mark */}
        <div className="flex flex-col items-center mb-8">
          <div className="size-12 rounded-xl bg-primary flex items-center justify-center mb-4">
            <Building2 size={20} className="text-white" strokeWidth={2} />
          </div>
          <h1 className="text-xl font-semibold text-foreground">HR Manager</h1>
          <p className="text-[13px] text-muted-foreground mt-1">Zaloguj się do swojego panelu</p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border shadow-sm rounded-2xl overflow-hidden">
          <div className="px-7 py-7">
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2.5 text-[13px]">
                  <AlertCircle size={14} className="shrink-0" strokeWidth={2} />
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="email" className="text-[12px] font-medium text-foreground/70 block">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.8} />
                  <input
                    id="email"
                    type="email"
                    placeholder="email@firma.pl"
                    className="w-full pl-9 pr-4 h-10 bg-background border border-border rounded-lg text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring/40 transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="text-[12px] font-medium text-foreground/70 block">
                  Hasło
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.8} />
                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="w-full pl-9 pr-4 h-10 bg-background border border-border rounded-lg text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring/40 transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-10 bg-primary rounded-lg text-primary-foreground text-[13px] font-medium flex items-center justify-center gap-2 hover:bg-primary/90 active:bg-primary transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    Zaloguj się
                    <ArrowRight size={14} strokeWidth={2.5} />
                  </>
                )}
              </button>
            </form>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-card px-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Szybkie logowanie
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {QUICK_ACCOUNTS.map(({ label, email, color }) => (
                <button
                  key={email}
                  onClick={() => quickLogin(email)}
                  disabled={loading}
                  className="h-9 bg-muted border border-border rounded-lg text-[12px] font-medium hover:bg-accent transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <span className={`size-1.5 rounded-full bg-current ${color}`} />
                  <span className={color}>{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="px-7 py-3.5 border-t border-border bg-muted flex items-center justify-between">
            <p className="text-[11px] text-muted-foreground">Problemy? Skontaktuj się z IT</p>
            <button
              onClick={() => { window.location.href = '/admin/seed'; }}
              className="text-[11px] font-medium text-foreground/70 hover:text-foreground transition-colors"
            >
              Inicjuj bazę →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
