import { Clock3, LogOut, UserRound, WalletCards } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCustomerAuth } from "@/customer/auth/customer-auth-context";
import { cn } from "@/lib/utils";

const navigation = [
  { to: "/customer/services", label: "Dịch vụ", icon: WalletCards },
  { to: "/customer/transactions", label: "Lịch sử", icon: Clock3 },
  { to: "/customer/profile", label: "Cá nhân", icon: UserRound },
];

export function CustomerShell() {
  const auth = useCustomerAuth();
  const navigate = useNavigate();

  const logout = async () => {
    try {
      await auth.logout();
    } catch {
      // Local customer state is cleared by the mutation even when the API is unavailable.
    } finally {
      navigate("/customer/login", { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col bg-slate-900 shadow-2xl shadow-black/30">
        <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between border-b border-slate-800 bg-slate-900/95 px-4 py-3 backdrop-blur sm:px-6">
          <div className="min-w-0">
            <p className="text-xs text-slate-400">Xin chào,</p>
            <p className="truncate font-semibold">{auth.customer?.displayName || auth.customer?.phone}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-300 hover:bg-slate-800 hover:text-white"
            onClick={() => void logout()}
            disabled={auth.isLoggingOut}
            aria-label="Đăng xuất"
          >
            <LogOut className="size-5" />
          </Button>
        </header>

        <main className="flex-1 p-4 pb-24 sm:p-6 sm:pb-28 lg:p-8 lg:pb-28">
          <Outlet />
        </main>

        <nav
          className="fixed inset-x-0 bottom-0 z-30 mx-auto grid w-full max-w-5xl grid-cols-3 border-t border-slate-800 bg-slate-900/95 px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur"
          aria-label="Điều hướng customer"
        >
          {navigation.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => cn(
                "flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg text-xs font-medium transition-colors",
                isActive ? "bg-blue-500/15 text-blue-400" : "text-slate-400 hover:bg-slate-800 hover:text-white",
              )}
            >
              <Icon className="size-5" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
