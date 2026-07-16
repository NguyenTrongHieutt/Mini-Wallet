import { ArrowLeft, RefreshCw } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { customerHistoryErrorMessage } from "./customer-history-api";
import { useCustomerTransactionDetail } from "./customer-history-queries";
import { formatDateTime, formatMoney, TransactionStatus } from "./customer-transaction-list-page";
import type { CustomerTransactionParty } from "./types";

export function CustomerTransactionDetailPage() {
  const transactionId = decodeURIComponent(useParams().transactionId ?? "");
  const query = useCustomerTransactionDetail(transactionId);

  if (query.isPending) {
    return (
      <section aria-label="Đang tải chi tiết giao dịch">
        <BackLink />
        <div className="mt-6 h-80 animate-pulse rounded-2xl bg-slate-800" />
      </section>
    );
  }
  if (query.isError || !query.data) {
    return (
      <section>
        <BackLink />
        <Alert className="mt-6 border-red-500/30 bg-red-500/10 text-red-200">
          <p>{customerHistoryErrorMessage(query.error)}</p>
          <Button type="button" size="sm" variant="outline" onClick={() => void query.refetch()}
            className="mt-3 border-red-400/40 bg-transparent text-red-100 hover:bg-red-500/20">
            Thử lại
          </Button>
        </Alert>
      </section>
    );
  }

  const { transaction, trail, entries } = query.data;
  const currency = transaction.currency?.code || "VND";
  return (
    <section>
      <div className="flex items-center justify-between gap-3">
        <BackLink />
        <Button type="button" size="sm" variant="ghost" disabled={query.isFetching}
          onClick={() => void query.refetch()} className="text-slate-300 hover:bg-slate-800 hover:text-white">
          <RefreshCw className="mr-2 size-4" />Làm mới
        </Button>
      </div>
      <header className="mt-5">
        <div className="flex flex-wrap items-center gap-2">
          <TransactionStatus status={transaction.status} />
          <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-300">
            {transaction.direction === "sent" ? "Đã gửi" : "Đã nhận"}
          </span>
        </div>
        <h1 className="mt-3 break-all font-mono text-xl font-semibold">{transaction.code}</h1>
        <p className="mt-1 break-all text-xs text-slate-500">Tham chiếu: {transaction.transRefId}</p>
      </header>

      <Card className="mt-6 border-blue-500/30 bg-gradient-to-br from-blue-600/25 to-slate-800 text-slate-50">
        <CardContent className="p-5">
          <p className="text-sm text-slate-300">Tổng giao dịch</p>
          <p className="mt-1 text-3xl font-semibold">{formatMoney(transaction.totalAmount, currency)}</p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <Amount label="Số tiền" value={formatMoney(transaction.amount, currency)} />
            <Amount label="Phí" value={formatMoney(transaction.fee, currency)} />
          </div>
        </CardContent>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <DetailCard title="Thông tin giao dịch" rows={[
          ["Dịch vụ", `${transaction.service.name} (${transaction.service.code})`],
          ["Tiền tệ", transaction.currency.name ? `${transaction.currency.name} (${currency})` : currency],
          ["Nội dung", transaction.message || "—"],
          ["Khởi tạo", formatDateTime(transaction.createdAt)],
          ["Cập nhật", formatDateTime(transaction.updatedAt)],
        ]} />
        <DetailCard title="Các bên giao dịch" rows={[
          ["Bên gửi", partyLabel(transaction.sender)],
          ["Bên nhận", partyLabel(transaction.receiver)],
        ]} />
      </div>

      {(trail || (entries?.length ?? 0) > 0) && (
        <DetailCard className="mt-4" title="Thông tin bổ sung" rows={[
          ["Trạng thái xử lý", trail?.status || "—"],
          ["Hết hạn", formatDateTime(trail?.expiredAt)],
          ["Mã lỗi", trail?.errorCode || "—"],
          ["Số bút toán", String(entries?.length ?? 0)],
        ]} />
      )}
    </section>
  );
}

function BackLink() {
  return (
    <Link className="inline-flex items-center text-sm text-slate-400 hover:text-white" to="/customer/transactions">
      <ArrowLeft className="mr-1 size-4" />Lịch sử giao dịch
    </Link>
  );
}

function Amount({ label, value }: { label: string; value: string }) {
  return <div><p className="text-slate-400">{label}</p><p className="mt-1 font-medium">{value}</p></div>;
}

function DetailCard({ title, rows, className = "" }: {
  title: string;
  rows: Array<[string, string]>;
  className?: string;
}) {
  return (
    <Card className={`border-slate-700 bg-slate-800 text-slate-50 ${className}`}>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent>
        <dl className="divide-y divide-slate-700">
          {rows.map(([label, value]) => (
            <div className="grid gap-1 py-3 sm:grid-cols-[9rem_1fr]" key={label}>
              <dt className="text-sm text-slate-400">{label}</dt>
              <dd className="break-words text-sm text-slate-100 sm:text-right">{value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

function partyLabel(party?: CustomerTransactionParty | null) {
  if (!party) return "—";
  if (party.type === "provider") return [party.name, party.code].filter(Boolean).join(" · ") || "Provider";
  return [party.displayName, party.phone].filter(Boolean).join(" · ") || "Customer";
}

