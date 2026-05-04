import { NextRequest, NextResponse } from "next/server";
import { guardAdmin } from "@/lib/route-guards";
import { prisma } from "@/lib/prisma";
import { assertSameOrigin } from "@/lib/security";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    guardAdmin(request);
    
    const { id } = await params;
    const docId = BigInt(id);

    const doc = await prisma.document.findUnique({
      where: { id: docId },
    });

    if (!doc) {
      return NextResponse.json({ ok: false, error: "Document not found" }, { status: 404 });
    }

    if (!doc.isReference) {
      return NextResponse.json({ ok: false, error: "Not a reference document" }, { status: 400 });
    }

    await prisma.document.delete({
      where: { id: docId },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: "Failed to delete document" }, { status: 500 });
  }
}