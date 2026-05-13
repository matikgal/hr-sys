'use client';

import React, { useState } from 'react';
import { 
  Heart, 
  Coffee, 
  Zap, 
  Dumbbell, 
  ShieldCheck, 
  Gift,
  Plus,
  X,
  AlertCircle,
  Wallet,
  Check,
  CreditCard,
  ExternalLink,
  ArrowRight,
  Trash2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Benefit } from '@/types';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';
import { 
  useBenefitsCatalog, 
  useEmployeeBenefits, 
  useEnrollBenefit, 
  useUnenrollBenefit,
  useCreateBenefit,
  useDeleteBenefit
} from '@/hooks/use-benefits';

export default function BenefitsPage() {
  const { user } = useAuth();
  const canManage = user?.role === 'admin' || user?.role === 'hr' || user?.role === 'manager';
  
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newProvider, setNewProvider] = useState('');
  const [newCost, setNewCost] = useState('100');

  const { data: benefits = [], isLoading: benefitsLoading } = useBenefitsCatalog();
  const { data: enrolledIds = [], isLoading: enrolledLoading } = useEmployeeBenefits(user?.uid);
  const loading = benefitsLoading || enrolledLoading;

  const enrollMutation = useEnrollBenefit(user?.uid ?? '');
  const unenrollMutation = useUnenrollBenefit(user?.uid ?? '');
  const createMutation = useCreateBenefit();
  const deleteMutation = useDeleteBenefit();
  
  const isSubmitting = enrollMutation.isPending || unenrollMutation.isPending
    ? (enrollMutation.variables ?? unenrollMutation.variables ?? null)
    : null;

  const budgetLimit = 500;

  const handleEnroll = (benefitId: string) => {
    if (!user?.uid) return;
    enrollMutation.mutate(benefitId, {
      onError: (err: any) => {
        setError(err.message);
        setTimeout(() => setError(null), 5000);
      },
    });
  };

  const handleUnenroll = (benefitId: string) => {
    if (!user?.uid) return;
    unenrollMutation.mutate(benefitId);
  };

  const handleCreate = () => {
    if (!newName.trim() || !newProvider.trim() || !newCost) return;
    createMutation.mutate({
      name: newName.trim(),
      provider: newProvider.trim(),
      monthlyCost: parseInt(newCost) || 0
    }, {
      onSuccess: () => {
        setShowAdd(false);
        setNewName('');
        setNewProvider('');
        setNewCost('100');
      }
    });
  };

  const handleDelete = (benefitId: string) => {
    deleteMutation.mutate(benefitId);
  };

  const currentSpend = benefits
    .filter(b => enrolledIds.includes(b.id))
    .reduce((total, b) => total + b.monthlyCost, 0);

  const budgetPercentage = (currentSpend / budgetLimit) * 100;

  const getBenefitIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('medyczna')) return <Heart className="size-4" />;
    if (n.includes('multisport') || n.includes('siłownia')) return <Dumbbell className="size-4" />;
    if (n.includes('kawa') || n.includes('śniadania')) return <Coffee className="size-4" />;
    if (n.includes('ubezpieczenie')) return <ShieldCheck className="size-4" />;
    return <Zap className="size-4" />;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 px-8 py-10 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-border/50">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground uppercase">Cafeteria</h1>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-2">Manage your allowances and perks.</p>
        </div>
        <div className="flex items-center gap-4">
          {canManage && (
            <Button size="sm" className="h-10" onClick={() => setShowAdd(true)}>
              <Plus className="mr-2" size={16} /> Dodaj benefit
            </Button>
          )}
          <Button variant="outline" size="sm" className="h-10">
            <CreditCard className="mr-2" /> My Cards
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-start">
        <div className="md:col-span-2 space-y-10">
          <section>
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-6 flex items-center gap-2">
              <div className="h-px w-4 bg-border"></div>
              Budget Overview
            </h2>
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-4xl font-black text-foreground">{currentSpend} <span className="text-xl">PLN</span></div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Monthly utilization of {budgetLimit} PLN</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black uppercase tracking-tighter">{Math.round(budgetPercentage)}% consumed</span>
                </div>
              </div>
              <div className="h-1 w-full bg-muted overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500 ease-out" 
                  style={{ width: `${Math.min(100, budgetPercentage)}%` }}
                ></div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-6 flex items-center gap-2">
              <div className="h-px w-4 bg-border"></div>
              Available Perks
            </h2>
            <div className="border-t border-border/50">
              {loading ? (
                [1, 2, 3].map(i => <div key={i} className="py-6 border-b border-border/50"><Skeleton className="h-12 w-full" /></div>)
              ) : benefits.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  Brak dostępnych benefitów w katalogu.
                </div>
              ) : (
                benefits.map((benefit) => {
                  const isEnrolled = enrolledIds.includes(benefit.id);
                  const canAfford = currentSpend + benefit.monthlyCost <= budgetLimit;
                  
                  return (
                    <div 
                      key={benefit.id} 
                      className={cn(
                        "group py-6 border-b border-border/50 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors",
                        isEnrolled && "bg-accent/50 px-4 -mx-4"
                      )}
                    >
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          "p-2.5 rounded-none border border-border flex items-center justify-center transition-colors",
                          isEnrolled ? "bg-primary text-primary-foreground border-black" : "bg-card text-muted-foreground"
                        )}>
                          {getBenefitIcon(benefit.name)}
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="text-sm font-bold uppercase tracking-tight text-foreground">{benefit.name}</h3>
                            {isEnrolled && <Badge className="rounded-none bg-emerald-500 hover:bg-emerald-500 text-[9px] h-4">Active</Badge>}
                          </div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">{benefit.provider} • {benefit.monthlyCost} PLN / month</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {isEnrolled ? (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 font-black h-8"
                            onClick={() => handleUnenroll(benefit.id)}
                            disabled={isSubmitting === benefit.id}
                          >
                            <X className="mr-1.5" /> REMOVE
                          </Button>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className={cn(
                              "font-black h-8 border-border",
                              !canAfford && "opacity-30 cursor-not-allowed"
                            )}
                            onClick={() => handleEnroll(benefit.id)}
                            disabled={isSubmitting === benefit.id || !canAfford}
                          >
                            {isSubmitting === benefit.id ? "..." : <><Plus className="mr-1.5" /> ADD PERK</>}
                          </Button>
                        )}
                        {canManage && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => handleDelete(benefit.id)}
                            disabled={deleteMutation.isPending}
                            title="Usuń benefit"
                          >
                            <Trash2 size={16} />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>

        <div className="space-y-10">
          <section className="bg-muted p-8 border border-border/50">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">Support</h2>
            <p className="text-xs text-muted-foreground leading-relaxed mb-6">Need help with your benefits or have a technical issue with the cafeteria platform?</p>
            <Button variant="outline" size="sm" className="w-full border-border bg-card">
              Contact Admin <ArrowRight className="ml-2" />
            </Button>
          </section>

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 flex items-start gap-3">
              <AlertCircle className="text-red-600 size-4 mt-0.5" />
              <div className="text-[10px] text-red-800 font-bold uppercase tracking-tight leading-relaxed">
                {error}
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nowy benefit</DialogTitle>
            <DialogDescription>Dodaj nowy benefit do katalogu w platformie Cafeteria.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="benefit-name">Nazwa benefitu</Label>
              <Input
                id="benefit-name"
                placeholder="np. Karta Multisport Plus"
                value={newName}
                onChange={e => setNewName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="benefit-provider">Dostawca</Label>
              <Input
                id="benefit-provider"
                placeholder="np. Benefit Systems"
                value={newProvider}
                onChange={e => setNewProvider(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="benefit-cost">Koszt miesięczny (PLN)</Label>
              <Input
                id="benefit-cost"
                type="number"
                min="0"
                placeholder="100"
                value={newCost}
                onChange={e => setNewCost(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>
              Anuluj
            </Button>
            <Button onClick={handleCreate} disabled={!newName.trim() || !newProvider.trim() || createMutation.isPending}>
              {createMutation.isPending ? 'Dodawanie...' : 'Dodaj benefit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
