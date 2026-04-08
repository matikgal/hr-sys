"use client";

import { useAuth } from "@/context/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { Skeleton } from "@/components/ui/skeleton";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user && pathname !== "/login" && !pathname.includes("/admin/seed")) {
      router.push("/login");
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return (
      <div className="flex h-screen bg-background">
        <div className="w-72 bg-white/40 backdrop-blur-xl border-r border-black/[0.03]">
          <div className="h-24 px-8 flex items-center">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <Skeleton className="h-6 w-32 ml-3" />
          </div>
          <div className="px-4 py-4 space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-2xl" />
            ))}
          </div>
        </div>
        <div className="flex-1 flex flex-col">
          <div className="h-24 border-b border-black/[0.03] bg-white/40 px-10 flex items-center justify-between">
            <Skeleton className="h-10 w-64 rounded-xl" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-10 w-24 rounded-xl" />
            </div>
          </div>
          <main className="p-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-40 w-full rounded-3xl" />
              ))}
            </div>
            <Skeleton className="h-96 w-full rounded-3xl" />
          </main>
        </div>
      </div>
    );
  }

  // Allow login and admin seed pages without requiring full user session for seed
  if (!user && (pathname === "/login" || pathname.includes("/admin/seed"))) {
    return <>{children}</>;
  }

  if (!user) return null;

  return (
    <div className="flex h-screen bg-background selection:bg-black/5 selection:text-black dark:selection:bg-white/10 dark:selection:text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 md:p-10 no-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}
