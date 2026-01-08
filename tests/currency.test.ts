import { describe, expect, it } from "vitest";
import {
  bgnCentsToEurCents,
  eurCentsToBgnCents,
  formatMoney,
  fromCents,
  toCents,
} from "@/lib/currency";

describe("currency helpers", () => {
  it("converts EUR cents to BGN cents with rounding", () => {
    expect(eurCentsToBgnCents(100)).toBe(196);
    expect(eurCentsToBgnCents(12345)).toBe(Math.round(12345 * 1.95583));
  });

  it("converts BGN cents to EUR cents with rounding", () => {
    expect(bgnCentsToEurCents(196)).toBe(100);
    expect(bgnCentsToEurCents(9876)).toBe(Math.round(9876 / 1.95583));
  });

  it("round-trips amount cents consistently", () => {
    const eurCents = 9999;
    const bgnCents = eurCentsToBgnCents(eurCents);
    const back = bgnCentsToEurCents(bgnCents);
    expect(Math.abs(back - eurCents)).toBeLessThanOrEqual(1);
  });

  it("formats EUR-first with BGN in parentheses", () => {
    const eurCents = toCents(9.17);
    const bgnCents = toCents(17.94);
    const formatted = formatMoney(eurCents, bgnCents);
    expect(formatted).toContain("€");
    expect(formatted).toContain("BGN");
    expect(formatted).toContain(fromCents(eurCents).toFixed(2));
  });
});
