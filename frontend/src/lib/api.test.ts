import { ApiError, apiPost, AUTH_EXPIRED_EVENT } from "@/lib/api";

describe("apiPost", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("returns envelope data and always includes credentials", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ err: 200, message: "OK", data: { id: "1" } }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiPost<{ id: string }>("/api/example", { q: "test" })).resolves.toEqual({ id: "1" });
    expect(fetchMock).toHaveBeenCalledWith("/api/example", expect.objectContaining({ method: "POST", credentials: "include" }));
  });

  it("throws ApiError when HTTP 200 contains a business error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      err: 422,
      code: "POCKET_LOCKED",
      message: "INVALID_STATE",
      data: { reason: "locked" },
    }), { status: 200 })));
    await expect(apiPost("/api/example")).rejects.toMatchObject({
      name: "ApiError",
      code: 422,
      errorCode: "POCKET_LOCKED",
      message: "INVALID_STATE",
      data: { reason: "locked" },
    });
  });

  it("keeps the optional envelope code non-breaking on successful responses", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      err: 200,
      code: "CUSTOMER_LOADED",
      message: "OK",
      data: { id: "customer-1" },
    }), { status: 200 })));

    await expect(apiPost("/api/example")).resolves.toEqual({ id: "customer-1" });
  });

  it("accepts legacy error envelopes that omit data", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      err: 404,
      code: "CUSTOMER_NOT_FOUND",
      message: "Customer not found",
    }), { status: 200 })));

    await expect(apiPost("/api/example")).rejects.toMatchObject({
      code: 404,
      errorCode: "CUSTOMER_NOT_FOUND",
      data: undefined,
    });
  });

  it("notifies auth consumers for expired sessions", async () => {
    const listener = vi.fn();
    window.addEventListener(AUTH_EXPIRED_EVENT, listener);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ err: 401, message: "INVALID_TOKEN", data: null }), { status: 200 })));

    await expect(apiPost("/api/v1/officer/me")).rejects.toBeInstanceOf(ApiError);
    expect(listener).toHaveBeenCalledOnce();
    window.removeEventListener(AUTH_EXPIRED_EVENT, listener);
  });

  it("rejects malformed response envelopes", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: "ok" }), { status: 200 })));
    await expect(apiPost("/api/example")).rejects.toMatchObject({ code: 200 });
  });
});
