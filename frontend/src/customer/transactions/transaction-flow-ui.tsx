import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  ReceiptText,
  RotateCcw,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { appConfig } from "@/config/app-config";
import { cn } from "@/lib/utils";
import { formatDateTime, formatNumber } from "@/shared/formatters";
import { transactionErrorMessage } from "./customer-transaction-api";
import type { TransactionPreview, TransactionReceipt } from "./types";

export function PreviewCard({ preview }: { preview: TransactionPreview }) {
  return (
    <Card className="border-slate-700 bg-slate-800 text-slate-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ReceiptText className="size-5 text-blue-400" />
          Kiểm tra giao dịch
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <AmountRow label="Số tiền" value={preview.amount} currency={preview.currency} />
        <AmountRow label="Phí" value={preview.fee} currency={preview.currency} />
        <div className="border-t border-slate-700 pt-3">
          <AmountRow
            label="Tổng thanh toán"
            value={preview.totalAmount}
            currency={preview.currency}
            strong
          />
        </div>
        <div className="flex justify-between gap-4 text-sm">
          <span className="text-slate-400">Mã tham chiếu</span>
          <span className="break-all text-right font-mono text-xs">{preview.transRefId}</span>
        </div>
        {preview.expiredAt && (
          <div className="flex justify-between gap-4 text-sm">
            <span className="text-slate-400">Hết hạn</span>
            <span>{formatDateTime(preview.expiredAt)}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function TransactionReceiptView({
  receipt,
  onRestart,
}: {
  receipt: TransactionReceipt;
  onRestart: () => void;
}) {
  return (
    <section className="text-center">
      <CheckCircle2 className="mx-auto size-16 text-emerald-400" />
      <h1 className="mt-4 text-2xl font-semibold">
        Giao dịch hoàn tất
      </h1>
      <p className="mt-1 text-sm text-slate-400">{receipt.service.name}</p>
      <Card className="mt-6 border-slate-700 bg-slate-800 text-left text-slate-50">
        <CardContent className="space-y-3 p-5">
          <AmountRow label="Số tiền" value={receipt.amount} currency={receipt.currency} />
          <AmountRow label="Phí" value={receipt.fee} currency={receipt.currency} />
          <AmountRow
            label="Tổng cộng"
            value={receipt.totalAmount}
            currency={receipt.currency}
            strong
          />
          <div className="flex justify-between gap-4 border-t border-slate-700 pt-3 text-sm">
            <span className="text-slate-400">Mã giao dịch</span>
            <span className="break-all text-right font-mono text-xs">
              {receipt.transaction?.code || receipt.transRefId}
            </span>
          </div>
          <div className="flex justify-between gap-4 text-sm">
            <span className="text-slate-400">Trạng thái</span>
            <strong className="text-emerald-400">{receipt.status}</strong>
          </div>
        </CardContent>
      </Card>
      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <Button
          className="border-slate-600 bg-transparent text-slate-200 hover:bg-slate-800"
          onClick={onRestart}
          variant="outline"
        >
          <RotateCcw className="mr-2 size-4" />
          Giao dịch mới
        </Button>
        <Button asChild className="bg-blue-600 text-white hover:bg-blue-500">
          <Link to="/customer/transactions">Xem lịch sử</Link>
        </Button>
      </div>
    </section>
  );
}

function AmountRow({
  label,
  value,
  currency,
  strong,
}: {
  label: string;
  value?: number;
  currency?: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-slate-400">{label}</span>
      <span className={cn("text-right", strong && "text-lg font-semibold text-blue-300")}>
        {typeof value === "number" ? formatNumber(value) : "—"}{" "}
        {currency || appConfig.defaultCurrency}
      </span>
    </div>
  );
}

export function StepIndicator({ step }: { step: number }) {
  return (
    <ol className="mt-6 grid grid-cols-3 gap-2" aria-label="Tiến trình giao dịch">
      {["Nhập liệu", "Xác nhận", "Xác thực"].map((label, index) => {
        const number = index + 1;
        return (
          <li
            className={cn(
              "text-center text-xs",
              number <= step ? "text-blue-300" : "text-slate-500",
            )}
            key={label}
          >
            <span
              className={cn(
                "mx-auto mb-1 flex size-7 items-center justify-center rounded-full border",
                number <= step ? "border-blue-400 bg-blue-500/20" : "border-slate-700",
              )}
            >
              {number}
            </span>
            {label}
          </li>
        );
      })}
    </ol>
  );
}

export function TransactionError({ error }: { error: unknown }) {
  return (
    <Alert className="border-red-500/30 bg-red-500/10 text-red-200">
      <AlertCircle className="mb-2 size-5" />
      {transactionErrorMessage(error)}
    </Alert>
  );
}

export function ExpiredNotice({ onRestart }: { onRestart: () => void }) {
  return (
    <Alert className="border-amber-500/30 bg-amber-500/10 text-amber-100">
      <Clock3 className="mb-2 size-5" />
      <p>Giao dịch đã hết hạn và không thể tiếp tục.</p>
      <Button
        className="mt-3 text-amber-100 hover:bg-amber-500/20"
        onClick={onRestart}
        size="sm"
        variant="ghost"
      >
        Bắt đầu lại
      </Button>
    </Alert>
  );
}

export function TransactionLoading() {
  return (
    <section aria-label="Đang tải cấu hình dịch vụ">
      <BackToServices />
      <div className="mt-6 animate-pulse space-y-4">
        <div className="h-7 w-2/3 rounded bg-slate-800" />
        <div className="h-4 w-1/2 rounded bg-slate-800" />
        <div className="h-72 rounded-2xl bg-slate-800" />
      </div>
    </section>
  );
}

export function BackToServices() {
  return (
    <Link
      className="inline-flex items-center text-sm text-slate-400 hover:text-white"
      to="/customer/services"
    >
      <ArrowLeft className="mr-1 size-4" />
      Danh sách dịch vụ
    </Link>
  );
}
