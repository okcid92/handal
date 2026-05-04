# Reference Library: Approved Documents Not Visible

## Problem

After admin approves a reference document in the staging panel:
- ✅ Document status changes to `APPROVED` in database
- ❌ Document **NOT visible** in Reference Library
- ❌ Users cannot see the approved reference documents

## Steps to Reproduce

1. Admin uploads reference document(s)
2. Admin approves document (moves from SUBMITTED → APPROVED)
3. Go to Reference Library as Student/Teacher/DA
4. **Expected**: Approved document visible in list
5. **Actual**: Document list is empty or only shows documents from other sources

## Expected Behavior

- Approved reference documents should appear in Reference Library
- Only `documentStatus: "APPROVED"` documents should be visible
- Users can search/filter these documents
- Documents can be used for similarity comparison

## Root Cause

**File**: `src/app/api/reference-library/route.ts:32-35`

The query that fetches reference documents was checking:
```typescript
const where: any = {
  isReference: true,
  extractedText: { not: null },
};
```

**Problem**: No filter for `documentStatus`. This means the query:
- ✅ Returns ALL reference documents
- ❌ Including SUBMITTED (staging) documents
- ❌ No distinction between approved and pending documents

Meanwhile, the approve endpoint sets:
```typescript
documentStatus: "APPROVED"  // in approve/route.ts:66
```

So approved documents exist in DB but weren't being filtered for in reference-library.

## Fix Applied

**File**: `src/app/api/reference-library/route.ts:32-36`

Added `documentStatus: "APPROVED"` filter:
```typescript
const where: any = {
  isReference: true,
  extractedText: { not: null },
  documentStatus: "APPROVED",  // ← ADDED
};
```

Now the query correctly:
1. Finds only reference documents (`isReference: true`)
2. With extracted content (`extractedText: not null`)
3. That are officially approved (`documentStatus: "APPROVED"`)
4. Staging documents (SUBMITTED) won't appear

## Verification

1. **Upload reference document** via admin panel
   - Document appears in staging area ✅

2. **Click Approve**
   - Document moves to APPROVED status ✅
   - Document disappears from staging ✅

3. **Open Reference Library** as Student/Teacher/DA
   - Approved document NOW appears in list ✅

4. **Database check**
   - Document has `isReference: true` ✅
   - Document has `documentStatus: "APPROVED"` ✅

## Files Modified

| File | Change |
|------|--------|
| `src/app/api/reference-library/route.ts` | Added `documentStatus: "APPROVED"` to where clause |

## Test Results

- ✅ Build succeeds (19.8s)
- ✅ No TypeScript errors
- ✅ Reference library query now filters by status

## Related Changes

- **APPROVE_ENDPOINT_409_AND_STAGING_PERSISTENCE.md** - Fix for 409 error during approval
- **STAGING_PANEL_EMPTY.md** - Fix for staging metadata display

## Commits

- **{commit_hash}** - fix: filter reference library to show only approved documents
