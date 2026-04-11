'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Clock, Calendar, UserPlus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface StatsCardsProps {
  stats?: {
    totalEmployees: number;
    presentToday: number;
    pendingLeaves: number;
    activeRecruitments: number;
  };
  loading?: boolean;
}

export function StatsCards({ stats, loading }: StatsCardsProps) {
  const cards = [
    {
      title: "Pracownicy",
      value: stats?.totalEmployees,
      icon: Users,
      color: "text-blue-600",
      description: "Całkowite zatrudnienie"
    },
    {
      title: "Obecni",
      value: stats?.presentToday,
      icon: Clock,
      color: "text-emerald-600",
      description: "Dzisiejsza frekwencja"
    },
    {
      title: "Wnioski",
      value: stats?.pendingLeaves,
      icon: Calendar,
      color: "text-amber-600",
      description: "Oczekujące na decyzję"
    },
    {
      title: "Rekrutacje",
      value: stats?.activeRecruitments,
      icon: UserPlus,
      color: "text-purple-600",
      description: "Aktywne procesy"
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, i) => (
        <Card key={i} className="shadow-none border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {card.title}
            </CardTitle>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {card.description}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
