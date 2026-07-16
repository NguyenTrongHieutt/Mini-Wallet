import { expect, test, type Route } from "@playwright/test";

const officer = {
  id: "officer-1",
  phone: "0900000099",
  displayName: "Operations Admin",
  status: "active",
};

const customer = {
  id: "customer-1",
  phone: "0900000001",
  displayName: "Customer One",
  status: "active",
  createdAt: "2026-07-16T00:00:00.000Z",
  updatedAt: "2026-07-16T00:00:00.000Z",
};

test("officer logs in, lists customers and changes customer status", async ({ page }) => {
  let authenticated = false;
  let customerStatus = customer.status;

  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;

    if (path === "/api/v1/officer/me") {
      return envelope(
        route,
        authenticated ? 200 : 401,
        authenticated ? { officer } : undefined,
        authenticated ? "OFFICER_PROFILE" : "UNAUTHENTICATED",
      );
    }
    if (path === "/api/v1/officer/auth/login") {
      authenticated = true;
      return envelope(route, 200, {
        officer,
        auth: {
          accessToken: "officer-token",
          expiresAt: "2099-07-17T00:00:00.000Z",
          tokenType: "Bearer",
        },
      }, "LOGIN_SUCCESS");
    }
    if (path === "/api/v1/officer/customers/list") {
      return envelope(route, 200, {
        items: [{ ...customer, status: customerStatus }],
        pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
        filters: {},
        sort: "createdAt DESC",
      }, "OFFICER_CUSTOMERS_LISTED");
    }
    if (path === "/api/v1/officer/customers/lock") {
      customerStatus = "locked";
      return envelope(route, 200, {
        customer: { ...customer, status: customerStatus },
        changed: true,
      }, "CUSTOMER_LOCKED");
    }
    if (path === "/api/v1/officer/customers/unlock") {
      customerStatus = "active";
      return envelope(route, 200, {
        customer: { ...customer, status: customerStatus },
        changed: true,
      }, "CUSTOMER_UNLOCKED");
    }

    return envelope(route, 404, undefined, "NOT_FOUND");
  });

  await page.goto("/login");
  await page.locator("#phone").fill(officer.phone);
  await page.locator("#password").fill("Password123");
  await page.locator('button[type="submit"]').click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText(officer.displayName).first()).toBeVisible();

  await page.locator('a[href="/customers"]').first().click();
  await expect(page).toHaveURL(/\/customers$/);
  await expect(page.getByText(customer.phone)).toBeVisible();
  await expect(page.getByText(customer.displayName)).toBeVisible();

  page.once("dialog", (dialog) => dialog.accept());
  await page.locator("tbody tr").filter({ hasText: customer.phone }).locator("button").click();

  await expect.poll(() => customerStatus).toBe("locked");
  await expect(page.getByRole("status")).toBeVisible();
});

function envelope(
  route: Route,
  err: number,
  data: unknown,
  code: string,
) {
  return route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      err,
      code,
      message: err === 200 ? "OK" : code,
      ...(data === undefined ? {} : { data }),
    }),
  });
}
