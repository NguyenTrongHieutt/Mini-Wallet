import type { TransactionInputField } from "./types";

export type RawFieldValue = string | boolean;
export type RawValues = Record<string, RawFieldValue>;
export type FieldErrors = Record<string, string>;

export type TransactionFieldControl =
  | "provider-autocomplete"
  | "boolean"
  | "json"
  | "number"
  | "secret"
  | "text";

const DATA_TYPE_ALIASES: Readonly<Record<string, string>> = Object.freeze({
  phone: "string",
  text: "string",
  int: "integer",
  float: "number",
  decimal: "number",
  bool: "boolean",
  array: "object",
  json: "object",
  password: "secured",
});

export function normalizeDataType(field: TransactionInputField): string {
  const raw = (field.dataType || field.validation?.format || "string").trim().toLowerCase();
  return DATA_TYPE_ALIASES[raw] || raw;
}

export function transactionFieldControl(field: TransactionInputField): TransactionFieldControl {
  if (field.name.trim().toLowerCase() === "providercode") {
    return "provider-autocomplete";
  }

  const type = normalizeDataType(field);
  if (type === "boolean") return "boolean";
  if (type === "object") return "json";
  if (type === "number" || type === "integer") return "number";
  if (field.validation?.needSecured || type === "secured") return "secret";
  return "text";
}

export function initialTransactionValues(fields: TransactionInputField[]): RawValues {
  return fields.reduce<RawValues>((result, field) => {
    result[field.name] =
      field.defaultValue === undefined
        ? ""
        : displayTransactionFieldValue(field.defaultValue, normalizeDataType(field));
    return result;
  }, {});
}

export function prefillTransactionValues(
  fields: TransactionInputField[],
  input?: Record<string, unknown> | null,
): RawValues {
  const values = initialTransactionValues(fields);
  if (!input) return values;

  fields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(input, field.name)) {
      values[field.name] = displayTransactionFieldValue(
        input[field.name],
        normalizeDataType(field),
      );
    }
  });

  return values;
}

export function normalizeTransactionFields(
  fields: TransactionInputField[],
  values: RawValues,
): { body: Record<string, unknown>; errors: FieldErrors } {
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
      const value = normalizeTransactionFieldValue(raw, type);
      validateTransactionFieldValue(field, value, type);
      body[field.name] = value;
    } catch (error) {
      errors[field.name] =
        error instanceof Error ? error.message : "Giá trị không hợp lệ.";
    }
  });

  return { body, errors };
}

function displayTransactionFieldValue(value: unknown, type: string): RawFieldValue {
  if (type === "boolean") {
    return value === true || value === "true";
  }
  if (type === "object") {
    return typeof value === "string" ? value : JSON.stringify(value, null, 2);
  }
  return value === null ? "" : String(value);
}

function normalizeTransactionFieldValue(raw: RawFieldValue, type: string): unknown {
  if (type === "number" || type === "integer") {
    const value = Number(raw);
    if (!Number.isFinite(value) || (type === "integer" && !Number.isInteger(value))) {
      throw new Error(
        type === "integer"
          ? "Vui lòng nhập số nguyên hợp lệ."
          : "Vui lòng nhập số hợp lệ.",
      );
    }
    return value;
  }

  if (type === "object") {
    const value = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (typeof value !== "object" || value === null) {
      throw new Error("Vui lòng nhập JSON object hợp lệ.");
    }
    return value;
  }

  if (type === "boolean") {
    return raw === true || raw === "true";
  }

  return String(raw).trim();
}

function validateTransactionFieldValue(
  field: TransactionInputField,
  value: unknown,
  type: string,
): void {
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

  if (
    validation.minLength !== undefined &&
    comparable !== undefined &&
    comparable < validation.minLength
  ) {
    throw new Error(
      type === "number" || type === "integer"
        ? `Giá trị tối thiểu là ${validation.minLength}.`
        : `Cần ít nhất ${validation.minLength} ký tự.`,
    );
  }

  if (
    validation.maxLength !== undefined &&
    comparable !== undefined &&
    comparable > validation.maxLength
  ) {
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

function safeRegexTest(pattern: string, value: string): boolean {
  try {
    return new RegExp(pattern).test(value);
  } catch {
    return true;
  }
}
