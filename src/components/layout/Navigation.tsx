"use client";

import { LayoutDashboard, FileText, MessageSquare, Ticket, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavigationProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Navigation({ mobileOpen, onMobileClose }: NavigationProps) {
  const pathname = usePathname();

  const navItems = [
    { id: "dashboard", label: "ダッシュボード", icon: LayoutDashboard, href: "/dashboard" },
    { id: "surveys", label: "アンケート", icon: FileText, href: "/surveys" },
    { id: "reviews", label: "口コミ", icon: MessageSquare, href: "/reviews" },
    { id: "coupons", label: "クーポン", icon: Ticket, href: "/coupons" },
    { id: "settings", label: "設定", icon: Settings, href: "/settings" },
  ];

  const navContent = (
    <div className="space-y-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || (item.id === "surveys" && (pathname?.startsWith("/surveys") ?? false));

        return (
          <Link
            key={item.id}
            href={item.href}
            onClick={onMobileClose}
            className={`relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all ${isActive
              ? "bg-accent text-primary"
              : "text-foreground hover:bg-accent/50"
              }`}
          >
            {isActive && (
              <div className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
            )}
            <Icon className="h-5 w-5 shrink-0" />
            <span className="text-sm font-medium">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );

  return (
    <>
      {/* デスクトップ表示 */}
      <nav className="hidden md:flex w-64 flex-col border-r bg-card p-3">
        {navContent}
      </nav>
    </>
  );
}