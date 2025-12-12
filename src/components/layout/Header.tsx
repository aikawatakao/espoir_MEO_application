"use client";

import { User, Settings, LogOut, Store, Menu } from "lucide-react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet";
import { useStore } from "../../contexts/StoreContext";
import { useState } from "react";
import { LayoutDashboard, FileText, MessageSquare, Ticket } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export function Header() {
  const { stores, currentStore, setCurrentStore } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { id: "dashboard", label: "ダッシュボード", icon: LayoutDashboard, href: "/dashboard" },
    { id: "surveys", label: "アンケート", icon: FileText, href: "/surveys" },
    { id: "reviews", label: "口コミ", icon: MessageSquare, href: "/reviews" },
    { id: "coupons", label: "クーポン", icon: Ticket, href: "/coupons" },
  ];

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed", error);
      // Force redirect anyway
      router.push("/login");
    }
  };

  const handleSettings = () => {
    router.push("/settings");
  };

  return (
    <header className="border-b bg-card">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3 md:gap-4">
          {/* モバイルメニューボタン */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <h1 className="text-lg md:text-xl">口コミ支援ダッシュボード</h1>

          {/* 店舗セレクタ - デスクトップのみ表示 */}
          <div className="hidden md:flex items-center gap-2 border-l pl-4">
            <Store className="h-4 w-4 text-muted-foreground" />
            <Select
              value={currentStore?.id}
              onValueChange={(value) => {
                const store = stores.find((s) => s.id === value);
                if (store) setCurrentStore(store);
              }}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="店舗を選択" />
              </SelectTrigger>
              <SelectContent>
                {stores.map((store) => (
                  <SelectItem key={store.id} value={store.id}>
                    {store.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleSettings}>
              <Settings className="mr-2 h-4 w-4" />
              設定
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              ログアウト
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* モバイルナビゲーションドロワー */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-[280px] p-0">
          <SheetHeader className="border-b p-4">
            <SheetTitle>メニュー</SheetTitle>
          </SheetHeader>

          {/* 店舗セレクタ - モバイル */}
          <div className="border-b p-4">
            <label className="text-sm mb-2 block text-muted-foreground">現在の店舗</label>
            <Select
              value={currentStore?.id}
              onValueChange={(value) => {
                const store = stores.find((s) => s.id === value);
                if (store) setCurrentStore(store);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="店舗を選択" />
              </SelectTrigger>
              <SelectContent>
                {stores.map((store) => (
                  <SelectItem key={store.id} value={store.id}>
                    {store.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ナビゲーションメニュー */}
          <div className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.id === "surveys" && pathname.startsWith("/surveys"));

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`relative flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-all ${isActive
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
        </SheetContent>
      </Sheet>
    </header>
  );
}