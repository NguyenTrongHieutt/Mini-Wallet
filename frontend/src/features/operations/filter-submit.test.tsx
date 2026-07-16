import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import type { ReactNode } from 'react'
import { operationsApi } from './api'
import { LedgerEntryListPage } from './LedgerEntryListPage'
import { TransactionListPage } from './TransactionListPage'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

function renderWithProviders(component: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={client}><MemoryRouter>{component}</MemoryRouter></QueryClientProvider>)
}

const emptyResult = {
  items: [],
  pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
  sort: 'createdAt DESC',
}

describe('operation filters submit behavior', () => {
  it('only searches transactions after the search button is pressed', async () => {
    const list = vi.spyOn(operationsApi, 'listTransactions').mockResolvedValue(emptyResult)
    const user = userEvent.setup()
    renderWithProviders(<TransactionListPage/>)
    await waitFor(() => expect(list).toHaveBeenCalledTimes(1))

    await user.type(screen.getByLabelText('TransRef ID'), 'TRAIL-001')
    await user.type(screen.getByLabelText('Mã dịch vụ'), 'cash_in')
    expect(list).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: 'Tìm kiếm' }))
    await waitFor(() => expect(list).toHaveBeenCalledTimes(2))
    expect(list.mock.calls[1]?.[0]).toMatchObject({ transRefId: 'TRAIL-001', serviceCode: 'CASH_IN' })
  })

  it('only searches ledger entries after the search button is pressed', async () => {
    const list = vi.spyOn(operationsApi, 'listLedgerEntries').mockResolvedValue(emptyResult)
    const user = userEvent.setup()
    renderWithProviders(<LedgerEntryListPage/>)
    await waitFor(() => expect(list).toHaveBeenCalledTimes(1))

    await user.type(screen.getByLabelText('TransRef ID'), 'TRAIL-002')
    await user.type(screen.getByLabelText('Mã ví'), 'POCKET-001')
    expect(list).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: 'Tìm kiếm' }))
    await waitFor(() => expect(list).toHaveBeenCalledTimes(2))
    expect(list.mock.calls[1]?.[0]).toMatchObject({ transRefId: 'TRAIL-002', pocketId: 'POCKET-001' })
  })
})
