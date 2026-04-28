# Text Extraction Error - Troubleshooting Guide

## Error: "Could not extract text from document"

This error occurs when the system fails to extract text from the uploaded file. Here are the common causes and solutions.

---

## 🔍 Common Causes

### 1. **Corrupted PDF File**

**Symptoms**:

- Error message includes "PDF is not a valid PDF file"
- File was incomplete when uploaded
- File appears to be PDF but is actually a different format

**Solution**:

- Try opening the file locally in Adobe Reader or Preview
- Re-export the PDF from the source application
- Make sure the file wasn't truncated during transfer
- Try a different PDF converter if applicable

**Example Error in Logs**:

```
[UPLOAD] Text extraction failed: {
  error: "PDF is not a valid PDF file",
  fileName: "document.pdf",
  fileType: "application/pdf",
  fileSize: 1024
}
```

---

### 2. **Encrypted/Password-Protected PDF**

**Symptoms**:

- Error mentions "encrypted" or "password"
- PDF opens in Acrobat but requires authentication
- Document appears normal but cannot be parsed

**Solution**:

- Remove password protection from the PDF
- Use Adobe Acrobat or online tools to decrypt (if you have permission)
- Ask the document owner to provide unencrypted version
- Check if the file has user/owner permissions that block copying

**Example Error in Logs**:

```
[PDF] Error during PDF extraction: {
  errorMsg: "PDF is encrypted",
  type: "PDF_ENCRYPTED"
}
```

---

### 3. **Unsupported File Format**

**Symptoms**:

- File extension shows `.pdf` but it's actually another format
- Image PDFs (scanned documents with no text layer)
- Files with unusual encoding

**Solution**:

- For scanned PDFs: Use OCR (Optical Character Recognition) tool
  - Try Adobe Acrobat's OCR feature
  - Use free tools like Tesseract
  - Export from source application with OCR enabled
- For other formats: Convert to standard PDF first
- Use file command to verify actual format: `file document.pdf`

**Example Error in Logs**:

```
[EXTRACT] Starting first page extraction {
  mimeType: "application/pdf",
  bufferSize: 0  // ← Empty buffer!
}
```

---

### 4. **File Too Large (>50MB)**

**Symptoms**:

- Error during file validation (before extraction)
- File size error appears in logs
- Upload fails immediately

**Solution**:

- Reduce file size before uploading
- Remove unnecessary images/embedded files
- Compress using PDF compression tools
- Split large document into multiple files

**Example Error in Logs**:

```
[UPLOAD] File validation: {
  error: "File must be less than 50MB",
  size: 52428800
}
```

---

### 5. **Empty or Blank PDF**

**Symptoms**:

- PDF appears blank when opened
- File size is very small
- No text extracted

**Solution**:

- Re-generate the PDF from source
- Make sure content is actually in the document
- Try opening in different PDF viewer
- Check if pages exist but are just blank

**Example Error in Logs**:

```
[EXTRACT] Extraction complete: {
  length: 0  // ← No text found
}
```

---

### 6. **DOCX/TXT with Invalid Encoding**

**Symptoms**:

- File type is `.docx` or `.txt`
- Error occurs during text extraction
- Garbled characters in logs

**Solution**:

- Re-save the DOCX file in latest Office format
- For TXT: Ensure UTF-8 encoding
  - In Windows: Save As → Encoding: UTF-8
  - In Mac: Use Sublime Text or VS Code to convert encoding
- Try copying content and pasting into plain text editor

**Example Error in Logs**:

```
[EXTRACT] File is non-PDF, extracting first 2000 chars
[EXTRACT] Extraction complete: {
  length: 0  // ← Empty or unreadable
}
```

---

## 📋 Verification Steps

### Step 1: Check File Format

```bash
# Verify actual file format (not just extension)
file document.pdf
# Output should show: "PDF document, version 1.4" or similar

# For DOCX
file document.docx
# Output should show: "Microsoft Word 2007+"
```

### Step 2: Test with Simple File

- Try uploading a simple, clean PDF first
- Verify your setup works with known-good files
- Then test with the problematic file

### Step 3: Check File Size

```bash
# On Mac/Linux
ls -lh document.pdf
# Should be less than 50MB

# On Windows
dir document.pdf
# Check size in output
```

