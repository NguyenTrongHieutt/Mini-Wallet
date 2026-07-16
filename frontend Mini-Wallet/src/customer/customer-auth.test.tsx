import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { MemoryRouter } from "react-router-dom";
import App from "@/App";
import { server } from "@/test/server";

const customer = {
  id: "customer-1",
  phone: "0900000001",
  displayName: "Nguyễn Văn A",
  status: "active",
};

function envelope(data: unknown, err = 200, message = "OK") {
  return HttpResponse.json({ err, message, data });
}

function renderApp(route: string) {
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
        <MemoryRouter initialEntries={[route]}>
          <App />
        </MemoryRouter>
      </QueryClientProvider>,
    ),
  };
}

describe("customer auth routing", () => {
  it("restores a customer session without probing the officer session", async () => {
    const officerProbe = vi.fn();
    server.use(
      http.post("/api/v1/customer/me", () => envelope({ customer })),
      http.post("/api/v1/customer/services/list", () =>
        envelope({
          items: [],
          pagination: { page: 1, pageSize: 12, total: 0, totalPages: 0 },
          sort: "name ASC",
        }),
      ),
      http.post("/api/v1/officer/me", () => {
        officerProbe();
        return envelope(null, 401, "UNAUTHENTICATED");
      }),
    );

    renderApp("/customer/services");

    expect(await screen.findByText("Nguyễn Văn A")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Dịch vụ" })).toBeInTheDocument();
    expect(officerProbe).not.toHaveBeenCalled();
  });

  it("redirects an anonymous customer to the customer login route", async () => {
    server.use(
      http.post("/api/v1/customer/me", () => envelope(null, 401, "UNAUTHENTICATED")),
    );

    renderApp("/customer/profile");

    expect(await screen.findByRole("heading", { name: "Đăng nhập Mini Wallet" })).toBeInTheDocument();
  });

  it("logs in and returns to the originally requested customer route", async () => {
    server.use(
      http.post("/api/v1/customer/me", () => envelope(null, 401, "UNAUTHENTICATED")),
      http.post("/api/v1/customer/auth/login", async ({ request }) => {
        expect(await request.json()).toEqual({
          phone: "0900000001",
          password: "Password123",
        });
        return envelope({
          customer,
          auth: { accessToken: "ignored", expiresAt: "2030-01-01T00:00:00.000Z", tokenType: "Bearer" },
        });
      }),
      http.post("/api/v1/customer/transactions/list", () =>
        envelope({
          items: [],
          pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 },
          sort: "createdAt DESC",
        }),
      ),
    );
    const user = userEvent.setup();

    renderApp("/customer/transactions");
    await user.type(await screen.findByLabelText("Số điện thoại"), "0900000001");
    await user.type(screen.getByLabelText("Mật khẩu"), "Password123");
    await user.click(screen.getByRole("button", { name: "Đăng nhập" }));

    expect(await screen.findByRole("heading", { name: "Lịch sử giao dịch" })).toBeInTheDocument();
  });

  it("shows a retry state for a network failure instead of deleting the session", async () => {
    server.use(
      http.post("/api/v1/customer/me", () => HttpResponse.error()),
    );

    renderApp("/customer/services");

    expect(await screen.findByRole("heading", { name: "Không thể kiểm tra phiên đăng nhập" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeInTheDocument();
  });

  it("validates registration locally and does not submit invalid values", async () => {
    const registerRequest = vi.fn();
    server.use(
      http.post("/api/v1/customer/me", () => envelope(null, 401, "UNAUTHENTICATED")),
      http.post("/api/v1/customer/auth/register", () => {
        registerRequest();
        return envelope({});
      }),
    );
    const user = userEvent.setup();

    renderApp("/customer/register");
    await screen.findByRole("heading", { name: "Tạo tài khoản customer" });
    await user.type(screen.getByLabelText("Số điện thoại"), "123");
    await user.type(screen.getByLabelText("Mật khẩu"), "abcdefgh");
    await user.type(screen.getByLabelText("Xác nhận mật khẩu"), "different");
    await user.type(screen.getByLabelText("Mã PIN giao dịch"), "12");
    await user.click(screen.getByRole("button", { name: "Đăng ký" }));

    expect(await screen.findByText("Số điện thoại phải gồm 9–15 chữ số.")).toBeInTheDocument();
    expect(screen.getByText("Mật khẩu phải có ít nhất một chữ số.")).toBeInTheDocument();
    expect(screen.getByText("Mật khẩu xác nhận không khớp.")).toBeInTheDocument();
    expect(screen.getByText("Mã PIN phải gồm đúng 6 chữ số.")).toBeInTheDocument();
    await waitFor(() => expect(registerRequest).not.toHaveBeenCalled());
  });
});
