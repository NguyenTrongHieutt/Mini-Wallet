import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  ReceiptText,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { transactionErrorMessage } from "./customer-transaction-api";
import { useServiceInputFields, useTransactionMutations } from "./customer-transaction-queries";
import { ProviderCodeInput } from "./provider-code-input";
import type {
  ServiceInputFieldsData,
  TransactionConfirmation,
  TransactionInputField,
  TransactionPreview,
  TransactionReceipt,
} from "./types";

type RawFieldValue = string | boolean;
type RawValues = Record<string, RawFieldValue>;
type FieldErrors = Record<string, string>;

export function DynamicTransactionPage() {
  const serviceCode = decodeURIComponent(useParams().serviceCode ?? "").toUpperCase();
  const fieldsQuery = useServiceInputFields(serviceCode);

  if (fieldsQuery.isPending) {
    return <TransactionLoading />;
  }

  if (fieldsQuery.isError) {
    return (
      <section>
        <BackToServices />
        <Alert className="mt-6 border-red-500/30 bg-red-500/10 text-red-200">
          <p>{transactionErrorMessage(fieldsQuery.error)}</p>
          <Button
            className="mt-3 border-red-400/40 bg-transparent text-red-100 hover:bg-red-500/20"
            onClick={() => void fieldsQuery.refetch()}
            size="sm"
            type="button"
            variant="outline"
          >
            Thử lại
          </Button>
        </Alert>
      </section>
    );
  }

  return (
    <TransactionFlow
      definition={fieldsQuery.data}
      key={fieldsQuery.data.service.code}
      serviceCode={serviceCode}
    />
  );
}

