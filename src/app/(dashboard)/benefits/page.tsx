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
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Benefit } from '@/types';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';
import { useBenefitsCatalog, useEmployeeBenefits, useEnrollBenefit, useUnenrollBenefit } from '@/hooks/use-benefits';

const EMPLOYEE_ID = 'EMP-001';

export default function BenefitsPage() {
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const { data: benefits = [], isLoading: benefitsLoading } = useBenefitsCatalog();
  const { data: enrolledIds = [], isLoading: enrolledLoading } = useEmployeeBenefits(EMPLOYEE_ID);
  const loading = benefitsLoading || enrolledLoading;

  const enrollMutation = useEnrollBenefit(EMPLOYEE_ID);
  const unenrollMutation = useUnenrollBenefit(EMPLOYEE_ID);
  const isSubmitting = enrollMutation.isPending || unenrollMutation.isPending
    ? (enrollMutation.variables ?? unenrollMutation.variables ?? null)
    : null;

  const budgetLimit = 500;

  const handleEnroll = (benefitId: string) => {
    enrollMutation.mutate(benefitId, {
      onError: (err: any) => {
        setError(err.message);
        setTimeout(() => setError(null), 5000);
      },
    });
  };

  const handleUnenroll = (benefitId: string) => {
    unenrollMutation.mutate(benefitId);
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
    </div>
  );
}
