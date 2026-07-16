import { describe, expect, it } from "vitest";
import {
  initialTransactionValues,
  normalizeDataType,
  normalizeTransactionFields,
  prefillTransactionValues,
  transactionFieldControl,
} from "./transaction-field-utils";
import type { TransactionInputField } from "./types";

describe("transaction field controls", () => {
  it("centralizes providerCode autocomplete selection without DB UI metadata", () => {
    expect(
      transactionFieldControl({
        name: "providerCode",
        dataType: "string",
      }),
    ).toBe("provider-autocomplete");
    expect(
      transactionFieldControl({
        name: "PROVIDERCODE",
        dataType: "text",
      }),
    ).toBe("provider-autocomplete");
    expect(
      transactionFieldControl({
        name: "provider",
        dataType: "string",
      }),
    ).toBe("text");
  });

  it.each([
    [{ name: "enabled", dataType: "bool" }, "boolean"],
    [{ name: "metadata", dataType: "json" }, "json"],
    [{ name: "amount", dataType: "decimal" }, "number"],
    [{ name: "pin", dataType: "string", validation: { needSecured: true } }, "secret"],
    [{ name: "message", dataType: "phone" }, "text"],
  ] satisfies Array<[TransactionInputField, string]>)(
    "maps %s to the expected fallback control",
    (field, control) => {
      expect(transactionFieldControl(field)).toBe(control);
    },
  );
});

describe("transaction field normalization", () => {
  const fields: TransactionInputField[] = [
    { name: "amount", dataType: "number", required: true, validation: { minLength: 1_000 } },
    { name: "count", dataType: "int", required: true },
    { name: "enabled", dataType: "boolean", defaultValue: false },
    { name: "metadata", dataType: "json" },
    { name: "message", dataType: "text", validation: { regex: "^[A-Z]+$" } },
  ];

  it("normalizes aliases, defaults, primitive values and JSON objects", () => {
    expect(normalizeDataType(fields[1])).toBe("integer");
    expect(initialTransactionValues(fields)).toEqual({
      amount: "",
      count: "",
      enabled: false,
      metadata: "",
      message: "",
    });
    expect(
      normalizeTransactionFields(fields, {
        amount: "5000",
        count: "2",
        enabled: false,
        metadata: '{"source":"app"}',
        message: "HELLO",
      }),
    ).toEqual({
      body: {
        amount: 5_000,
        count: 2,
        enabled: false,
        metadata: { source: "app" },
        message: "HELLO",
      },
      errors: {},
    });
  });

  it("returns field errors without leaking invalid values into the request body", () => {
    expect(
      normalizeTransactionFields(fields, {
        amount: "999",
        count: "1.5",
        enabled: false,
        metadata: "null",
        message: "lowercase",
      }),
    ).toEqual({
      body: { enabled: false },
      errors: {
        amount: "Giá trị tối thiểu là 1000.",
        count: "Vui lòng nhập số nguyên hợp lệ.",
        metadata: "Vui lòng nhập JSON object hợp lệ.",
        message: "Giá trị chưa đúng định dạng yêu cầu.",
      },
    });
  });

  it("prefills only fields declared by the input-field contract", () => {
    expect(
      prefillTransactionValues(fields, {
        amount: 2_000,
        enabled: "false",
        metadata: { source: "preview" },
        ignored: "value",
      }),
    ).toEqual({
      amount: "2000",
      count: "",
      enabled: false,
      metadata: '{\n  "source": "preview"\n}',
      message: "",
    });
  });
});
