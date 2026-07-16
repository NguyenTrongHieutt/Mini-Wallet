import { ArrowDownUp, ArrowRight, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { useMemo, useState, type ComponentProps, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { customerHistoryErrorMessage } from "./customer-history-api";
import { useCustomerTransactionHistory } from "./customer-history-queries";
import type {
  CustomerTransactionDirection,
  CustomerTransactionListItem,
  CustomerTransactionListRequest,
  CustomerTransactionSortField,
  CustomerTransactionSortOrder,
} from "./types";

const DEFAULT_PAGE_SIZE = 10;

interface DraftFilters {
  q: string;
  direction: "" | CustomerTransactionDirection;
  status: string;
  serviceCode: string;
  dateFrom: string;
  dateTo: string;
  amountFrom: string;
  amountTo: string;
  totalAmountFrom: string;
  totalAmountTo: string;
}

export function CustomerTransactionListPage() {
  const [params, setParams] = useSearchParams();
  const applied = useMemo(() => requestFromSearch(params), [params]);
  const [draft, setDraft] = useState<DraftFilters>(() => draftFromRequest(applied));
  const query = useCustomerTransactionHistory(applied);
  const result = query.data;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateSearch(setParams, requestFromDraft(draft, applied));
  }

  function reset() {
    const defaults = defaultRequest();
    setDraft(draftFromRequest(defaults));
    updateSearch(setParams, defaults);
  }

  function sort(value: string) {
    const [sortBy, sortOrder] = value.split(":") as [
      CustomerTransactionSortField,
      CustomerTransactionSortOrder,
    ];
    updateSearch(setParams, { ...applied, page: 1, sortBy, sortOrder });
  }

  return (
    <section aria-labelledby="customer-history-title">
      <header>
        <p className="text-sm font-medium text-blue-400">Mini Wallet</p>
        <h1 id="customer-history-title" className="mt-1 text-2xl font-semibold">
          Lịch sử giao dịch
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Nhập điều kiện rồi bấm Tìm kiếm để tra cứu giao dịch.
        </p>
      </header>

      <form
        className="mt-6 rounded-2xl border border-slate-700 bg-slate-800/70 p-4"
        onSubmit={submit}
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <FilterInput label="Từ khóa" value={draft.q} placeholder="Mã hoặc nội dung giao dịch"
            onChange={(value) => setDraft((current) => ({ ...current, q: value }))} />
          <label className="grid gap-1.5 text-sm font-medium text-slate-200">
            Chiều giao dịch
            <select aria-label="Chiều giao dịch" className={selectClass} value={draft.direction}
              onChange={(event) => setDraft((current) => ({
                ...current,
                direction: event.target.value as DraftFilters["direction"],
              }))}>
              <option value="">Tất cả</option>
              <option value="sent">Đã gửi</option>
              <option value="received">Đã nhận</option>
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-slate-200">
            Trạng thái
            <select aria-label="Trạng thái" className={selectClass} value={draft.status}
              onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))}>
              <option value="">Tất cả</option>
              <option value="done">Thành công</option>
              <option value="failed">Thất bại</option>
            </select>
          </label>
          <FilterInput label="Mã dịch vụ" value={draft.serviceCode} placeholder="P2P_TRANSFER"
            onChange={(value) => setDraft((current) => ({ ...current, serviceCode: value.toUpperCase() }))} />
          <FilterInput label="Từ ngày" value={draft.dateFrom} type="date"
            onChange={(value) => setDraft((current) => ({ ...current, dateFrom: value }))} />
          <FilterInput label="Đến ngày" value={draft.dateTo} type="date"
            onChange={(value) => setDraft((current) => ({ ...current, dateTo: value }))} />
          <FilterInput label="Số tiền từ" value={draft.amountFrom} type="number" min="0"
            onChange={(value) => setDraft((current) => ({ ...current, amountFrom: value }))} />
          <FilterInput label="Số tiền đến" value={draft.amountTo} type="number" min="0"
            onChange={(value) => setDraft((current) => ({ ...current, amountTo: value }))} />
          <FilterInput label="Tổng tiền từ" value={draft.totalAmountFrom} type="number" min="0"
            onChange={(value) => setDraft((current) => ({ ...current, totalAmountFrom: value }))} />
          <FilterInput label="Tổng tiền đến" value={draft.totalAmountTo} type="number" min="0"
            onChange={(value) => setDraft((current) => ({ ...current, totalAmountTo: value }))} />
        </div>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={reset}
            className="border-slate-600 bg-transparent text-slate-200 hover:bg-slate-700">
            <X className="mr-2 size-4" />Đặt lại
          </Button>
          <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-500">
            <Search className="mr-2 size-4" />Tìm kiếm
          </Button>
        </div>
      </form>

      <div className="mt-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <p className="text-sm text-slate-400" aria-live="polite">
          {result ? `${result.pagination.total.toLocaleString("vi-VN")} giao dịch` : "Danh sách giao dịch"}
        </p>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <ArrowDownUp className="size-4 text-slate-500" />Sắp xếp
          <select aria-label="Sắp xếp giao dịch" className={selectClass}
            value={`${applied.sortBy}:${applied.sortOrder}`} onChange={(event) => sort(event.target.value)}>
            <option value="createdAt:DESC">Mới nhất</option>
            <option value="createdAt:ASC">Cũ nhất</option>
            <option value="amount:DESC">Số tiền giảm dần</option>
            <option value="amount:ASC">Số tiền tăng dần</option>
            <option value="totalAmount:DESC">Tổng tiền giảm dần</option>
            <option value="totalAmount:ASC">Tổng tiền tăng dần</option>
            <option value="status:ASC">Trạng thái A–Z</option>
            <option value="code:ASC">Mã A–Z</option>
          </select>
        </label>
      </div>

      {query.isPending && <HistoryLoading />}
      {query.isError && (
        <Alert className="mt-5 border-red-500/30 bg-red-500/10 text-red-200">
          <p>{customerHistoryErrorMessage(query.error)}</p>
          <Button type="button" size="sm" variant="outline" onClick={() => void query.refetch()}
            className="mt-3 border-red-400/40 bg-transparent text-red-100 hover:bg-red-500/20">
            Thử lại
          </Button>
        </Alert>
      )}
      {result?.items.length === 0 && (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-700 bg-slate-800/40 px-6 py-12 text-center">
          <Search className="mx-auto size-9 text-slate-500" />
          <h2 className="mt-3 font-semibold">Không tìm thấy giao dịch</h2>
          <p className="mt-1 text-sm text-slate-400">Hãy thay đổi điều kiện rồi bấm Tìm kiếm.</p>
        </div>
      )}
      {result && result.items.length > 0 && (
        <div className="mt-5 grid gap-3">
          {result.items.map((transaction) => <TransactionCard key={transaction.id} transaction={transaction} />)}
        </div>
      )}
      {result && result.pagination.totalPages > 1 && (
        <nav aria-label="Phân trang giao dịch"
          className="mt-6 flex items-center justify-between rounded-xl border border-slate-700 bg-slate-800/60 p-3">
          <Button type="button" size="sm" variant="outline"
            className="border-slate-600 bg-transparent text-slate-200 hover:bg-slate-700"
            disabled={applied.page <= 1 || query.isFetching}
            onClick={() => updateSearch(setParams, { ...applied, page: applied.page - 1 })}>
            <ChevronLeft className="mr-1 size-4" />Trước
          </Button>
          <span className="text-sm text-slate-400">
            Trang <strong className="text-slate-100">{applied.page}</strong> / {result.pagination.totalPages}
          </span>
          <Button type="button" size="sm" variant="outline"
            className="border-slate-600 bg-transparent text-slate-200 hover:bg-slate-700"
            disabled={applied.page >= result.pagination.totalPages || query.isFetching}
            onClick={() => updateSearch(setParams, { ...applied, page: applied.page + 1 })}>
            Sau<ChevronRight className="ml-1 size-4" />
          </Button>
        </nav>
      )}
    </section>
  );
}