function TransactionFlow({
  definition,
  serviceCode,
}: {
  definition: ServiceInputFieldsData;
  serviceCode: string;
}) {
  const [values, setValues] = useState<RawValues>(() => initialValues(definition.bodyFields));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [preview, setPreview] = useState<TransactionPreview | null>(null);
  const [confirmation, setConfirmation] = useState<TransactionConfirmation | null>(null);
  const [receipt, setReceipt] = useState<TransactionReceipt | null>(null);
  const [pin, setPin] = useState("");
  const requestLocked = useRef(false);
  const confirmLocked = useRef(false);
  const verifyLocked = useRef(false);
  const { requestMutation, confirmMutation, verifyMutation } = useTransactionMutations();
  const expiresAt = confirmation?.expiredAt ?? preview?.expiredAt;
  const expired = useExpired(expiresAt);

  function setFieldValue(name: string, value: RawFieldValue) {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  }

  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (requestLocked.current || requestMutation.isPending) return;
    const normalized = normalizeFields(definition.bodyFields, values);
    setErrors(normalized.errors);
    if (Object.keys(normalized.errors).length > 0) return;
    requestLocked.current = true;
    try {
      const nextPreview = await requestMutation.mutateAsync({
        serviceCode,
        ...normalized.body,
      });
      setPreview(nextPreview);
    } catch {
      // Mutation state renders the API error.
    } finally {
      requestLocked.current = false;
    }
  }

  async function confirmTransaction() {
    if (!preview || confirmLocked.current || confirmMutation.isPending || expired) return;
    confirmLocked.current = true;
    try {
      const nextConfirmation = await confirmMutation.mutateAsync(preview.transRefId);
      setConfirmation(nextConfirmation);
    } catch {
      // Mutation state renders the API error.
    } finally {
      confirmLocked.current = false;
    }
  }

  async function verifyTransaction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!confirmation || verifyLocked.current || verifyMutation.isPending || expired) return;
    if (confirmation.authMethod === "PIN" && !/^\d{6}$/.test(pin)) return;
    verifyLocked.current = true;
    try {
      const nextReceipt = await verifyMutation.mutateAsync({
        transRefId: confirmation.transRefId,
        pin: confirmation.authMethod === "PIN" ? pin : undefined,
      });
      setReceipt(nextReceipt);
    } catch {
      // Mutation state renders the API error.
    } finally {
      verifyLocked.current = false;
    }
  }

  function restart() {
    setValues(initialValues(definition.bodyFields));
    setErrors({});
    setPreview(null);
    setConfirmation(null);
    setReceipt(null);
    setPin("");
    requestLocked.current = false;
    confirmLocked.current = false;
    verifyLocked.current = false;
    requestMutation.reset();
    confirmMutation.reset();
    verifyMutation.reset();
  }

  if (receipt) {
    return <Receipt receipt={receipt} onRestart={restart} />;
  }

  return (
    <section>
      <BackToServices />
      <header className="mt-4">
        <p className="font-mono text-sm font-semibold text-blue-400">{definition.service.code}</p>
        <h1 className="mt-1 text-2xl font-semibold">{definition.service.name}</h1>
        {definition.service.description && (
          <p className="mt-1 text-sm text-slate-400">{definition.service.description}</p>
        )}
      </header>

      <StepIndicator step={confirmation ? 3 : preview ? 2 : 1} />

      {!preview && (
        <form className="mt-6 space-y-4" onSubmit={submitRequest}>
          <Card className="border-slate-700 bg-slate-800 text-slate-50">
            <CardHeader>
              <CardTitle>Thông tin giao dịch</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {definition.bodyFields.length === 0 && (
                <p className="text-sm text-slate-400">Dịch vụ này không yêu cầu thông tin bổ sung.</p>
              )}
              {definition.bodyFields.map((field) => (
                <DynamicField
                  error={errors[field.name]}
                  field={field}
                  key={field.name}
                  onChange={(value) => setFieldValue(field.name, value)}
                  serviceCode={serviceCode}
                  value={values[field.name] ?? ""}
                />
              ))}
            </CardContent>
          </Card>
          {requestMutation.isError && <TransactionError error={requestMutation.error} />}
          <Button
            className="w-full bg-blue-600 text-white hover:bg-blue-500"
            disabled={requestMutation.isPending}
            size="lg"
            type="submit"
          >
            {requestMutation.isPending && <LoaderCircle className="mr-2 size-4 animate-spin" />}
            Xem trước giao dịch
          </Button>
        </form>
      )}

      {preview && !confirmation && (
        <div className="mt-6 space-y-4">
          <PreviewCard preview={preview} />
          {expired && <ExpiredNotice onRestart={restart} />}
          {confirmMutation.isError && <TransactionError error={confirmMutation.error} />}
          {!expired && (
            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                className="border-slate-600 bg-transparent text-slate-200 hover:bg-slate-800"
                onClick={restart}
                type="button"
                variant="outline"
              >
                Chỉnh sửa
              </Button>
              <Button
                className="bg-blue-600 text-white hover:bg-blue-500"
                disabled={confirmMutation.isPending}
                onClick={() => void confirmTransaction()}
                type="button"
              >
                {confirmMutation.isPending && <LoaderCircle className="mr-2 size-4 animate-spin" />}
                Xác nhận giao dịch
              </Button>
            </div>
          )}
        </div>
      )}

      {confirmation && (
        <form className="mt-6 space-y-4" onSubmit={verifyTransaction}>
          <Card className="border-slate-700 bg-slate-800 text-slate-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-blue-400" />
                Xác thực giao dịch
              </CardTitle>
            </CardHeader>
            <CardContent>
              {confirmation.authMethod === "PIN" ? (
                <label className="grid gap-2 text-sm font-medium text-slate-200">
                  Mã PIN 6 chữ số
                  <Input
                    aria-label="Mã PIN 6 chữ số"
                    autoComplete="off"
                    className="border-slate-700 bg-slate-900 text-center font-mono text-xl tracking-[0.45em] text-slate-50"
                    inputMode="numeric"
                    maxLength={6}
                    onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 6))}
                    type="password"
                    value={pin}
                  />
                </label>
              ) : (
                <p className="text-sm text-slate-300">
                  Dịch vụ không yêu cầu mã PIN. Bấm nút bên dưới để hoàn tất giao dịch.
                </p>
              )}
            </CardContent>
          </Card>
          {expired && <ExpiredNotice onRestart={restart} />}
          {verifyMutation.isError && <TransactionError error={verifyMutation.error} />}
          {!expired && (
            <Button
              className="w-full bg-emerald-600 text-white hover:bg-emerald-500"
              disabled={
                verifyMutation.isPending ||
                (confirmation.authMethod === "PIN" && !/^\d{6}$/.test(pin))
              }
              size="lg"
              type="submit"
            >
              {verifyMutation.isPending && <LoaderCircle className="mr-2 size-4 animate-spin" />}
              {confirmation.authMethod === "PIN" ? "Xác thực và thanh toán" : "Hoàn tất giao dịch"}
            </Button>
          )}
        </form>
      )}
    </section>
  );
}

