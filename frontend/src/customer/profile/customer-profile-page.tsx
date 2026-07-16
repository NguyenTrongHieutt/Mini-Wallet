import { CalendarDays, LockKeyhole, Phone, RefreshCw, UserRound, Wallet } from "lucide-react";
import { appConfig } from "@/config/app-config";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCustomerAuth } from "@/customer/auth/customer-auth-context";
import type { CustomerCurrency } from "@/customer/types";
import { cn } from "@/lib/utils";
import { formatDateOnly, formatNumber } from "@/shared/formatters";
import { useCustomerWallet } from "./customer-wallet-queries";

export function CustomerProfilePage() {
  const { customer } = useCustomerAuth();
  const wallet = useCustomerWallet(appConfig.defaultCurrency);
  const pocket = wallet.data;
  const currency = currencyCode(pocket?.currency);

  return (
    <section aria-labelledby="customer-profile-title">
      <header>
        <p className="text-sm font-medium text-blue-400">Mini Wallet</p>
        <h1 id="customer-profile-title" className="mt-1 text-2xl font-semibold">Cá nhân</h1>
        <p className="mt-1 text-sm text-slate-400">Thông tin tài khoản và số dư ví của bạn.</p>
      </header>

      <Card className="mt-6 overflow-hidden border-blue-500/30 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-blue-100">Số dư khả dụng</p>
              {wallet.isPending ? (
                <div aria-label="Đang tải số dư" className="mt-2 h-10 w-52 animate-pulse rounded bg-white/15" />
              ) : pocket ? (
                <p className="mt-1 text-3xl font-semibold sm:text-4xl">
                  {formatNumber(Number(pocket.balance))} {currency}
                </p>
              ) : (
                <p className="mt-1 text-3xl font-semibold sm:text-4xl">
                  — {currency}
                </p>
              )}
            </div>
            <div className="rounded-2xl bg-white/15 p-3"><Wallet className="size-7" /></div>
          </div>
          {pocket && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/20 pt-4 text-sm">
              <span>{pocket.name}</span>
              <span className={cn("rounded-full px-2.5 py-1 font-semibold",
                pocket.status === "locked" ? "bg-amber-300/20 text-amber-100" : "bg-emerald-300/20 text-emerald-100")}>
                {pocket.status === "locked" ? "Đã khóa" : "Đang hoạt động"}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {wallet.isError && (
        <Alert className="mt-4 border-red-500/30 bg-red-500/10 text-red-200">
          <p>Không thể tải số dư ví. Vui lòng thử lại.</p>
          <Button type="button" size="sm" variant="outline" onClick={() => void wallet.refetch()}
            className="mt-3 border-red-400/40 bg-transparent text-red-100 hover:bg-red-500/20">
            Thử lại
          </Button>
        </Alert>
      )}

      <div className="mt-4 flex justify-end">
        <Button type="button" variant="outline" disabled={wallet.isFetching} onClick={() => void wallet.refetch()}
          className="border-slate-600 bg-transparent text-slate-200 hover:bg-slate-800">
          <RefreshCw className={cn("mr-2 size-4", wallet.isFetching && "animate-spin")} />Làm mới số dư
        </Button>
      </div>

      <Card className="mt-4 border-slate-700 bg-slate-800 text-slate-50">
        <CardHeader><CardTitle>Thông tin tài khoản</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <ProfileRow icon={UserRound} label="Tên hiển thị" value={customer?.displayName || "—"} />
          <ProfileRow icon={Phone} label="Số điện thoại" value={customer?.phone || "—"} />
          <ProfileRow icon={LockKeyhole} label="Trạng thái"
            value={customer?.status === "locked" ? "Đã khóa" : "Đang hoạt động"} />
          <ProfileRow icon={CalendarDays} label="Ngày tham gia" value={formatDate(customer?.createdAt)} />
        </CardContent>
      </Card>
    </section>
  );
}

function ProfileRow({ icon: Icon, label, value }: {
  icon: typeof UserRound;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="rounded-lg bg-slate-700 p-2 text-blue-300"><Icon className="size-4" /></div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="truncate text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function currencyCode(currency?: CustomerCurrency | string) {
  return typeof currency === "string"
    ? currency
    : currency?.code || appConfig.defaultCurrency;
}

function formatDate(value?: string) {
  if (!value) return "—";
  return formatDateOnly(value);
}