const selectClass = "h-10 rounded-md border border-slate-700 bg-slate-900 px-3 text-slate-50";

function FilterInput({ label, value, onChange, ...props }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
} & Omit<ComponentProps<typeof Input>, "value" | "onChange">) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-slate-200">
      {label}
      <Input {...props} aria-label={label} value={value} onChange={(event) => onChange(event.target.value)}
        className="border-slate-700 bg-slate-900 text-slate-50 placeholder:text-slate-500" />
    </label>
  );
}

function TransactionCard({ transaction }: { transaction: CustomerTransactionListItem }) {
  const sent = transaction.direction === "sent";
  return (
    <Card className="border-slate-700 bg-slate-800 text-slate-50">
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold",
                sent ? "bg-amber-500/15 text-amber-300" : "bg-emerald-500/15 text-emerald-300")}>
                {sent ? "Đã gửi" : "Đã nhận"}
              </span>
              <TransactionStatus status={transaction.status} />
            </div>
            <p className="mt-3 truncate font-mono text-sm">{transaction.code}</p>
            <p className="mt-1 truncate text-sm text-slate-400">{transaction.message || transaction.transRefId}</p>
            <p className="mt-1 text-xs text-slate-500">{formatDateTime(transaction.createdAt)}</p>
          </div>
          <div className="flex items-end justify-between gap-4 sm:flex-col">
            <div className="text-left sm:text-right">
              <p className="text-lg font-semibold">{sent ? "−" : "+"}{formatMoney(transaction.amount, transaction.currency)}</p>
              <p className="text-xs text-slate-400">Tổng {formatMoney(transaction.totalAmount, transaction.currency)}</p>
            </div>
            <Button asChild size="sm" variant="outline"
              className="border-slate-600 bg-transparent text-slate-100 hover:bg-blue-600">
              <Link to={`/customer/transactions/${encodeURIComponent(transaction.id)}`}>
                Chi tiết<ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function TransactionStatus({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  return (
    <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold",
      normalized === "done" ? "bg-emerald-500/15 text-emerald-300"
        : normalized === "failed" ? "bg-red-500/15 text-red-300" : "bg-slate-700 text-slate-300")}>
      {normalized === "done" ? "Thành công" : normalized === "failed" ? "Thất bại" : status}
    </span>
  );
}

