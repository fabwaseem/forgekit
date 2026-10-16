import { describe, expect, it } from "vitest";
import { evaluateExpression } from "../lib/ai/calculator";

describe("evaluateExpression", () => {
  it("evaluates arithmetic with precedence and parentheses", () => {
    expect(evaluateExpression("1 + 2 * 3")).toBe(7);
    expect(evaluateExpression("(1 + 2) * 3")).toBe(9);
    expect(evaluateExpression("-3 + 2")).toBe(-1);
    expect(evaluateExpression("2 * -3")).toBe(-6);
    expect(evaluateExpression("10 / 4")).toBe(2.5);
  });

  it("rejects empty input, junk, and division by zero", () => {
    expect(() => evaluateExpression(" ")).toThrow(/empty/);
    expect(() => evaluateExpression("2 +")).toThrow();
    expect(() => evaluateExpression("1 / 0")).toThrow(/zero/);
    expect(() => evaluateExpression("alert(1)")).toThrow();
  });
});
