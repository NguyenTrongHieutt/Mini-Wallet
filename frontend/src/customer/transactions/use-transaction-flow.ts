import { useEffect, useRef, useState, type FormEvent } from "react";
import { useTransactionMutations } from "./customer-transaction-queries";
import {
  initialTransactionValues,
  normalizeTransactionFields,
  prefillTransactionValues,
  type FieldErrors,
  type RawFieldValue,
  type RawValues,
} from "./transaction-field-utils";
import type {
  ServiceInputFieldsData,
  TransactionConfirmation,
  TransactionPreview,
  TransactionReceipt,
} from "./types";

export function useTransactionFlow(
  definition: ServiceInputFieldsData,
  serviceCode: string,
) {
  const [values, setValues] = useState<RawValues>(() =>
    initialTransactionValues(definition.bodyFields),
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [preview, setPreview] = useState<TransactionPreview | null>(null);
  const [confirmation, setConfirmation] = useState<TransactionConfirmation | null>(null);
  const [receipt, setReceipt] = useState<TransactionReceipt | null>(null);
  const [activeTransRefId, setActiveTransRefId] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const requestLocked = useRef(false);
  const confirmLocked = useRef(false);
  const verifyLocked = useRef(false);
  const mutations = useTransactionMutations();
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
    if (requestLocked.current || mutations.requestMutation.isPending) return;
    const normalized = normalizeTransactionFields(definition.bodyFields, values);
    setErrors(normalized.errors);
    if (Object.keys(normalized.errors).length > 0) return;
    requestLocked.current = true;
    try {
      const nextPreview = await mutations.requestMutation.mutateAsync({
        serviceCode,
        ...(activeTransRefId ? { transRefId: activeTransRefId } : {}),
        ...normalized.body,
      });
      setActiveTransRefId(nextPreview.transRefId);
      setPreview(nextPreview);
    } catch {
      // Mutation state renders the API error.
    } finally {
      requestLocked.current = false;
    }
  }

  async function confirmTransaction() {
    if (
      !preview ||
      confirmLocked.current ||
      mutations.confirmMutation.isPending ||
      expired
    ) {
      return;
    }
    confirmLocked.current = true;
    try {
      const nextConfirmation = await mutations.confirmMutation.mutateAsync(
        preview.transRefId,
      );
      setConfirmation(nextConfirmation);
    } catch {
      // Mutation state renders the API error.
    } finally {
      confirmLocked.current = false;
    }
  }

  async function verifyTransaction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      !confirmation ||
      verifyLocked.current ||
      mutations.verifyMutation.isPending ||
      expired
    ) {
      return;
    }
    if (confirmation.authMethod === "PIN" && !isValidPin(pin)) return;
    verifyLocked.current = true;
    try {
      const nextReceipt = await mutations.verifyMutation.mutateAsync({
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

  function editRequest() {
    if (!preview) return;
    setValues(prefillTransactionValues(definition.bodyFields, preview.input));
    setErrors({});
    setPreview(null);
    setConfirmation(null);
    setPin("");
    mutations.confirmMutation.reset();
    mutations.verifyMutation.reset();
  }

  function restart() {
    setValues(initialTransactionValues(definition.bodyFields));
    setErrors({});
    setPreview(null);
    setConfirmation(null);
    setReceipt(null);
    setActiveTransRefId(null);
    setPin("");
    requestLocked.current = false;
    confirmLocked.current = false;
    verifyLocked.current = false;
    mutations.requestMutation.reset();
    mutations.confirmMutation.reset();
    mutations.verifyMutation.reset();
  }

  return {
    confirmation,
    errors,
    expired,
    mutations,
    pin,
    preview,
    receipt,
    values,
    confirmTransaction,
    editRequest,
    restart,
    setFieldValue,
    setPin,
    submitRequest,
    verifyTransaction,
  };
}

export type TransactionFlowController = ReturnType<typeof useTransactionFlow>;

export function isValidPin(pin: string) {
  return /^\d{6}$/.test(pin);
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
