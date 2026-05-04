# Staging Panel Not Displaying Extracted Metadata

## Problem

Admin staging area (reference library bulk upload) shows no extracted metadata despite successful backend processing. The `stagingMetadata` is extracted and stored in the database, but the frontend panel displays nothing.

**Status**: Backend data ✅ | Frontend display ❌

## Steps to Reproduce

1. Admin logs in → Navigate to `/admin` → Reference Library
2. Click "Upload Bulk References" 
3. Select PDF(s) and upload
4. Monitor logs → See `[ADMIN-REF-UPLOAD] Staged {file} for review: {...}`
5. Check staging area → Shows uploaded file but NO metadata displayed

## Expected Behavior

Staging panel should automatically populate:
- **Subject** (from cover page extraction)
- **Technologies** (from NLP analysis)  
- **Author** (from metadata extraction)
- **Department** (from metadata extraction)
- **Academic Year** (from metadata extraction)

Admin can then edit/approve each document before final indexing.

## Actual Behavior

- File appears in staging list
- Clicking document shows empty fields (all null/blank)
- No data rendered from `stagingMetadata` JSON column

## Backend Logs (Evidence of Working Backend)

```
[ADMIN-REF-UPLOAD] Staged rapportKouraLemiyiStephaneUlrich.pdf for review: {
  documentId: '3',
  subjectLabel: 'MISE EN PLACE D UN OUTIL DE PROSPECTION MOBILE ET CRM POUR L ANALYSE GEOMAR...'
}
```

Database query confirms data is stored:
```
INSERT INTO `documents` (...`staging_metadata`...) VALUES (...)
SELECT staging_metadata FROM documents WHERE is_reference=true
```

## Root Issues (Suspected)

1. **Frontend fetch issue**: `GET /api/admin/reference-docs/staging` not parsing `stagingMetadata` correctly
2. **JSON parsing**: `stagingMetadata` stored as JSON string but not being deserialized properly
3. **Component binding**: `admin-staging-panel.tsx` not receiving/displaying metadata
4. **Field mapping**: Frontend type definitions don't match database column structure

## Files Involved

| File | Role |
|------|------|
| `src/app/api/admin/reference-docs/route.ts` | Backend: creates documents with `stagingMetadata` |
| `src/app/api/admin/reference-docs/staging/route.ts` | API endpoint: returns staging documents list |
| `src/components/admin-staging-panel.tsx` | Frontend: displays staging metadata |
| `prisma/schema.prisma` | Schema: `documents.stagingMetadata` column |

## Proposed Fix

1. Verify API response includes `stagingMetadata` (check network tab)
2. Ensure JSON string is parsed in frontend component
3. Verify TypeScript types match database structure
4. Add console logs to trace data flow
5. Check `StagingDocument` type definition for completeness

---

## Fix Resolution

### Root Cause

*To be filled when investigating*

### Solution Applied

*To be filled when implementing fix*

### Verification

*To be filled when testing fix*
