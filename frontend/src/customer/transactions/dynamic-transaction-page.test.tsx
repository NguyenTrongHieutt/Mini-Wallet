import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { customerTransactionApi } from "./customer-transaction-api";
import { DynamicTransactionPage } from "./dynamic-transaction-page";
import type { ServiceInputFieldsData } from "./types";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const definition: ServiceInputFieldsData = {
  service: {
    id: "service-1",
    code: "BILL_PAYMENT",
    name: "Thanh toán hóa đơn",
    description: "Thanh toán hóa đơn theo provider.",
    status: "active",
  },
  endpoint: { method: "POST", path: "/api/v1/transactions/request" },
  bodyFields: [
    {
      name: "providerCode",
      role: "Mã nhà cung cấp",
      dataType: "string",
      required: true,
    },
    {
      name: "amount",
      role: "Số tiền thanh toán",
      dataType: "number",
      required: true,
      validation: { format: "number", minLength: 1_000 },
    },
    {
      name: "currency",
      role: "Loại tiền",
      dataType: "string",
      required: true,
      defaultValue: "VND",
    },
    {
      name: "metadata",
      role: "Thông tin bổ sung",
      dataType: "object",
      required: false,
    },
    {
      name: "message",
      role: "",
      dataType: "string",
      required: false,
    },
  ],
  requestExample: {
    providerCode: "AUTO_MUST_NOT_BE_USED",
    amount: 999_999,
    metadata: { auto: true },
  },
};

function renderPage() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  });

  return {
    client,
    ...render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={["/customer/services/BILL_PAYMENT"]}>
          <Routes>
            <Route path="/customer/services/:serviceCode" element={<DynamicTransactionPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    ),
  };
}

describe("dynamic customer transaction flow", () => {
  it("waits for input-fields and only prefills defaultValue, using role as placeholder", async () => {
    let resolveDefinition: (value: ServiceInputFieldsData) => void = () => undefined;
    vi.spyOn(customerTransactionApi, "inputFields").mockImplementation(
      () => new Promise((resolve) => {
        resolveDefinition = resolve;
      }),
    );

    renderPage();

    expect(screen.getByLabelText("Đang tải cấu hình dịch vụ")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Xem trước giao dịch" })).not.toBeInTheDocument();

    resolveDefinition(definition);

    const providerInput = await screen.findByPlaceholderText("Mã nhà cung cấp");
    expect(providerInput).toHaveValue("");
    expect(screen.getByPlaceholderText("Số tiền thanh toán")).toHaveValue("");
    expect(screen.getByPlaceholderText("Loại tiền")).toHaveValue("VND");
    expect(screen.getByPlaceholderText("Thông tin bổ sung")).toHaveValue("");
    expect(screen.getByPlaceholderText("message")).toHaveValue("");
  });

  it("keeps provider suggestions explicit and requires buttons for every transaction step", async () => {
    vi.spyOn(customerTransactionApi, "inputFields").mockResolvedValue(definition);
    const providers = vi.spyOn(customerTransactionApi, "providers").mockResolvedValue({
      items: [
        {
          id: "provider-1",
          serviceCode: "BILL_PAYMENT",
          code: "EVN",
          name: "Điện lực Việt Nam",
          category: "electricity",
          status: "active",
        },
      ],
      pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });
    const request = vi.spyOn(customerTransactionApi, "request").mockImplementation(
      async (body) => {
        const amount = Number(body.amount);
        return {
          transRefId: "trail-1",
          service: definition.service,
          amount,
          fee: 1_000,
          totalAmount: amount + 1_000,
          currency: "VND",
          input: {
            providerCode: body.providerCode,
            amount: body.amount,
            currency: body.currency,
          },
          status: "draft",
          expiredAt: "2030-01-01T00:00:00.000Z",
        };
      },
    );
    const confirm = vi.spyOn(customerTransactionApi, "confirm").mockResolvedValue({
      transRefId: "trail-1",
      service: definition.service,
      authMethod: "PIN",
      status: "pending",
      expiredAt: "2030-01-01T00:00:00.000Z",
    });
    const verify = vi.spyOn(customerTransactionApi, "verify").mockResolvedValue({
      transRefId: "trail-1",
      transaction: { id: "transaction-1", code: "TX-001", status: "done" },
      service: definition.service,
      amount: 50_000,
      fee: 1_000,
      totalAmount: 51_000,
      currency: "VND",
      status: "done",
    });
    const user = userEvent.setup();

    renderPage();

    const providerInput = await screen.findByPlaceholderText("Mã nhà cung cấp");
    await user.click(providerInput);
    await waitFor(() => expect(providers).toHaveBeenCalledTimes(1), { timeout: 1_500 });
    expect(providerInput).toHaveValue("");

    expect(await screen.findByRole("option", { name: /Điện lực Việt Nam/ })).toBeInTheDocument();
    expect(providerInput).toHaveValue("");
    await user.click(screen.getByRole("option", { name: /Điện lực Việt Nam/ }));
    expect(providerInput).toHaveValue("EVN");

    await user.type(screen.getByPlaceholderText("Số tiền thanh toán"), "50000");
    await user.click(screen.getByRole("button", { name: "Xem trước giao dịch" }));

    await waitFor(() => expect(request).toHaveBeenCalledTimes(1));
    expect(request.mock.calls[0]?.[0]).toEqual({
      serviceCode: "BILL_PAYMENT",
      providerCode: "EVN",
      amount: 50_000,
      currency: "VND",
    });
    expect(confirm).not.toHaveBeenCalled();

    await user.click(await screen.findByRole("button", { name: "Chỉnh sửa" }));
    expect(screen.getByPlaceholderText("Mã nhà cung cấp")).toHaveValue("EVN");
    const amountInput = screen.getByPlaceholderText("Số tiền thanh toán");
    expect(amountInput).toHaveValue("50000");
    await user.clear(amountInput);
    await user.type(amountInput, "60000");
    await user.click(screen.getByRole("button", { name: "Xem trước giao dịch" }));

    await waitFor(() => expect(request).toHaveBeenCalledTimes(2));
    expect(request.mock.calls[1]?.[0]).toEqual({
      serviceCode: "BILL_PAYMENT",
      transRefId: "trail-1",
      providerCode: "EVN",
      amount: 60_000,
      currency: "VND",
    });
    expect(confirm).not.toHaveBeenCalled();

    await user.click(await screen.findByRole("button", { name: "Xác nhận giao dịch" }));
    await waitFor(() => expect(confirm).toHaveBeenCalledWith("trail-1"));
    expect(verify).not.toHaveBeenCalled();

    const pinInput = await screen.findByLabelText("Mã PIN 6 chữ số");
    await user.type(pinInput, "123456");
    expect(verify).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Xác thực và thanh toán" }));
    await waitFor(() => expect(verify).toHaveBeenCalledWith("trail-1", "123456"));
    expect(await screen.findByRole("heading", { name: "Giao dịch hoàn tất" })).toBeInTheDocument();
  });
});
