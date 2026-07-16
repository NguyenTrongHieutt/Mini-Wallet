import { Input } from "@/components/ui/input";
import { ProviderCodeInput } from "./provider-code-input";
import {
  transactionFieldControl,
  type RawFieldValue,
} from "./transaction-field-utils";
import type { TransactionInputField } from "./types";

interface TransactionFieldProps {
  field: TransactionInputField;
  value: RawFieldValue;
  onChange: (value: RawFieldValue) => void;
  serviceCode: string;
  error?: string;
}

export function TransactionField({
  field,
  value,
  onChange,
  serviceCode,
  error,
}: TransactionFieldProps) {
  const id = `transaction-field-${field.name}`;
  const placeholder = field.role?.trim() || field.name;
  const label = field.role?.trim() || field.name;
  const control = transactionFieldControl(field);

  return (
    <label className="grid gap-1.5 text-sm font-medium text-slate-200" htmlFor={id}>
      <span>
        {label}
        {field.required && <span className="ml-1 text-red-400">*</span>}
      </span>
      {control === "provider-autocomplete" ? (
        <ProviderCodeInput
          id={id}
          invalid={Boolean(error)}
          onChange={onChange}
          placeholder={placeholder}
          serviceCode={serviceCode}
          value={String(value)}
        />
      ) : control === "boolean" ? (
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
      ) : control === "json" ? (
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
          inputMode={control === "number" ? "decimal" : undefined}
          maxLength={field.validation?.maxLength}
          minLength={field.validation?.minLength}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          type={control === "secret" ? "password" : "text"}
          value={String(value)}
        />
      )}
      {error && <span className="text-xs font-normal text-red-300">{error}</span>}
    </label>
  );
}
