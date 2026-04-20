# 🔧 Troubleshooting: HTTP 500 Error on Document Upload

**Date**: April 19, 2026  
**Issue**: HTTP 500 error on POST `/api/documents/upload-file`  
**Status**: ✅ Diagnostic Framework In Place

---

## 📋 What Was Fixed

### 1. **Enhanced Logging** ✅

All backend functions now include detailed logging to help identify where the error occurs:

- **Route Handler**: `src/app/api/documents/upload-file/route.ts`
  - Logs each major step (auth, file validation, extraction, analysis)
  - Logs specific error details when failures occur
  - Includes file info, buffer size, and processing time

- **Text Extraction**: `src/server/text-extraction.ts`
  - Logs PDF loading, page retrieval, text extraction
  - Detailed error messages for corrupted/encrypted PDFs
  - Stack traces for unexpected errors

### 2. **Improved Error Handling** ✅

- All async operations properly wrapped in try-catch
- Specific error types caught and logged
- Generic errors log full stack trace for debugging
- API always returns JSON (never HTML)

### 3. **Configuration Updated** ✅

- `next.config.ts`: Proper headers for upload routes
- Supports 50MB file uploads
- No invalid configuration keys

---

## 🧪 How to Debug the 500 Error

### Step 1: Check Server Logs

**Run the development server**:

```bash
npm run dev
```

**Expected log output when uploading a file**:

```
[UPLOAD] Starting file upload processing...
[UPLOAD] Student authenticated: { studentId: '123' }
[UPLOAD] File received: { name: 'document.pdf', size: 1234567, type: 'application/pdf' }
[UPLOAD] File validation: PDF, 1.2MB < 50MB ✓
[UPLOAD] Buffer created: { size: 1234567, checksum: 'sha256:abc...' }
[EXTRACT] Starting first page extraction { mimeType: 'application/pdf', bufferSize: 1234567 }
[PDF] Starting PDF parsing with buffer size: 1234567
[PDF] PDF loading task created, awaiting promise...
[PDF] PDF document loaded successfully: { numPages: 10 }
[PDF] Getting page 1...
[PDF] Page 1 retrieved successfully
[PDF] Extracting text content with 10s timeout...
[PDF] Text content extracted successfully: { itemsCount: 45 }
[PDF] Text extraction completed: { rawLength: 2345, cleanLength: 1234 }
[UPLOAD] First page extracted: { length: 1234, preview: 'Your document title...' }
[UPLOAD] Title score calculated: { titleScore: 95, threshold: 80 }
[UPLOAD] Title validation passed, extracting full content...
... (more logs)
[UPLOAD] Upload processing completed successfully
```

### Step 2: Look for Error Logs

**If there's a 500 error, you'll see**:

```
[UPLOAD] Unexpected error during upload: {
  message: 'Specific error message here',
  stack: 'Full stack trace...',
  type: 'ErrorType'
}
```

**Common error patterns**:

| Log                                                     | Meaning                        | Solution                       |
| ------------------------------------------------------- | ------------------------------ | ------------------------------ |
| `[PDF] PDF parsing failed: PDF is not a valid PDF file` | File corrupted or not PDF      | Test with valid PDF            |
| `[PDF] Text extraction timeout`                         | PDF too complex                | File takes >10s to parse       |
| `No readable content extracted`                         | Empty PDF or TXT               | Ensure file has text           |
| `Aucun thème validé trouvé`                             | Student has no validated theme | Propose & validate theme first |
| `Buffer already closed`                                 | PDF resource cleanup issue     | Rare, contact support          |

### Step 3: Test with Different Files

**Test Case 1: Small Valid PDF** (< 5MB)

```bash
# Should succeed and show all extraction logs
curl -F "file=@small_document.pdf" http://localhost:3000/api/documents/upload-file
```

**Test Case 2: Text File** (fastest for testing)

```bash
echo "Test Document Title" > test.txt
curl -F "file=@test.txt" http://localhost:3000/api/documents/upload-file
```

**Test Case 3: Protected PDF**

```bash
# Should show: "[PDF] PDF is password protected"
curl -F "file=@protected.pdf" http://localhost:3000/api/documents/upload-file
```

**Test Case 4: Corrupted File**

```bash
# Rename non-PDF to .pdf
echo "not a pdf" > fake.pdf
curl -F "file=@fake.pdf" http://localhost:3000/api/documents/upload-file
```

---

## 🔍 Specific Error Causes & Solutions

### Error: "PDF extraction failed: PDF is not a valid PDF file"

**Cause**: File is not a valid PDF (corrupted or wrong type)  
**Solution**:

1. Verify file is actually a PDF: `file document.pdf`
2. Try opening in Adobe Reader
3. Re-export from source application
4. Use smaller/simpler PDF for testing

**Log Pattern**:

