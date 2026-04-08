"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { AlertCircle, Lock, Mail } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError("Nieprawidłowy email lub hasło.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (role: 'admin' | 'user') => {
    setLoading(true);
    const quickEmail = role === 'admin' ? "admin@hr.local" : "user@hr.local";
    try {
      await signInWithEmailAndPassword(auth, quickEmail, "haslo123");
      router.push("/dashboard");
    } catch (err: any) {
      setError("Błąd szybkiego logowania. Upewnij się, że baza została zainicjowana.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">HR System</CardTitle>
          <CardDescription className="text-center">
            Zaloguj się do swojego panelu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md flex items-center gap-2 text-sm">
                <AlertCircle size={16} />
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="name@company.com" 
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Hasło</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input 
                  id="password" 
                  type="password" 
                  className="pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Logowanie..." : "Zaloguj się"}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Szybkie logowanie</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" onClick={() => quickLogin('admin')} disabled={loading}>
              Admin
            </Button>
            <Button variant="outline" onClick={() => quickLogin('user')} disabled={loading}>
              Pracownik
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col text-center text-xs text-gray-500 space-y-2">
          <p>Potrzebujesz pomocy? Skontaktuj się z działem IT.</p>
          <p className="text-blue-500 cursor-pointer" onClick={() => router.push('/admin/seed')}>
            Zainicjuj bazę danych
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
