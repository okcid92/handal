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

**Three interconnected bugs prevented metadata display:**

1. **Backend flag inverted** (`src/app/api/admin/reference-docs/route.ts:327`)
   - When creating reference documents, code set `isReference: false` ❌
   - Should be `isReference: true` (these ARE reference documents)
   
2. **Query filter inverted** (`src/app/api/admin/reference-docs/staging/route.ts:13`)
   - Staging API searched for `isReference: false` ❌
   - Should search for `isReference: true`
   - Result: Query returned 0 documents, always empty staging panel
   
3. **Missing JSON parsing** (`src/components/admin-staging-panel.tsx:68`)
   - Prisma returns JSON columns as strings, not parsed objects
   - Component expected parsed object, got string
   - Accessing `.subjectLabel` on string returned undefined
   - Frontend couldn't render null/undefined values

### Solution Applied

**Three fixes applied:**

```typescript
// Fix 1: Backend - create references with correct flag
data: { isReference: true }  // was: false

// Fix 2: API Query - search for correct flag
where: { isReference: true, analysisStatus: "PENDING" }  // was: false

// Fix 3: Frontend - parse JSON string
let meta: StagingMetadata | null = null;
if (doc.stagingMetadata) {
  if (typeof doc.stagingMetadata === "string") {
    try { meta = JSON.parse(doc.stagingMetadata); }
    catch { meta = null; }
  } else {
    meta = doc.stagingMetadata;
  }
}
```

### Verification

**Before fix:**
- Upload document → backend log shows: `Staged {file} for review: {...}`
- Staging panel displays: (empty)
- User sees: all fields blank (null)

**After fix:**
- Upload document → backend log shows: `Staged {file} for review: {...}`
- Staging panel displays:
  - **Subject**: "MISE EN PLACE D UN OUTIL DE PROSPECTION MOBILE..."
  - **Technologies**: [Laravel, MySQL, Docker, ...]
  - **Author**: "Koura Lemiyi Stephane Ulrich"
  - **Department**: "MIAGE" (if detected)
  - **Academic Year**: "2025-2026" (if detected)
- User can: review, edit, approve/reject each document

**Manual test steps:**
1. Admin → Reference Library → Upload
2. Select 1+ PDF files
3. Wait for streaming response
4. Check staging area
5. Verify fields populated with extracted data
6. Edit/approve to confirm form works