function DynamicField({
  field,
  value,
  onChange,
  serviceCode,
  error,
}: {
  field: TransactionInputField;
  value: RawFieldValue;
  onChange: (value: RawFieldValue) => void;
  serviceCode: string;
  error?: string;
}) {
  const id = `transaction-field-${field.name}`;
  const placeholder = field.role?.trim() || field.name;
  const type = normalizeDataType(field);
  const label = field.role?.trim() || field.name;

  return (
    <label className="grid gap-1.5 text-sm font-medium text-slate-200" htmlFor={id}>
      <span>
        {label}
        {field.required && <span className="ml-1 text-red-400">*</span>}
      </span>
      {field.name.toLowerCase() === "providercode" ? (
        <ProviderCodeInput
          id={id}
          invalid={Boolean(error)}
          onChange={onChange}
          placeholder={placeholder}
          serviceCode={serviceCode}
          value={String(value)}
        />
      ) : type === "boolean" ? (
        <select
          aria-invalid={Boolean(error)}
          className="h-10 rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-slate-50"
          id={id}
          onChange={(event) =>
            onChange(event.target.value === "" ? "" : event.target.value === "true")
          }
          value={String(value)}
        >
          <option value="">Chọn giá trị</option>
          <option value="false">Không</option>
          <option value="true">Có</option>
        </select>
      ) : type === "object" ? (
        <textarea
          aria-invalid={Boolean(error)}
          className="min-h-28 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-sm text-slate-50 placeholder:text-slate-500"
          id={id}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          value={String(value)}
        />
      ) : (
        <Input
          aria-invalid={Boolean(error)}
          className="border-slate-700 bg-slate-900 text-slate-50 placeholder:text-slate-500"
          id={id}
          inputMode={type === "number" || type === "integer" ? "decimal" : undefined}
          maxLength={field.validation?.maxLength}
          minLength={field.validation?.minLength}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          type={field.validation?.needSecured || type === "secured" ? "password" : "text"}
          value={String(value)}
        />
      )}
      {error && <span className="text-xs font-normal text-red-300">{error}</span>}
    </label>
  );
}

