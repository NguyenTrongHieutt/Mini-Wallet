import { appConfig } from "@/config/app-config";
import { paginationFromSearch, parsePositiveInteger } from "./url-query";

describe("parsePositiveInteger", () => {
  it.each([null, "", "0", "0.5", "-2", "not-a-number", "Infinity"])(
    "uses the fallback for invalid value %s",
    (value) => {
      expect(parsePositiveInteger(value, 7)).toBe(7);
    },
  );

  it("normalizes a positive decimal to an integer", () => {
    expect(parsePositiveInteger("3.9", 1)).toBe(3);
  });
});

describe("paginationFromSearch", () => {
  it("uses centralized pagination defaults", () => {
    expect(paginationFromSearch(new URLSearchParams())).toEqual({
      page: 1,
      pageSize: appConfig.pagination.defaultPageSize,
    });
  });

  it("caps pageSize but leaves a valid page uncapped", () => {
    const params = new URLSearchParams({
      page: "250",
      pageSize: String(appConfig.pagination.maxPageSize + 50),
    });

    expect(paginationFromSearch(params)).toEqual({
      page: 250,
      pageSize: appConfig.pagination.maxPageSize,
    });
  });

  it("normalizes invalid page and pageSize independently", () => {
    const params = new URLSearchParams({ page: "-1", pageSize: "invalid" });

    expect(paginationFromSearch(params)).toEqual({
      page: 1,
      pageSize: appConfig.pagination.defaultPageSize,
    });
  });
});
