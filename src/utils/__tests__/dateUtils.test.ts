import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import {
  formatEventDate,
  isToday,
  isTomorrow,
  getRelativeDateLabel,
} from "../dateUtils";

/* ------------------------------------------------------------------ */
/*  Freeze system time for deterministic tests                        */
/* ------------------------------------------------------------------ */
const MOCK_NOW = new Date("2025-06-13T12:00:00Z"); // pick any stable date

beforeAll(() => {
  vi.useFakeTimers();
  vi.setSystemTime(MOCK_NOW);
});

afterAll(() => {
  vi.useRealTimers();
});

/* ------------------------------------------------------------------ */
/*  Helpers based on the frozen clock                                 */
/* ------------------------------------------------------------------ */
const todayIso = MOCK_NOW.toISOString();

const tomorrow = new Date(MOCK_NOW);
tomorrow.setDate(tomorrow.getDate() + 1);
const tomorrowIso = tomorrow.toISOString();

/* ------------------------------------------------------------------ */
/*  Tests                                                             */
/* ------------------------------------------------------------------ */
describe("date utils", () => {
  it("detects today", () => {
    expect(isToday(todayIso)).toBe(true);
    expect(getRelativeDateLabel(todayIso)).toBe("Today");
  });

  it("detects tomorrow", () => {
    expect(isTomorrow(tomorrowIso)).toBe(true);
    expect(getRelativeDateLabel(tomorrowIso)).toBe("Tomorrow");
  });

  it("formats other dates", () => {
    const otherIso = "2024-01-05T00:00:00Z";
    const formatted = formatEventDate(otherIso);
    expect(formatted).toMatch(/05\.01\.2024/);
  });
});