```
[UPLOAD] File received: { name: 'document.pdf', ... }
[PDF] Starting PDF parsing...
[PDF] Error during PDF extraction: { errorMsg: 'PDF is not a valid PDF file' }
```

---

### Error: "PDF text extraction timeout"

**Cause**: PDF is too complex or large (takes >10 seconds)  
**Solution**:

1. Simplify the PDF (remove images, compress)
2. Use first few pages only
3. Increase timeout in `src/server/text-extraction.ts`:
   ```typescript
   setTimeout(() => reject(new Error(...)), 15000) // Change from 10000 to 15000
   ```

**Log Pattern**:

```
[PDF] PDF document loaded successfully: { numPages: 500 }
[PDF] Getting page 1...
[PDF] Page 1 retrieved successfully
[PDF] Extracting text content with 10s timeout...
[PDF] Text extraction timeout (10s)
```

---

### Error: "Impossible d'extraire le texte du PDF"

**Cause**: PDF has no extractable text (image-only PDF)  
**Solution**:

1. PDF is scan/image: Use OCR tool first
2. Use tool like Adobe Acrobat to convert to text
3. If intentional, provide TXT file instead

**Log Pattern**:

```
[PDF] Text extraction completed: { rawLength: 0, cleanLength: 0 }
[UPLOAD] First page extracted: { length: 0 }
```

---

### Error: "Aucun thème validé trouvé"

**Cause**: Student hasn't proposed & validated a theme yet  
**Solution**:

1. Go to Student Dashboard
2. Click "Proposition de thème"
3. Wait for Teacher to validate
4. Wait for DA to validate
5. Then try uploading document

**Log Pattern**:

```
[UPLOAD] Fetching validated theme for student...
[UPLOAD] Failed to get validated theme: ...
```

---

### Error: "Generic 500 with no clear message"

**Cause**: Unexpected error (database, permission, environment variable)  
**Solution**:

1. Check full stack trace in logs
2. Look for database connection errors
3. Verify `.env.local` variables
4. Check file system permissions
5. Restart server: `npm run dev`

**Debug Steps**:

```bash
# 1. Check environment
cat .env.local | grep -i database

# 2. Test database connection
npm run db-test

# 3. Check logs in terminal carefully
# Look for: "Error:", "failed", "EACCES", "ECONNREFUSED"
```

---

## 📊 Monitoring Upload Performance

**Add this to check upload speed**:

The new logging includes timing information via timestamps. Check if any step takes unusually long:

```json
{
  "timestamp": "2026-04-19T21:30:00.000Z",
  "[UPLOAD] Starting file upload processing..." // T0
  "timestamp": "2026-04-19T21:30:02.500Z",
  "[PDF] Text extraction completed..." // T1 = 2.5s (PDF parsing)
  "timestamp": "2026-04-19T21:30:05.000Z",
  "[UPLOAD] Analysis completed..." // T2 = 5s (Plagiarism check)
  "timestamp": "2026-04-19T21:30:05.200Z",
  "[UPLOAD] Upload processing completed successfully" // Total: 5.2s
}
```

**Target timings**:

- File validation: < 100ms
- Buffer creation: < 500ms
- PDF parsing: 500ms - 2s (depends on PDF complexity)
- Title matching: < 100ms
- Content extraction: 500ms - 2s
- Plagiarism analysis: 1s - 10s
- **Total**: 3s - 20s (depending on file size)

If any step takes much longer, that's the bottleneck.

---

## 🛠️ Quick Fixes Checklist

- [ ] ✓ Logging configured and running
- [ ] ✓ All async operations wrapped in try-catch
- [ ] ✓ Error messages include details
- [ ] ✓ File size limit set to 50MB
- [ ] ✓ PDF timeout set to 10s
- [ ] ✓ Build succeeds without errors

**Recommended next steps**:

1. Run `npm run dev`
2. Try uploading a simple TXT file first
3. Check terminal logs for any errors
4. If error occurs, share the full log output
5. Try uploading a small PDF (< 1MB)
6. If still failing, increase PDF timeout to 15s

---

## 💡 How to Share Logs for Support

When asking for help, provide:

```
1. Full server log from upload attempt:
   [Copy entire terminal output from start to end]

2. File information:
   - File name: ___________
   - File size: ___________
   - File type: ___________
   - Source: (PDF exported from Word? Scanned? etc.)

3. What happens:
   - [ ] Hangs/takes very long
   - [ ] Returns 500 immediately
   - [ ] Other: ___________

4. Your setup:
   - OS: ___________
   - Node version: (npm run "node -v")
   - npm version: (npm -v)
```

---

## ✨ Summary

The upload endpoint now has comprehensive logging to identify any issue. Simply:

1. **Run dev server**: `npm run dev`
2. **Upload a file**: Check the terminal
3. **Read the logs**: They tell you exactly what failed
4. **Fix based on logs**: Use the table above for solutions

All 500 errors should now include clear, actionable messages.