### Step 4: Check PDF Validity

- Open in Adobe Acrobat Reader
- Check for error messages
- Try "Save As" to re-export as new PDF
- Verify first page has visible content

---

## 📊 Debug Logs to Check

When uploading fails, check the server logs (from `npm run dev`) for messages like:

### ✅ Successful Extraction

```
[UPLOAD] Starting file upload processing...
[UPLOAD] Student authenticated: { studentId: '1' }
[UPLOAD] File received: { name: 'memoire.pdf', size: 2097152, type: 'application/pdf' }
[UPLOAD] File validation: passed
[UPLOAD] Buffer created: { size: 2097152, checksum: 'abc123...' }
[EXTRACT] Starting first page extraction { mimeType: 'application/pdf', bufferSize: 2097152 }
[EXTRACT] File is PDF, using pdfjs-dist
[PDF] Starting PDF parsing with buffer size: 2097152
[UPLOAD] First page extracted: { length: 1523, preview: 'Abstract...' }
✓ Upload successful!
```

### ❌ Failed Extraction

```
[UPLOAD] Text extraction failed: {
  error: "PDF is not a valid PDF file",
  fileName: "document.pdf",
  fileType: "application/pdf",
  fileSize: 1024
}
✗ Error: Could not extract text: PDF is not a valid PDF file
```

---

## 🛠️ Advanced Solutions

### For Scanned PDFs (No OCR)

If you have a scanned PDF with no text layer:

**Option 1: Online OCR**

- Visit https://www.onlineocr.net/
- Upload PDF
- Download result as searchable PDF

**Option 2: Adobe Acrobat**

- Open PDF in Acrobat
- Tools → Recognize Text → In This File
- Save result

**Option 3: Local OCR (Linux/Mac)**

```bash
# Install Tesseract OCR
brew install tesseract  # Mac
apt install tesseract-ocr  # Linux

# Convert PDF with OCR
tesseract input.pdf output pdf
```

### For Encrypted PDFs

**Online Decryption**:

- Visit https://www.ilovepdf.com/unlock_pdf
- Upload encrypted PDF
- Download decrypted version

**Adobe Acrobat**:

- If you have the password, open file
- File → Properties → Security → Remove Security

---

## ✅ Resolution Checklist

- [ ] Verify file opens locally (Adobe Reader, Preview, etc.)
- [ ] Check file size is < 50MB
- [ ] Confirm file format matches extension
- [ ] For DOCX: Re-save in Office 2010 or newer
- [ ] For TXT: Verify UTF-8 encoding
- [ ] For scanned PDFs: Apply OCR first
- [ ] For encrypted: Remove password protection
- [ ] Test upload with simple clean PDF first
- [ ] Check server logs for detailed error message
- [ ] Try re-exporting from source application

---

## 📞 Still Having Issues?

1. **Check the server logs** with `npm run dev`
2. **Look for `[EXTRACT]` or `[UPLOAD]` logs** in terminal
3. **Note the exact error message** (e.g., "PDF is not a valid PDF file")
4. **Reference the matching section** above for solution
5. **Try the suggested fix** for that specific error

---

## 🎯 Quick Reference

| Error                         | Cause                 | Solution                        |
| ----------------------------- | --------------------- | ------------------------------- |
| "PDF is not a valid PDF file" | Corrupted/invalid PDF | Re-export from source           |
| "PDF is encrypted"            | Password protected    | Remove password protection      |
| Length: 0                     | Empty or scanned PDF  | Apply OCR or use different file |
| "File must be less than 50MB" | Too large             | Reduce size, split file         |
| DOCX/TXT extraction fails     | Encoding issue        | Re-save with UTF-8 encoding     |
| File validation failed        | Wrong type/size       | Check file format and size      |

---

## 🚀 Prevention Tips

1. **Always verify files locally first** before uploading
2. **Use standard PDF export** from source application
3. **For DOCX**: Save from Microsoft Word directly
4. **For scanned documents**: Use OCR before uploading
5. **Test with small file first** before large uploads
6. **Keep files under 20MB** when possible (faster upload/processing)
7. **Remove passwords** from sensitive PDFs before sharing

---

**Last Updated**: 2026-04-19  
**Module**: Document Upload & Text Extraction
