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

  const data = (await response.json().catch(() => ({}))) as
    | ApiSuccess<T>
    | ApiFailure;

  if (!response.ok || !data.ok) {
    const errorPayload = data as ApiErrorPayload;
    const message = errorPayload.error?.message ?? "Request failed";

    throw new Error(message);
  }

  return data as ApiSuccess<T>;
}
