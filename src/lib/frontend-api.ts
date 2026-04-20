type ApiSuccess<T> = {
  ok: true;
  [key: string]: unknown;
} & T;

type ApiFailure = {
  ok: false;
  error?: {
    code?: string;
    message?: string;
  };
};

type ApiErrorPayload = {
  error?: {
    code?: string;
    message?: string;
  };
};

export async function apiFetch<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<ApiSuccess<T>> {
  const response = await fetch(input, {
    ...init,
    cache: init?.cache ?? "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const clonedResponse = response.clone();

  const contentType = clonedResponse.headers.get("content-type") ?? "";
  const data = (
    contentType.includes("application/json")
      ? await clonedResponse.json().catch(() => ({}))
      : await clonedResponse.text().then((text) => {
          if (!text) return {};
          try {
            return JSON.parse(text) as ApiSuccess<T> | ApiFailure;
          } catch {
            return {};
          }
        })
  ) as ApiSuccess<T> | ApiFailure;

  if (!response.ok || !data.ok) {
    const errorPayload = data as ApiErrorPayload;
    const message = errorPayload.error?.message ?? "Request failed";

    throw new Error(message);
  }

  return data as ApiSuccess<T>;
}
