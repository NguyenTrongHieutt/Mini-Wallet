import { ArrowDownAZ, ArrowRight, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { appConfig } from "@/config/app-config";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { customerServiceErrorMessage } from "./customer-service-api";
import { useCustomerServices } from "./customer-service-queries";
import type {
  CustomerServiceListRequest,
  CustomerServiceSortField,
  CustomerServiceSortOrder,
} from "./types";

const DEFAULT_PAGE_SIZE = 12;

interface DraftFilters {
  q: string;
  code: string;
}

export function CustomerServiceListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const applied = useMemo(() => requestFromSearch(searchParams), [searchParams]);
  const [draft, setDraft] = useState<DraftFilters>(() => ({
    q: applied.q ?? "",
    code: applied.code ?? "",
  }));
  const servicesQuery = useCustomerServices(applied);
  const result = servicesQuery.data;

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateSearch(setSearchParams, {
      ...applied,
      page: 1,
      q: draft.q.trim(),
      code: draft.code.trim().toUpperCase(),
    });
  }

  function resetSearch() {
    setDraft({ q: "", code: "" });
    updateSearch(setSearchParams, {
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
      sortBy: "name",
      sortOrder: "ASC",
    });
  }

  function changeSort(value: string) {
    const [sortBy, sortOrder] = value.split(":") as [
      CustomerServiceSortField,
      CustomerServiceSortOrder,
    ];
    updateSearch(setSearchParams, { ...applied, page: 1, sortBy, sortOrder });
  }

  const hasDraftFilters = Boolean(draft.q || draft.code);

  return (
    <section aria-labelledby="customer-services-title">
      <header>
        <p className="text-sm font-medium text-blue-400">Mini Wallet</p>
        <h1 id="customer-services-title" className="mt-1 text-2xl font-semibold">
          Dịch vụ
        </h1>
        <p className="mt-1 text-sm text-slate-400">Tìm và chọn dịch vụ bạn muốn thực hiện.</p>
      </header>

      <form
        className="mt-6 rounded-2xl border border-slate-700 bg-slate-800/70 p-4 shadow-lg shadow-black/10"
        onSubmit={submitSearch}
      >
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(12rem,0.45fr)]">
          <label className="grid gap-1.5 text-sm font-medium text-slate-200">
            Từ khóa
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
              <Input
                aria-label="Từ khóa"
                className="border-slate-700 bg-slate-900 pl-9 text-slate-50 placeholder:text-slate-500"
                onChange={(event) => setDraft((current) => ({ ...current, q: event.target.value }))}
                placeholder="Tên hoặc mô tả dịch vụ"
                value={draft.q}
              />
            </div>
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-slate-200">
            Mã dịch vụ
            <Input
              aria-label="Mã dịch vụ"
              autoCapitalize="characters"
              className="border-slate-700 bg-slate-900 font-mono uppercase text-slate-50 placeholder:font-sans placeholder:text-slate-500"
              onChange={(event) =>
                setDraft((current) => ({ ...current, code: event.target.value.toUpperCase() }))
              }
              placeholder="Ví dụ: P2P_TRANSFER"
              value={draft.code}
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap justify-end gap-2">
          {(hasDraftFilters || applied.q || applied.code) && (
            <Button
              className="border-slate-600 bg-transparent text-slate-200 hover:bg-slate-700"
              onClick={resetSearch}
              type="button"
              variant="outline"
            >
              <X className="mr-2 size-4" />
              Đặt lại
            </Button>
          )}
          <Button className="bg-blue-600 text-white hover:bg-blue-500" type="submit">
            <Search className="mr-2 size-4" />
            Tìm kiếm
          </Button>
        </div>
      </form>

      <div className="mt-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div aria-live="polite" className="text-sm text-slate-400">
          {result ? `${result.pagination.total.toLocaleString(appConfig.locale)} dịch vụ` : "Danh sách dịch vụ"}
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <ArrowDownAZ className="size-4 text-slate-500" />
          Sắp xếp
          <select
            aria-label="Sắp xếp dịch vụ"
            className="h-10 rounded-md border border-slate-700 bg-slate-800 px-3 text-sm text-slate-100"
            onChange={(event) => changeSort(event.target.value)}
            value={`${applied.sortBy}:${applied.sortOrder}`}
          >
            <option value="name:ASC">Tên A–Z</option>
            <option value="name:DESC">Tên Z–A</option>
            <option value="code:ASC">Mã A–Z</option>
            <option value="code:DESC">Mã Z–A</option>
            <option value="createdAt:DESC">Mới nhất</option>
            <option value="createdAt:ASC">Cũ nhất</option>
          </select>
        </label>
      </div>

      {servicesQuery.isPending && <ServiceListLoading />}

      {servicesQuery.isError && (
        <Alert className="mt-5 border-red-500/30 bg-red-500/10 text-red-200">
          <p>{customerServiceErrorMessage(servicesQuery.error)}</p>
          <Button
            className="mt-3 border-red-400/40 bg-transparent text-red-100 hover:bg-red-500/20"
            onClick={() => void servicesQuery.refetch()}
            size="sm"
            type="button"
            variant="outline"
          >
            Thử lại
          </Button>
        </Alert>
      )}

      {result && result.items.length === 0 && (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-700 bg-slate-800/40 px-6 py-12 text-center">
          <Search className="mx-auto size-9 text-slate-500" />
          <h2 className="mt-3 font-semibold">Không tìm thấy dịch vụ</h2>
          <p className="mt-1 text-sm text-slate-400">
            Hãy thay đổi từ khóa hoặc mã dịch vụ rồi bấm Tìm kiếm.
          </p>
        </div>
      )}

      {result && result.items.length > 0 && (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {result.items.map((service) => (
            <Card
              className="group border-slate-700 bg-slate-800 text-slate-50 transition hover:border-blue-500/70 hover:bg-slate-800/90"
              key={service.id}
            >
              <CardContent className="flex h-full flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <span className="rounded-md bg-blue-500/15 px-2 py-1 font-mono text-xs font-semibold text-blue-300">
                    {service.code}
                  </span>
                  <span className="size-2 rounded-full bg-emerald-400" aria-label="Đang hoạt động" />
                </div>
                <h2 className="mt-4 text-lg font-semibold">{service.name}</h2>
                <p className="mt-2 line-clamp-3 flex-1 text-sm leading-6 text-slate-400">
                  {service.description || "Dịch vụ Mini Wallet"}
                </p>
                <Button
                  asChild
                  className="mt-5 w-full border-slate-600 bg-transparent text-slate-100 hover:bg-blue-600 hover:text-white"
                  variant="outline"
                >
                  <Link to={`/customer/services/${encodeURIComponent(service.code)}`}>
                    Chọn dịch vụ
                    <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {result && result.pagination.totalPages > 1 && (
        <nav
          aria-label="Phân trang dịch vụ"
          className="mt-6 flex items-center justify-between rounded-xl border border-slate-700 bg-slate-800/60 p-3"
        >
          <Button
            className="border-slate-600 bg-transparent text-slate-200 hover:bg-slate-700"
            disabled={applied.page <= 1 || servicesQuery.isFetching}
            onClick={() => updateSearch(setSearchParams, { ...applied, page: applied.page - 1 })}
            size="sm"
            type="button"
            variant="outline"
          >
            <ChevronLeft className="mr-1 size-4" />
            Trước
          </Button>
          <span className="text-sm text-slate-400">
            Trang <strong className="text-slate-100">{applied.page}</strong> / {result.pagination.totalPages}
          </span>
          <Button
            className="border-slate-600 bg-transparent text-slate-200 hover:bg-slate-700"
            disabled={applied.page >= result.pagination.totalPages || servicesQuery.isFetching}
            onClick={() => updateSearch(setSearchParams, { ...applied, page: applied.page + 1 })}
            size="sm"
            type="button"
            variant="outline"
          >
            Sau
            <ChevronRight className="ml-1 size-4" />
          </Button>
        </nav>
      )}
    </section>
  );
}

function ServiceListLoading() {
  return (
    <div aria-label="Đang tải danh sách dịch vụ" className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => (
        <div className="h-52 animate-pulse rounded-2xl border border-slate-800 bg-slate-800/70" key={index} />
      ))}
    </div>
  );
}

function requestFromSearch(params: URLSearchParams): CustomerServiceListRequest {
  const sortByParam = params.get("sortBy");
  const sortOrderParam = params.get("sortOrder");
  const sortBy: CustomerServiceSortField =
    sortByParam === "code" || sortByParam === "createdAt" ? sortByParam : "name";

  return {
    page: Math.max(Number(params.get("page")) || 1, 1),
    pageSize: Math.min(
      Math.max(Number(params.get("pageSize")) || DEFAULT_PAGE_SIZE, 1),
      appConfig.pagination.maxPageSize,
    ),
    q: params.get("q") || undefined,
    code: params.get("code") || undefined,
    sortBy,
    sortOrder: sortOrderParam === "DESC" ? "DESC" : "ASC",
  };
}

function updateSearch(
  setter: ReturnType<typeof useSearchParams>[1],
  values: CustomerServiceListRequest,
) {
  const next = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      next.set(key, String(value));
    }
  });
  setter(next);
}
