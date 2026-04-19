import { Prisma } from "@prisma/client";

import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import {
  analyzeTheme,
  type ThemeProfile,
} from "@/server/analysis/themeanalysor";

export type CreateReferenceDocumentPayload = {
  originalName: string;
  mimeType: string;
  fileSize: number;
  checksum: string;
  extractedText: string;
};

export async function createReferenceDocument(
  payload: CreateReferenceDocumentPayload,
  uploadedBy: bigint,
) {
  const profile = analyzeTheme({
    name: payload.originalName,
    content: payload.extractedText,
  });

  const created = await prisma.referenceDocument.create({
    data: {
      uploadedBy,
      originalName: payload.originalName.trim(),
      mimeType: payload.mimeType.trim(),
      fileSize: BigInt(payload.fileSize),
      checksum: payload.checksum.trim(),
      extractedText: payload.extractedText,
      themeProfile: profile as unknown as Prisma.InputJsonValue,
      dominantTheme: profile.dominantTheme,
    },
  });

  logger.info("reference_document.created", {
    referenceDocumentId: created.id.toString(),
    uploadedBy: uploadedBy.toString(),
  });

  return {
    id: created.id.toString(),
    uploadedBy: created.uploadedBy.toString(),
    originalName: created.originalName,
    mimeType: created.mimeType,
    fileSize: created.fileSize.toString(),
    checksum: created.checksum,
    dominantTheme: created.dominantTheme,
    createdAt: created.createdAt.toISOString(),
  };
}

export async function listReferenceProfiles(): Promise<ThemeProfile[]> {
  const docs = await prisma.referenceDocument.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      themeProfile: true,
    },
  });

  const profiles: ThemeProfile[] = [];

  for (const doc of docs) {
    const profile = doc.themeProfile;
    if (!profile || typeof profile !== "object" || Array.isArray(profile)) {
      continue;
    }

    const candidate = profile as Partial<ThemeProfile>;
    if (
      typeof candidate.documentName === "string" &&
      Array.isArray(candidate.keywords) &&
      candidate.themeVector &&
      typeof candidate.themeVector === "object"
    ) {
      profiles.push(candidate as ThemeProfile);
    }
  }

  return profiles;
}

export async function listReferenceDocuments() {
  const docs = await prisma.referenceDocument.findMany({
    orderBy: { createdAt: "desc" },
  });

  return docs.map((doc) => ({
    id: doc.id.toString(),
    uploadedBy: doc.uploadedBy.toString(),
    originalName: doc.originalName,
    mimeType: doc.mimeType,
    fileSize: doc.fileSize.toString(),
    checksum: doc.checksum,
    dominantTheme: doc.dominantTheme,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  }));
}
