import { describe, expect, it } from "vitest";
import { compactNumber } from "./compact";

describe("compactNumber", () => {
  it("shortens with K/M/B", () => {
    expect(compactNumber(0)).toBe("0");
    expect(compactNumber(950)).toBe("950");
    expect(compactNumber(1500)).toBe("1.5K");
    expect(compactNumber(2000)).toBe("2K");
    expect(compactNumber(2_000_000)).toBe("2M");
    expect(compactNumber(1_250_000)).toBe("1.3M");
    expect(compactNumber(3_400_000_000)).toBe("3.4B");
    expect(compactNumber(-12000)).toBe("-12K");
  });
});
