import { Check, ChevronDown, LoaderCircle, Search } from "lucide-react";
import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useProviderSuggestions } from "./customer-transaction-queries";
import type { PublicProvider } from "./types";

interface ProviderCodeInputProps {
  id: string;
  placeholder: string;
  serviceCode: string;
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
}

export function ProviderCodeInput({
  id,
  placeholder,
  serviceCode,
  value,
  onChange,
  invalid,
}: ProviderCodeInputProps) {
  const [open, setOpen] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState(value);
  const [debounceReady, setDebounceReady] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    if (!open) {
      setDebounceReady(false);
      return;
    }
    setDebounceReady(false);
    const timeout = window.setTimeout(() => {
      setDebouncedQuery(value.trim());
      setDebounceReady(true);
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [open, value]);

  const suggestionsQuery = useProviderSuggestions(
    serviceCode,
    debouncedQuery,
    open && debounceReady,
  );
  const providers = useMemo(
    () => suggestionsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [suggestionsQuery.data],
  );

  function choose(provider: PublicProvider) {
    onChange(provider.code);
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!open && (event.key === "ArrowDown" || event.key === "Enter")) {
      setOpen(true);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => Math.min(current + 1, providers.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
    } else if (event.key === "Enter" && activeIndex >= 0 && providers[activeIndex]) {
      event.preventDefault();
      choose(providers[activeIndex]);
    } else if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  return (
    <div className="relative">
      <div className="relative">
        <Input
          aria-autocomplete="list"
          aria-controls={`${id}-suggestions`}
          aria-expanded={open}
          aria-invalid={invalid}
          autoComplete="off"
          className="border-slate-700 bg-slate-900 pr-9 font-mono uppercase text-slate-50 placeholder:font-sans placeholder:normal-case placeholder:text-slate-500"
          id={id}
          onBlur={() => window.setTimeout(() => setOpen(false), 150)}
          onChange={(event) => {
            onChange(event.target.value.toUpperCase());
            setOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          role="combobox"
          value={value}
        />
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
      </div>

      {open && (
        <div
          className="absolute z-40 mt-1 w-full overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/40"
          id={`${id}-suggestions`}
          role="listbox"
        >
          <div className="max-h-60 overflow-y-auto p-1">
            {(!debounceReady || suggestionsQuery.isPending) && (
              <div className="flex items-center gap-2 px-3 py-4 text-sm text-slate-400">
                <LoaderCircle className="size-4 animate-spin" />
                Đang tìm provider…
              </div>
            )}
            {suggestionsQuery.isError && (
              <div className="px-3 py-4 text-sm text-red-300">Không thể tải gợi ý provider.</div>
            )}
            {debounceReady && !suggestionsQuery.isPending && providers.length === 0 && (
              <div className="px-3 py-4 text-sm text-slate-400">
                <Search className="mb-2 size-4" />
                Không có gợi ý. Bạn vẫn có thể nhập mã thủ công.
              </div>
            )}
            {providers.map((provider, index) => (
              <button
                aria-selected={activeIndex === index}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm",
                  activeIndex === index ? "bg-blue-500/20 text-blue-100" : "text-slate-200 hover:bg-slate-800",
                )}
                key={provider.id}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(provider)}
                role="option"
                type="button"
              >
                <span className="min-w-0">
                  <strong className="block truncate">{provider.name}</strong>
                  <span className="block truncate text-xs text-slate-400">
                    {provider.code}{provider.category ? ` · ${provider.category}` : ""}
                  </span>
                </span>
                {value === provider.code && <Check className="size-4 shrink-0 text-blue-400" />}
              </button>
            ))}
          </div>
          {suggestionsQuery.hasNextPage && (
            <div className="border-t border-slate-800 p-2">
              <Button
                className="w-full text-slate-300 hover:bg-slate-800"
                disabled={suggestionsQuery.isFetchingNextPage}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => void suggestionsQuery.fetchNextPage()}
                size="sm"
                type="button"
                variant="ghost"
              >
                {suggestionsQuery.isFetchingNextPage ? "Đang tải…" : "Tải thêm gợi ý"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
