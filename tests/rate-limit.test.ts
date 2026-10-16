import { describe, expect, it } from "vitest";
import { decideSlidingWindow, rateLimitSettings } from "../lib/rate-limit";

describe("rate limits", () => {
  it("allows requests inside the window and blocks the next one", () => {
    const now = 10_000;
    const first = decideSlidingWindow([], now, 2, 1_000);
    expect(first.success).toBe(true);
    expect(first.remaining).toBe(1);
    const second = decideSlidingWindow([now], now + 10, 2, 1_000);
    expect(second.success).toBe(true);
    const third = decideSlidingWindow([now, now + 10], now + 20, 2, 1_000);
    expect(third.success).toBe(false);
    expect(third.remaining).toBe(0);
  });

  it("drops timestamps outside the window", () => {
    const decision = decideSlidingWindow([1_000], 5_000, 1, 1_000);
    expect(decision.success).toBe(true);
  });

  it("falls back when env values are unusable", () => {
    expect(rateLimitSettings({ RATE_LIMIT_REQUESTS: "nope", RATE_LIMIT_WINDOW_SECONDS: "0" })).toEqual({
      limit: 30,
      windowSeconds: 60,
    });
  });
});
