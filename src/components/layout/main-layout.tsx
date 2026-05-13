"use client";

import { useAuth } from "@/context/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { Skeleton } from "@/components/ui/skeleton";
import ErrorBoundary from "@/components/ui/error-boundary";
import { ChatPanel } from "@/components/features/chat/ChatPanel";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user && pathname !== "/login" && !pathname.includes("/admin/seed")) {
      router.push("/login");
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return (
      <div className="flex h-screen bg-background">
        <div className="shrink-0 p-5 pr-0" style={{ width: '276px' }}>
          <div className="h-full border border-border bg-card rounded-[18px] shadow-[0_6px_20px_rgba(14,16,20,0.06)] flex flex-col">
            <div className="px-[18px] py-4 border-b border-border flex items-center gap-2.5">
              <Skeleton className="size-[30px] rounded-lg" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="px-[14px] py-3 space-y-1">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <Skeleton key={i} className="h-8 w-full rounded-lg" />
              ))}
            </div>
          </div>
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="h-16 border-b border-border bg-card px-6 flex items-center justify-between shrink-0">
            <Skeleton className="h-9 w-72 rounded-lg" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <Skeleton className="h-9 w-9 rounded-lg" />
              <Skeleton className="h-9 w-32 rounded-lg" />
            </div>
          </div>
          <main className="p-8">
            <div className="grid grid-cols-4 gap-5 mb-6">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-28 w-full rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-72 w-full rounded-xl" />
          </main>
        </div>
      </div>
    );
  }

  if (!user && (pathname === "/login" || pathname.includes("/admin/seed"))) {
    return <>{children}</>;
  }

  if (!user) return null;

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar wrapper — padding creates the floating tile gap */}
      <div
        className="shrink-0 p-5 pr-0 overflow-hidden"
        style={{
          width: sidebarCollapsed ? '88px' : '276px',
          transition: 'width 300ms ease-in-out',
        }}
      >
        <Sidebar collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onChatOpen={() => setChatOpen(true)} />
        <main className="flex-1 overflow-y-auto no-scrollbar">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>
      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}
