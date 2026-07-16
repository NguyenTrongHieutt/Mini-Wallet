import { expect, test, type Route } from "@playwright/test";

const customer = {
  id: "customer-1",
  phone: "0900000001",
  displayName: "Nguyễn Văn A",
  status: "active",
  createdAt: "2026-07-16T00:00:00.000Z",
  updatedAt: "2026-07-16T00:00:00.000Z",
};

const service = {
  id: "service-1",
  code: "BILL_PAYMENT",
  name: "Thanh toán hóa đơn",
  description: "Thanh toán hóa đơn điện.",
  status: "active",
};

const transaction = {
  id: "transaction-1",
  code: "TXN202607160001",
  transRefId: "trail-1",
  direction: "sent",
  amount: 125000,
  fee: 0,
  totalAmount: 125000,
  currency: "VND",
  message: "Thanh toán điện",
  status: "done",
  createdAt: "2026-07-16T01:00:00.000Z",
  updatedAt: "2026-07-16T01:00:01.000Z",
};

test("customer completes a transaction and reviews wallet history", async ({ page }) => {
  let authenticated = false;

  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    const body = postBody(route);

    if (path === "/api/v1/customer/me") {
      return envelope(route, authenticated ? 200 : 401, authenticated ? { customer } : null);
    }
    if (path === "/api/v1/customer/auth/login") {
      authenticated = true;
      return envelope(route, 200, {
        customer,
        auth: { accessToken: "test-token", expiresAt: "2026-07-17T00:00:00.000Z", tokenType: "Bearer" },
      });
    }
    if (path === "/api/v1/customer/auth/logout") {
      authenticated = false;
      return envelope(route, 200, null);
    }
    if (path === "/api/v1/customer/services/list") {
      return envelope(route, 200, {
        items: [service],
        pagination: { page: 1, pageSize: 12, total: 1, totalPages: 1 },
        filters: body,
        sort: "name ASC",
      });
    }
    if (path === "/api/v1/customer/services/input-fields") {
      return envelope(route, 200, {
        service,
        endpoint: { method: "POST", path: "/api/v1/transactions/request" },
        bodyFields: [
          {
            name: "providerCode",
            transField: "PROVIDERCODE",
            role: "Nhà cung cấp",
            dataType: "string",
            required: true,
          },
          {
            name: "billCode",
            transField: "BILLCODE",
            role: "Mã hóa đơn",
            dataType: "string",
            required: true,
          },
          {
            name: "amount",
            transField: "AMOUNT",
            role: "Số tiền",
            dataType: "integer",
            required: true,
          },
        ],
        requestExample: {
          serviceCode: "BILL_PAYMENT",
          providerCode: "SHOULD_NOT_PREFILL",
          billCode: "SHOULD_NOT_PREFILL",
          amount: 999999,
        },
      });
    }
    if (path === "/api/v1/customer/providers/list") {
      return envelope(route, 200, {
        items: [{
          id: "provider-1",
          serviceCode: "BILL_PAYMENT",
          type: "biller",
          code: "EVN_HCM",
          name: "Điện lực TP.HCM",
          category: "electricity",
          status: "active",
        }],
        pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
        filters: body,
        sort: "name ASC",
      });
    }
    if (path === "/api/v1/transactions/request") {
      return envelope(route, 200, {
        transRefId: "trail-1",
        service,
        amount: 125000,
        fee: 0,
        totalAmount: 125000,
        currency: "VND",
        input: body,
        status: "draft",
        expiredAt: "2099-07-16T01:10:00.000Z",
      });
    }
    if (path === "/api/v1/transactions/confirm") {
      return envelope(route, 200, {
        transRefId: "trail-1",
        service,
        authMethod: "PIN",
        status: "pending",
        expiredAt: "2099-07-16T01:10:00.000Z",
      });
    }
    if (path === "/api/v1/transactions/verify") {
      return envelope(route, 200, {
        transRefId: "trail-1",
        transaction: { id: transaction.id, code: transaction.code, status: "done" },
        service,
        amount: transaction.amount,
        fee: transaction.fee,
        totalAmount: transaction.totalAmount,
        message: transaction.message,
        currency: "VND",
        status: "done",
      });
    }
    if (path === "/api/v1/customer/transactions/list") {
      return envelope(route, 200, {
        items: [transaction],
        pagination: { page: 1, pageSize: 10, total: 1, totalPages: 1 },
        filters: body,
        sort: "createdAt DESC",
      });
    }
    if (path === "/api/v1/customer/transactions/detail") {
      return envelope(route, 200, {
        transaction: {
          ...transaction,
          service,
          sender: { type: "customer", phone: customer.phone, displayName: customer.displayName },
          receiver: { type: "provider", code: "EVN_HCM", name: "Điện lực TP.HCM" },
          currency: { code: "VND", name: "Việt Nam đồng", minorUnit: 0 },
        },
      });
    }
    if (path === "/api/v1/customer/wallet/balance") {
      return envelope(route, 200, {
        pocket: {
          id: "pocket-1",
          name: "Nguyễn Văn A Wallet",
          balance: 875000,
          currency: { code: "VND", name: "Việt Nam đồng", minorUnit: 0 },
          status: "active",
        },
      });
    }

    return envelope(route, 404, null);
  });

  await page.goto("/customer/login");
  await page.getByLabel("Số điện thoại").fill("0900000001");
  await page.getByLabel("Mật khẩu").fill("Password123");
  await page.getByRole("button", { name: "Đăng nhập" }).click();

  await expect(page.getByRole("heading", { name: "Dịch vụ" })).toBeVisible();
  await page.getByRole("link", { name: /Chọn dịch vụ/ }).click();

  const providerInput = page.getByRole("combobox", { name: "Nhà cung cấp" });
  await expect(providerInput).toHaveValue("");
  await providerInput.fill("EVN");
  await expect(page.getByRole("option", { name: /Điện lực TP\.HCM/ })).toBeVisible();
  await page.getByRole("option", { name: /Điện lực TP\.HCM/ }).click();
  await expect(providerInput).toHaveValue("EVN_HCM");

  await page.getByLabel("Mã hóa đơn").fill("PE123456");
  await page.getByLabel("Số tiền").fill("125000");
  await page.getByRole("button", { name: "Xem trước giao dịch" }).click();
  await expect(page.getByText("125.000 VND").first()).toBeVisible();

  await page.getByRole("button", { name: "Xác nhận giao dịch" }).click();
  await page.getByLabel("Mã PIN 6 chữ số").fill("123456");
  await page.getByRole("button", { name: "Xác thực và thanh toán" }).click();
  await expect(page.getByRole("heading", { name: "Giao dịch hoàn tất" })).toBeVisible();

  await page.getByRole("link", { name: "Xem lịch sử" }).click();
  await expect(page.getByText(transaction.code)).toBeVisible();
  await page.getByRole("link", { name: "Chi tiết" }).click();
  await expect(page.getByRole("heading", { name: transaction.code })).toBeVisible();
  await expect(page.getByText("Điện lực TP.HCM · EVN_HCM")).toBeVisible();

  await page.getByRole("link", { name: "Cá nhân" }).click();
  await expect(page.getByText("875.000 VND")).toBeVisible();
  await expect(page.getByText("Nguyễn Văn A Wallet")).toBeVisible();

  await page.getByRole("button", { name: "Đăng xuất" }).click();
  await expect(page).toHaveURL(/\/customer\/login$/);
});

function postBody(route: Route): Record<string, unknown> {
  try {
    return route.request().postDataJSON() as Record<string, unknown>;
  } catch {
    return {};
  }
}

function envelope(route: Route, err: number, data: unknown) {
  return route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ err, message: err === 200 ? "OK" : "ERROR", data }),
  });
}
