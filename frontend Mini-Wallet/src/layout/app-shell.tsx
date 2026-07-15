import {
  Activity, ChevronDown, CircleDollarSign, CirclePlay, Landmark, LayoutDashboard,
  Menu, Settings2, Store, Users, WalletCards, X,
} from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "@/auth/auth-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navigation = [
  { to: "/", label: "Tổng quan", icon: LayoutDashboard, end: true },
  { to: "/services", label: "Dịch vụ", icon: Settings2 },
  { to: "/providers", label: "Nhà cung cấp", icon: Store },
  { to: "/customers", label: "Khách hàng", icon: Users },
  { to: "/pockets", label: "Ví", icon: WalletCards },
  { to: "/operations/trigger", label: "Cash-in", icon: CirclePlay },
  { to: "/transactions", label: "Giao dịch", icon: Activity },
  { to: "/ledger/entries", label: "Sổ cái", icon: Landmark },
];

function SidebarContent({ close }: { close?: () => void }) {
  return (
    <>
      <div className="flex h-16 items-center gap-3 border-b px-5">
        <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground"><CircleDollarSign className="size-5" /></span>
        <div><p className="font-semibold leading-none">Mini Wallet</p><p className="mt-1 text-xs text-muted-foreground">Officer Portal</p></div>
      </div>
      <nav className="flex-1 space-y-1 p-3" aria-label="Điều hướng chính">
        {navigation.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={close}
            className={({ isActive }) => cn(
              "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
              isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4" />{label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t p-4 text-xs text-muted-foreground">Mini Wallet · Internal Operations</div>
    </>
  );
}

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const auth = useAuth();

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="hidden h-screen flex-col border-r bg-card lg:sticky lg:top-0 lg:flex"><SidebarContent /></aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-slate-950/50" aria-label="Đóng điều hướng" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex h-full w-72 flex-col bg-card shadow-xl">
            <Button variant="ghost" size="icon" className="absolute right-2 top-2" onClick={() => setMobileOpen(false)} aria-label="Đóng"><X /></Button>
            <SidebarContent close={() => setMobileOpen(false)} />
          </aside>
        </div>
      ) : null}

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card/95 px-4 backdrop-blur sm:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Mở điều hướng"><Menu /></Button>
          <div className="hidden text-sm text-muted-foreground lg:block">Không gian vận hành</div>
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-full bg-muted text-sm font-semibold" aria-hidden>
              {(auth.officer?.displayName || "O").slice(0, 1).toUpperCase()}
            </span>
            <div className="hidden text-right sm:block"><p className="text-sm font-medium leading-none">{auth.officer?.displayName}</p><p className="mt-1 text-xs text-muted-foreground">{auth.officer?.phone}</p></div>
            <Button variant="ghost" size="icon" onClick={() => void auth.logout().catch(() => undefined)} disabled={auth.isLoggingOut} aria-label="Đăng xuất"><ChevronDown className="size-4" /></Button>
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8"><Outlet /></main>
      </div>
    </div>
  );
}
