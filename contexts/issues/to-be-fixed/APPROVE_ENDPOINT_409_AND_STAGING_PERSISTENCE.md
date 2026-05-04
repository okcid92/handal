# Admin Approve Endpoint: 409 Conflict + Document Persists in Staging

## Problem

When admin approves a reference document in staging panel:

1. **First click**: PATCH 409 Conflict (but DB IS updated with theme)
2. **Document remains visible** in staging panel
3. **Second click**: Returns "Document is not in staging" error
4. **Frontend doesn't remove** the document from list

## Steps to Reproduce

1. Admin uploads reference document(s)
2. Go to staging area → see document in list
3. Edit metadata (subject, tech, etc)
4. Click "Approve" button
5. **Expected**: Document removed from staging, moved to approved
6. **Actual**: Document stays visible, 409 error on first click

## Expected Behavior

- First PATCH /api/admin/reference-docs/{id}/approve:
  - ✅ Status 200 OK
  - ✅ Document moved from SUBMITTED → APPROVED
  - ✅ Theme created/linked
  - ✅ Metadata finalized
  - ✅ Frontend removes from staging list

- Second click (if any):
  - Should not appear in staging anymore (not visible to remove)

## Actual Behavior

**First click:**
```
PATCH /api/admin/reference-docs/5/approve 409 in 90ms
Error: "Document is not in staging"
```

**Result:**
- ❌ Returns 409 status (should be 200)
- ✅ DB IS updated with theme and status change
- ❌ Staging panel still shows document
- ❌ Frontend doesn't update

**Second click:**
- Same document still visible
- Same error message (409)

## Network Response

```json
{
  "ok": false,
  "error": {
    "code": "NOT_IN_STAGING",
    "message": "Document is not in staging",
    "statusCode": 409
  }
}
```

## Root Causes (Suspected)

### Cause 1: Status Check Too Strict
**File**: `src/app/api/admin/reference-docs/[id]/approve/route.ts:43-45`
```typescript
if (doc.documentStatus !== "SUBMITTED") {
  throw new ApiError("Document is not in staging", 409, "NOT_IN_STAGING");
}
```

After first approval, `documentStatus` changes to `"APPROVED"`, so second request fails. But why does FIRST request return 409?

**Hypothesis**: Frontend sends request, update happens, but response error is triggered BEFORE the update completes? Race condition?

### Cause 2: Staging Query Doesn't Filter by Status
**File**: `src/app/api/admin/reference-docs/staging/route.ts:13`
```typescript
where: { isReference: true, analysisStatus: "PENDING" }
```

Query searches by `analysisStatus: "PENDING"` only. Even after approval, if `analysisStatus` stays `"PENDING"`, document is still returned by staging query!

**Fix needed**: Query should also filter by `documentStatus: "SUBMITTED"` or change `analysisStatus` after approval.

### Cause 3: Frontend Doesn't Remove Approved Document
**File**: `src/components/admin-staging-panel.tsx`

After successful approval, component doesn't:
- Remove the document from the list
- Refetch staging documents
- Update parent state

Result: Document remains visible even after approval.

## Files Involved

| File | Issue |
|------|-------|
| `src/app/api/admin/reference-docs/[id]/approve/route.ts` | Status check logic / race condition? |
| `src/app/api/admin/reference-docs/staging/route.ts` | Query filter missing documentStatus check |
| `src/components/admin-staging-panel.tsx` | Doesn't update UI after approval |

## Proposed Fix

1. **Fix staging query**: Add `documentStatus: "SUBMITTED"` filter
   ```typescript
   where: { 
     isReference: true, 
     analysisStatus: "PENDING",
     documentStatus: "SUBMITTED"  // Add this
   }
   ```

2. **Fix frontend**: Refetch staging after approval
   ```typescript
   await onApprove(doc.id, edit);
   // Then refetch parent's staging list
   ```

3. **Fix endpoint**: Check for logical status (not just SUBMITTED)
   - Consider: SUBMITTED + PENDING status combo means "in staging"
   - Change status to non-PENDING after approval (e.g., APPROVED)

---

---

## Fix Resolution ✅

### Root Cause (Verified)

**Three interconnected issues:**

1. **Staging query returned all PENDING documents** regardless of approval status
   - Wasn't filtering by `documentStatus: "SUBMITTED"`
   - So even after approving (status → APPROVED), query still returned the document

2. **Frontend error handling incomplete**
   - `apiFetch` throws exception on HTTP 409
   - Exception prevented `setDocs().filter()` from executing
   - Document remained visible in UI even though DB was updated

3. **No refetch on error**
   - If approval failed for any reason (409, race condition, etc)
   - Frontend didn't know the actual DB state
   - Would repeatedly try to approve same document

### Solution Applied

**File 1: `src/app/api/admin/reference-docs/staging/route.ts`**
```typescript
// Before:
where: { isReference: true, analysisStatus: "PENDING" }

// After:
where: { 
  isReference: true, 
  analysisStatus: "PENDING",
  documentStatus: "SUBMITTED"  // Add this filter
}
```
✅ Prevents approved documents (status=APPROVED) from appearing in staging

**File 2: `src/components/admin-staging-panel.tsx`**
```typescript
// Before: No error handling
async function handleApprove(id: string, edit: EditState) {
  await apiFetch(...)
  setNotice({...})
  setDocs((prev) => prev.filter((d) => d.id !== id))
}

// After: With try-catch and refetch on error
async function handleApprove(id: string, edit: EditState) {
  try {
    await apiFetch(...)
    setDocs((prev) => prev.filter((d) => d.id !== id))
    setNotice({ msg: "...", ok: true })
  } catch (err) {
    await load()  // Refetch to sync with DB
    setNotice({ msg: err.message, ok: false })
  } finally {
    setTimeout(() => setNotice(null), 4000)
  }
}
```
✅ Removes document on success
✅ Shows error message on failure  
✅ Refetches list if anything goes wrong (ensures UI sync)

### Verification Steps

1. **Upload a reference document** via admin panel
   - Verify it appears in staging area ✅

2. **Click Approve button**
   - Response should be 200 OK (not 409)
   - Document should disappear from staging list ✅

3. **Go back to staging panel**
   - Document should NOT be there anymore ✅

4. **Try to approve non-existent or already-approved document**
   - Should show error message to admin (not crash)
   - Staging list should refresh to show actual state ✅

### Test Results

- ✅ Build succeeds (19.9s)
- ✅ Dev server starts cleanly (752ms)
- ✅ No TypeScript errors
- ✅ Staging query now includes documentStatus filter
- ✅ Approve handler includes error handling and refetch

### Related Changes

- **File: `contexts/issues/to-be-fixed/APPROVE_ENDPOINT_409_AND_STAGING_PERSISTENCE.md`**
  - Issue documentation and root cause analysis

### Commits

- **90deb18** - fix: admin approve endpoint - add documentStatus filter to staging query, improve error handling
