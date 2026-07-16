import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useCustomerAuth } from "@/customer/auth/customer-auth-context";
import { customerKeys } from "@/customer/api/customer-auth-api";
import { customerWalletApi } from "./customer-wallet-api";
import { CustomerProfilePage } from "./customer-profile-page";

vi.mock("@/customer/auth/customer-auth-context", () => ({
  useCustomerAuth: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("customer profile", () => {
  it("uses the authenticated customer and loads the VND wallet with refresh", async () => {
    vi.mocked(useCustomerAuth).mockReturnValue({
      customer: {
        id: "customer-1",
        phone: "0900000001",
        displayName: "Nguyễn Văn A",
        status: "active",
        createdAt: "2026-07-01T00:00:00.000Z",
      },
      status: "authenticated",
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      retrySession: vi.fn(),
      isLoggingIn: false,
      isRegistering: false,
      isLoggingOut: false,
    });
    const balance = vi.spyOn(customerWalletApi, "balance").mockResolvedValue({
      pocket: {
        id: "pocket-1",
        name: "Ví chính",
        balance: 250000,
        currency: { code: "VND", name: "Việt Nam Đồng" },
        status: "active",
      },
    });
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: Infinity } },
    });
    const user = userEvent.setup();

    render(
      <QueryClientProvider client={client}>
        <CustomerProfilePage />
      </QueryClientProvider>,
    );

    expect(await screen.findByText("250.000 VND")).toBeInTheDocument();
    expect(screen.getByText("Nguyễn Văn A")).toBeInTheDocument();
    expect(screen.getByText("0900000001")).toBeInTheDocument();
    expect(balance).toHaveBeenCalledWith("VND");
    expect(client.getQueryData(customerKeys.wallet("VND"))).toMatchObject({ id: "pocket-1" });

    await user.click(screen.getByRole("button", { name: "Làm mới số dư" }));
    await waitFor(() => expect(balance).toHaveBeenCalledTimes(2));
  });
});