function PreviewCard({ preview }: { preview: TransactionPreview }) {
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
          <AmountRow label="Tổng thanh toán" value={preview.totalAmount} currency={preview.currency} strong />
        </div>
        <div className="flex justify-between gap-4 text-sm">
          <span className="text-slate-400">Mã tham chiếu</span>
          <span className="break-all text-right font-mono text-xs">{preview.transRefId}</span>
        </div>
        {preview.expiredAt && (
          <div className="flex justify-between gap-4 text-sm">
            <span className="text-slate-400">Hết hạn</span>
            <span>{new Date(preview.expiredAt).toLocaleString("vi-VN")}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Receipt({ receipt, onRestart }: { receipt: TransactionReceipt; onRestart: () => void }) {
  return (
    <section className="text-center">
      <CheckCircle2 className="mx-auto size-16 text-emerald-400" />
      <h1 className="mt-4 text-2xl font-semibold">Giao dịch hoàn tất</h1>
      <p className="mt-1 text-sm text-slate-400">{receipt.service.name}</p>
      <Card className="mt-6 border-slate-700 bg-slate-800 text-left text-slate-50">
        <CardContent className="space-y-3 p-5">
          <AmountRow label="Số tiền" value={receipt.amount} currency={receipt.currency} />
          <AmountRow label="Phí" value={receipt.fee} currency={receipt.currency} />
          <AmountRow label="Tổng cộng" value={receipt.totalAmount} currency={receipt.currency} strong />
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
        {typeof value === "number" ? value.toLocaleString("vi-VN") : "—"} {currency || "VND"}
      </span>
    </div>
  );
}

function StepIndicator({ step }: { step: number }) {
  return (
    <ol className="mt-6 grid grid-cols-3 gap-2" aria-label="Tiến trình giao dịch">
      {["Nhập liệu", "Xác nhận", "Xác thực"].map((label, index) => {
        const number = index + 1;
        return (
          <li className={cn("text-center text-xs", number <= step ? "text-blue-300" : "text-slate-500")} key={label}>
            <span className={cn(
              "mx-auto mb-1 flex size-7 items-center justify-center rounded-full border",
              number <= step ? "border-blue-400 bg-blue-500/20" : "border-slate-700",
            )}>
              {number}
            </span>
            {label}
          </li>
        );
      })}
    </ol>
  );
}

function TransactionError({ error }: { error: unknown }) {
  return (
    <Alert className="border-red-500/30 bg-red-500/10 text-red-200">
      <AlertCircle className="mb-2 size-5" />
      {transactionErrorMessage(error)}
    </Alert>
  );
}

function ExpiredNotice({ onRestart }: { onRestart: () => void }) {
  return (
    <Alert className="border-amber-500/30 bg-amber-500/10 text-amber-100">
      <Clock3 className="mb-2 size-5" />
      <p>Giao dịch đã hết hạn và không thể tiếp tục.</p>
      <Button className="mt-3 text-amber-100 hover:bg-amber-500/20" onClick={onRestart} size="sm" variant="ghost">
        Bắt đầu lại
      </Button>
    </Alert>
  );
}

function TransactionLoading() {
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

function BackToServices() {
  return (
    <Link className="inline-flex items-center text-sm text-slate-400 hover:text-white" to="/customer/services">
      <ArrowLeft className="mr-1 size-4" />
      Danh sách dịch vụ
    </Link>
  );
}

function initialValues(fields: TransactionInputField[]): RawValues {
  return fields.reduce<RawValues>((result, field) => {
    if (field.defaultValue !== undefined) {
      result[field.name] = displayValue(field.defaultValue, normalizeDataType(field));
    } else {
      result[field.name] = "";
    }
    return result;
  }, {});
}

function displayValue(value: unknown, type: string): RawFieldValue {
  if (type === "boolean") return Boolean(value);
  if (type === "object") {
    return typeof value === "string" ? value : JSON.stringify(value, null, 2);
  }
  return value === null ? "" : String(value);
}

function normalizeFields(fields: TransactionInputField[], values: RawValues) {
  const body: Record<string, unknown> = {};
  const errors: FieldErrors = {};

  fields.forEach((field) => {
    const raw = values[field.name];
    const type = normalizeDataType(field);
    const empty = raw === "" || raw === null || raw === undefined;
    if (empty) {
      if (field.required) errors[field.name] = "Trường này là bắt buộc.";
      return;
    }

    try {
      let value: unknown = raw;
      if (type === "number" || type === "integer") {
        value = Number(raw);
        if (!Number.isFinite(value) || (type === "integer" && !Number.isInteger(value))) {
          throw new Error(type === "integer" ? "Vui lòng nhập số nguyên hợp lệ." : "Vui lòng nhập số hợp lệ.");
        }
      } else if (type === "object") {
        value = typeof raw === "string" ? JSON.parse(raw) : raw;
        if (typeof value !== "object" || value === null) throw new Error("Vui lòng nhập JSON object hợp lệ.");
      } else if (type === "boolean") {
        value = Boolean(raw);
      } else {
        value = String(raw).trim();
      }

      validateValue(field, value, type);
      body[field.name] = value;
    } catch (error) {
      errors[field.name] = error instanceof Error ? error.message : "Giá trị không hợp lệ.";
    }
  });

  return { body, errors };
}

function validateValue(field: TransactionInputField, value: unknown, type: string) {
  const validation = field.validation;
  if (!validation) return;
  const comparable =
    type === "number" || type === "integer"
      ? Number(value)
      : typeof value === "string"
        ? value.length
        : Array.isArray(value)
          ? value.length
          : undefined;

  if (validation.minLength !== undefined && comparable !== undefined && comparable < validation.minLength) {
    throw new Error(
      type === "number" || type === "integer"
        ? `Giá trị tối thiểu là ${validation.minLength}.`
        : `Cần ít nhất ${validation.minLength} ký tự.`,
    );
  }
  if (validation.maxLength !== undefined && comparable !== undefined && comparable > validation.maxLength) {
    throw new Error(
      type === "number" || type === "integer"
        ? `Giá trị tối đa là ${validation.maxLength}.`
        : `Tối đa ${validation.maxLength} ký tự.`,
    );
  }
  if (validation.regex && !safeRegexTest(validation.regex, String(value))) {
    throw new Error("Giá trị chưa đúng định dạng yêu cầu.");
  }
}

function safeRegexTest(pattern: string, value: string) {
  try {
    return new RegExp(pattern).test(value);
  } catch {
    return true;
  }
}

function normalizeDataType(field: TransactionInputField) {
  const raw = (field.dataType || field.validation?.format || "string").toLowerCase();
  const aliases: Record<string, string> = {
    phone: "string",
    text: "string",
    int: "integer",
    float: "number",
    decimal: "number",
    bool: "boolean",
    array: "object",
    json: "object",
    password: "secured",
  };
  return aliases[raw] || raw;
}

function useExpired(expiredAt?: string) {
  const [expired, setExpired] = useState(false);
  useEffect(() => {
    if (!expiredAt) {
      setExpired(false);
      return;
    }
    const updateExpired = () => setExpired(new Date(expiredAt).getTime() <= Date.now());
    updateExpired();
    const interval = window.setInterval(updateExpired, 1_000);
    return () => window.clearInterval(interval);
  }, [expiredAt]);
  return expired;
}
