import { describe, expect, it } from "vitest";

import { deriveRiskLevel, buildSeed, simulateScore } from "@/server/documents";
import { normalizeThemeTitle } from "@/server/themes";

describe("domain helpers", () => {
  it("normalizes theme titles for case-insensitive uniqueness", () => {
    expect(normalizeThemeTitle("  Analyse de Texte  ")).toBe(
      "analyse de texte",
    );
  });

  it("builds a stable seed from the document id", () => {
    expect(buildSeed(BigInt(97))).toBe(0);
    expect(buildSeed(BigInt(123))).toBe(26);
  });

  it("produces bounded similarity scores", () => {
    const score = simulateScore(12, 3);

    expect(score).toBeGreaterThanOrEqual(3);
    expect(score).toBeLessThanOrEqual(97);
  });

  it("maps similarity to a risk level", () => {
    expect(deriveRiskLevel(20)).toBe("LOW");
    expect(deriveRiskLevel(55)).toBe("MEDIUM");
    expect(deriveRiskLevel(80)).toBe("HIGH");
  });
});
