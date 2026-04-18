import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { errorResponse } from "@/lib/api-errors";
import { guardStudent } from "@/lib/route-guards";
import { createDocument } from "@/server/documents";

const payloadSchema = z.object({
  themeId: z.string().trim().min(1),
  originalName: z.string().trim().min(1),
  mimeType: z.string().trim().min(1),
  fileSize: z.number().int().positive(),
  checksum: z.string().trim().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const session = guardStudent(request);
    const payload = payloadSchema.parse(await request.json());

    const document = await createDocument(payload, BigInt(session.userId));

    return NextResponse.json(
      {
        ok: true,
        document,
      },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