function HistoryLoading() {
  return (
    <div aria-label="Đang tải lịch sử giao dịch" className="mt-5 grid gap-3">
      {Array.from({ length: 4 }, (_, index) => (
        <div className="h-32 animate-pulse rounded-2xl border border-slate-800 bg-slate-800/70" key={index} />
      ))}
    </div>
  );
}

export function formatMoney(value: number, currency: string) {
  return `${Number(value || 0).toLocaleString("vi-VN")} ${currency || "VND"}`;
}

export function formatDateTime(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("vi-VN");
}

function defaultRequest(): CustomerTransactionListRequest {
  return { page: 1, pageSize: DEFAULT_PAGE_SIZE, sortBy: "createdAt", sortOrder: "DESC" };
}

function draftFromRequest(request: CustomerTransactionListRequest): DraftFilters {
  return {
    q: request.q ?? "", direction: request.direction ?? "", status: request.status ?? "",
    serviceCode: request.serviceCode ?? "", dateFrom: dateInputValue(request.dateFrom),
    dateTo: dateInputValue(request.dateTo), amountFrom: numberInputValue(request.amountFrom),
    amountTo: numberInputValue(request.amountTo), totalAmountFrom: numberInputValue(request.totalAmountFrom),
    totalAmountTo: numberInputValue(request.totalAmountTo),
  };
}

function requestFromDraft(draft: DraftFilters, current: CustomerTransactionListRequest): CustomerTransactionListRequest {
  return {
    ...current, page: 1, q: text(draft.q), direction: draft.direction || undefined,
    status: text(draft.status), serviceCode: text(draft.serviceCode)?.toUpperCase(),
    dateFrom: dayBoundary(draft.dateFrom, false), dateTo: dayBoundary(draft.dateTo, true),
    amountFrom: number(draft.amountFrom), amountTo: number(draft.amountTo),
    totalAmountFrom: number(draft.totalAmountFrom), totalAmountTo: number(draft.totalAmountTo),
  };
}

function requestFromSearch(params: URLSearchParams): CustomerTransactionListRequest {
  const allowed: CustomerTransactionSortField[] = ["createdAt", "amount", "totalAmount", "status", "code"];
  const sortBy = params.get("sortBy") as CustomerTransactionSortField;
  const direction = params.get("direction");
  return {
    page: Math.max(Number(params.get("page")) || 1, 1),
    pageSize: Math.min(Math.max(Number(params.get("pageSize")) || DEFAULT_PAGE_SIZE, 1), 100),
    q: text(params.get("q")), direction: direction === "sent" || direction === "received" ? direction : undefined,
    status: text(params.get("status")), serviceCode: text(params.get("serviceCode")),
    dateFrom: text(params.get("dateFrom")), dateTo: text(params.get("dateTo")),
    amountFrom: number(params.get("amountFrom")), amountTo: number(params.get("amountTo")),
    totalAmountFrom: number(params.get("totalAmountFrom")), totalAmountTo: number(params.get("totalAmountTo")),
    sortBy: allowed.includes(sortBy) ? sortBy : "createdAt",
    sortOrder: params.get("sortOrder") === "ASC" ? "ASC" : "DESC",
  };
}

function updateSearch(setter: ReturnType<typeof useSearchParams>[1], values: CustomerTransactionListRequest) {
  const next = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== "") next.set(key, String(value));
  });
  setter(next);
}

function text(value: string | null | undefined) {
  return value?.trim() || undefined;
}

function number(value: string | null | undefined) {
  if (!value?.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function dayBoundary(value: string, end: boolean) {
  return value ? new Date(`${value}T${end ? "23:59:59.999" : "00:00:00.000"}`).toISOString() : undefined;
}

function dateInputValue(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function numberInputValue(value?: number) {
  return value === undefined ? "" : String(value);
}

