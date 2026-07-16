import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { customerServiceApi } from "./customer-service-api";
import { CustomerServiceListPage } from "./customer-service-list-page";
import type { CustomerServiceListData } from "./types";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const emptyResult: CustomerServiceListData = {
  items: [],
  pagination: { page: 1, pageSize: 12, total: 0, totalPages: 0 },
  sort: "name ASC",
};

function renderWithProviders(component: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });

  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/customer/services"]}>{component}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("customer service catalog", () => {
  it("only applies draft filters after the search button is pressed", async () => {
    const list = vi.spyOn(customerServiceApi, "list").mockResolvedValue(emptyResult);
    const user = userEvent.setup();

    renderWithProviders(<CustomerServiceListPage />);
    await waitFor(() => expect(list).toHaveBeenCalledTimes(1));

    await user.type(screen.getByLabelText("Từ khóa"), "chuyển tiền");
    await user.type(screen.getByLabelText("Mã dịch vụ"), "p2p_transfer");
    expect(list).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Tìm kiếm" }));
    await waitFor(() => expect(list).toHaveBeenCalledTimes(2));
    expect(list.mock.calls[1]?.[0]).toMatchObject({
      page: 1,
      q: "chuyển tiền",
      code: "P2P_TRANSFER",
    });
  });

  it("does not navigate automatically when the search returns one service", async () => {
    vi.spyOn(customerServiceApi, "list").mockResolvedValue({
      items: [
        {
          id: "service-1",
          code: "P2P_TRANSFER",
          name: "Chuyển tiền",
          description: "Chuyển tiền giữa hai ví.",
          status: "active",
        },
      ],
      pagination: { page: 1, pageSize: 12, total: 1, totalPages: 1 },
      sort: "name ASC",
    });

    renderWithProviders(
      <Routes>
        <Route path="/customer/services" element={<CustomerServiceListPage />} />
        <Route path="/customer/services/:serviceCode" element={<h1>Chi tiết dịch vụ</h1>} />
      </Routes>,
    );

    expect(await screen.findByRole("heading", { name: "Chuyển tiền" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Dịch vụ" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Chi tiết dịch vụ" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Chọn dịch vụ/ })).toHaveAttribute(
      "href",
      "/customer/services/P2P_TRANSFER",
    );
  });
});
