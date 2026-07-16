import { useMutation, useQuery } from '@tanstack/react-query'
import { operationsApi } from './api'
import type { LedgerFilters, TrailFilters, TransactionFilters } from './types'

export const operationKeys = {
  trails: (filters: TrailFilters) => ['trails', filters] as const,
  trail: (id: string) => ['trail', id] as const,
  transactions: (filters: TransactionFilters) => ['transactions', filters] as const,
  transaction: (id: string) => ['transaction', id] as const,
  ledgerEntries: (filters: LedgerFilters) => ['ledgerEntries', filters] as const,
  ledgerEntry: (id: string) => ['ledgerEntry', id] as const,
}

export function useTrails(filters: TrailFilters) {
  return useQuery({ queryKey: operationKeys.trails(filters), queryFn: () => operationsApi.listTrails(filters), placeholderData: (old) => old })
}

export function useTrail(id?: string) {
  return useQuery({ queryKey: operationKeys.trail(id ?? ''), queryFn: () => operationsApi.trailDetail(id as string), enabled: Boolean(id), select: (data) => data.trail })
}

export function useTransactions(filters: TransactionFilters) {
  return useQuery({ queryKey: operationKeys.transactions(filters), queryFn: () => operationsApi.listTransactions(filters), placeholderData: (old) => old })
}

export function useTransaction(id?: string) {
  return useQuery({ queryKey: operationKeys.transaction(id ?? ''), queryFn: () => operationsApi.transactionDetail(id as string), enabled: Boolean(id), select: (data) => data.transaction })
}

export function useLedgerEntries(filters: LedgerFilters) {
  return useQuery({ queryKey: operationKeys.ledgerEntries(filters), queryFn: () => operationsApi.listLedgerEntries(filters), placeholderData: (old) => old })
}

export function useLedgerEntry(id?: string) {
  return useQuery({ queryKey: operationKeys.ledgerEntry(id ?? ''), queryFn: () => operationsApi.ledgerEntryDetail(id as string), enabled: Boolean(id), select: (data) => data.entry })
}

export function useTriggerTransaction() {
  return useMutation({ mutationFn: operationsApi.trigger })
}
