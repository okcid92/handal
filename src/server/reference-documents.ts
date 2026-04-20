import { Prisma, ThemeStatus } from "@prisma/client";

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
  const uploadedDocs = await prisma.document.findMany({
    where: {
      isReference: true,
      extractedText: { not: null },
      theme: {
        is: {
          OR: [
            { teacherApproval: true },
            { validatedCdBy: { not: null } },
            {
              status: {
                in: [
                  ThemeStatus.VALIDATED,
                  ThemeStatus.VALIDATED_DA,
                  ThemeStatus.DOCUMENT_SUBMITTED,
                  ThemeStatus.ANALYSIS_PENDING,
                  ThemeStatus.APPROVED,
                  ThemeStatus.APPROVED_WITH_MENTION,
                  ThemeStatus.CONDITIONAL_APPROVAL,
                  ThemeStatus.REQUESTED_REVIEW,
                  ThemeStatus.FLAGGED_PLAGIARISM,
                ],
              },
            },
          ],
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 250,
    select: {
      id: true,
      isReference: true,
      originalName: true,
      extractedText: true,
    },
  });

  const profiles: ThemeProfile[] = [];

  for (const doc of uploadedDocs) {
    if (!doc.extractedText || !doc.extractedText.trim()) {
      continue;
    }

    profiles.push(
      analyzeTheme({
        name: `${doc.isReference ? "reference" : "uploaded"}:${doc.id.toString()}:${doc.originalName}`,
        content: doc.extractedText,
      }),
    );
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
