import { ApiError } from "@/lib/api";
import { mappedErrorMessage } from "@/shared/error-message";

describe("mappedErrorMessage", () => {
  const messages = {
    CUSTOMER_NOT_FOUND: "Không tìm thấy khách hàng.",
  };

  it("prefers the semantic envelope code over the human message", () => {
    const error = new ApiError(
      "Customer not found",
      404,
      undefined,
      undefined,
      "CUSTOMER_NOT_FOUND",
    );

    expect(mappedErrorMessage(error, messages, "Fallback")).toBe(
      "Không tìm thấy khách hàng.",
    );
  });

  it("falls back to the original error message", () => {
    expect(mappedErrorMessage(new Error("Network failed"), messages, "Fallback")).toBe(
      "Network failed",
    );
  });
});
