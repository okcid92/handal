import { NextResponse } from "next/server";

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 500, code = "INTERNAL_ERROR") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function errorResponse(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: error.code,
          message: error.message,
        },
      },
      { status: error.status },
    );
  }

  const message = error instanceof Error ? error.message : "Unexpected error";

  return NextResponse.json(
    {
      ok: false,
      error: {
        code: "INTERNAL_ERROR",
        message,
      },
    },
    { status: 500 },
  );
}
