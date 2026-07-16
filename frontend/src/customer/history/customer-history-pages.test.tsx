import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { customerHistoryApi } from "./customer-history-api";
import { CustomerTransactionDetailPage } from "./customer-transaction-detail-page";
import { CustomerTransactionListPage } from "./customer-transaction-list-page";
import type { CustomerTransactionListData } from "./types";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const emptyHistory: CustomerTransactionListData = {
  items: [],
  pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 },
  sort: "createdAt DESC",
};

function renderPage(component: ReactNode, initialEntry = "/customer/transactions") {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialEntry]}>{component}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("customer transaction history", () => {
  it("keeps filters as draft until the search button is pressed", async () => {
    const list = vi.spyOn(customerHistoryApi, "list").mockResolvedValue(emptyHistory);
    const user = userEvent.setup();
    renderPage(<CustomerTransactionListPage />);

    await waitFor(() => expect(list).toHaveBeenCalledTimes(1));
    await user.type(screen.getByLabelText("Từ khóa"), "ăn tối");
    await user.selectOptions(screen.getByLabelText("Chiều giao dịch"), "sent");
    await user.selectOptions(screen.getByLabelText("Trạng thái"), "done");
    await user.type(screen.getByLabelText("Mã dịch vụ"), "p2p_transfer");
    await user.type(screen.getByLabelText("Số tiền từ"), "10000");
    expect(list).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Tìm kiếm" }));
    await waitFor(() => expect(list).toHaveBeenCalledTimes(2));
    expect(list.mock.calls[1]?.[0]).toMatchObject({
      page: 1,
      q: "ăn tối",
      direction: "sent",
      status: "done",
      serviceCode: "P2P_TRANSFER",
      amountFrom: 10000,
    });
  });

  it("does not open the only result automatically", async () => {
    vi.spyOn(customerHistoryApi, "list").mockResolvedValue({
      items: [{
        id: "transaction-1",
        code: "TXN-001",
        transRefId: "REF-001",
        direction: "sent",
        amount: 100000,
        fee: 1000,
        totalAmount: 101000,
        currency: "VND",
        message: "Ăn tối",
        status: "done",
        createdAt: "2026-07-16T01:00:00.000Z",
        updatedAt: "2026-07-16T01:00:00.000Z",
      }],
      pagination: { page: 1, pageSize: 10, total: 1, totalPages: 1 },
    });

    renderPage(
      <Routes>
        <Route path="/customer/transactions" element={<CustomerTransactionListPage />} />
        <Route path="/customer/transactions/:transactionId" element={<h1>Receipt detail</h1>} />
      </Routes>,
    );

    expect(await screen.findByText("TXN-001")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Lịch sử giao dịch" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Receipt detail" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Chi tiết/ })).toHaveAttribute(
      "href",
      "/customer/transactions/transaction-1",
    );
  });

  it("renders detail when optional trail and entries are absent", async () => {
    const detail = vi.spyOn(customerHistoryApi, "detail").mockResolvedValue({
      transaction: {
        id: "transaction-1",
        code: "TXN-001",
        transRefId: "REF-001",
        direction: "received",
        service: { code: "P2P_TRANSFER", name: "Chuyển tiền" },
        sender: { type: "customer", displayName: "Nguyễn A", phone: "0900000001" },
        receiver: { type: "customer", displayName: "Nguyễn B", phone: "0900000002" },
        amount: 100000,
        fee: 0,
        totalAmount: 100000,
        currency: { code: "VND", name: "Việt Nam Đồng" },
        message: "Hoàn tiền",
        status: "done",
        createdAt: "2026-07-16T01:00:00.000Z",
        updatedAt: "2026-07-16T01:00:00.000Z",
      },
    });

    renderPage(
      <Routes>
        <Route path="/customer/transactions/:transactionId" element={<CustomerTransactionDetailPage />} />
      </Routes>,
      "/customer/transactions/transaction-1",
    );

    expect(await screen.findByRole("heading", { name: "TXN-001" })).toBeInTheDocument();
    expect(detail).toHaveBeenCalledWith("transaction-1");
    expect(screen.getByText("Chuyển tiền (P2P_TRANSFER)")).toBeInTheDocument();
    expect(screen.queryByText("Thông tin bổ sung")).not.toBeInTheDocument();
  });
});

