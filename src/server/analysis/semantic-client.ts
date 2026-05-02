import { logger } from "@/lib/logger";

type SemanticResponse = {
  semantic_score?: number;
};

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export async function getSemanticScore(
  textA: string,
  textB: string,
): Promise<number | undefined> {
  const baseUrl = process.env.SEMANTIC_SERVICE_URL;
  if (!baseUrl) return undefined;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(`${baseUrl}/semantic`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ textA, textB }),
      signal: controller.signal,
    });

    if (!response.ok) {
      logger.warn("analysis.semantic.unavailable", "semantic service returned non-200", {
        status: response.status,
      });
      return undefined;
    }

    const payload = (await response.json()) as SemanticResponse;
    if (typeof payload.semantic_score !== "number") {
      logger.warn("analysis.semantic.unavailable", "semantic score missing in response");
      return undefined;
    }

    return clamp01(payload.semantic_score);
  } catch (error) {
    logger.warn("analysis.semantic.unavailable", "semantic service request failed", {
      error: error instanceof Error ? error.message : "unknown_error",
    });
    return undefined;
  } finally {
    clearTimeout(timeout);
  }
}
