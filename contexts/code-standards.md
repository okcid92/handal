# code-standards.md — Handal Code Conventions

## General Principles

- **Spec-driven**: Follow feature specs exactly
- **TypeScript strict**: Enable all strict checks
- **Modular**: Write reusable, composable code
- **Documented**: Clear naming and complex logic comments

## TypeScript Config

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true
  }
}
```

## Database Enums

Always use UPPERCASE for status values:

```typescript
enum Role {
  STUDENT = "STUDENT",
  TEACHER = "TEACHER",
  DA = "DA",
  ADMIN = "ADMIN"
}

enum ThemeStatus {
  PENDING = "PENDING",
  PENDING_VALIDATION = "PENDING_VALIDATION",
  VALIDATED_CD = "VALIDATED_CD",
  VALIDATED_DA = "VALIDATED_DA",
  VALIDATED = "VALIDATED",
  REJECTED = "REJECTED",
  DOCUMENT_SUBMITTED = "DOCUMENT_SUBMITTED",
  ANALYSIS_PENDING = "ANALYSIS_PENDING",
  APPROVED = "APPROVED",
  FLAGGED_PLAGIARISM = "FLAGGED_PLAGIARISM"
}

enum DocumentStatus {
  SUBMITTED = "SUBMITTED",
  ANALYSIS_IN_PROGRESS = "ANALYSIS_IN_PROGRESS",
  ANALYSIS_COMPLETE = "ANALYSIS_COMPLETE",
  CLEAN = "CLEAN",
  FLAGGED_PLAGIARISM = "FLAGGED_PLAGIARISM"
}

enum AnalysisStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED"
}
```

## DetectedTitle Rule

**Always use `detectedTitle`, never `id` or `filename`:**

```typescript
// ✅ Good
interface Document {
  detectedTitle: string;
  status: DocumentStatus;
}

// ❌ Bad
interface Document {
  id: string;
  fileName: string;
}
```

## API Routes

### Structure
```typescript
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAuth } from '@/lib/authz';

export async function GET(request: Request) {
  const user = await checkAuth(request);
  
  const themes = await prisma.theme.findMany({
    where: { studentId: user.id },
    select: {
      detectedTitle: true,  // Use title as detectedTitle
      status: true,
      createdAt: true
    }
  });
  
  return NextResponse.json(themes);
}
```

### Response Format
```typescript
// Always return detectedTitle
{
  detectedTitle: "Impact of Climate Change on Agriculture",
  status: "PENDING_VALIDATION",
  createdAt: "2024-01-15T10:00:00Z"
}
```

## Prisma Schema Rules

```prisma
model Theme {
  id           BigInt      @id @default(autoincrement())
  title         String      // Maps to detectedTitle in UI
  status        ThemeStatus @default(PENDING)
  studentId    BigInt
  createdAt    DateTime    @default(now())
}
```

## Frontend Components

### Document Card
```tsx
interface DocumentCardProps {
  detectedTitle: string;
  status: DocumentStatus;
}

export function DocumentCard({ detectedTitle, status }: DocumentCardProps) {
  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-bold">{detectedTitle}</h3>
      <StatusBadge status={status} />
    </div>
  );
}
```

### Status Badge
```tsx
const statusColors: Record<string, string> = {
  CLEAN: 'bg-green-100 text-green-800',
  FLAGGED_PLAGIARISM: 'bg-red-100 text-red-800',
  PENDING_VALIDATION: 'bg-yellow-100 text-yellow-800',
  VALIDATED: 'bg-blue-100 text-blue-800'
};
```

## Analysis Algorithms

### Weight Distribution
- TF-IDF + Cosine: 40%
- Jaccard: 30%
- N-gram: 30%

### Score Calculation
```typescript
function calculateFinalScore(
  tfidfScore: number,
  jaccardScore: number,
  ngramScore: number
): number {
  return (tfidfScore * 0.4) + (jaccardScore * 0.3) + (ngramScore * 0.3);
}

function determineStatus(score: number): DocumentStatus {
  return score < 20 ? DocumentStatus.CLEAN : DocumentStatus.FLAGGED_PLAGIARISM;
}
```

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files | kebab-case | `content-filter.ts` |
| Components | PascalCase | `StatusBadge.tsx` |
| Functions | camelCase | `calculateScore()` |
| Constants | UPPER_SNAKE_CASE | `MAX_THRESHOLD` |
| Enums | PascalCase + UPPER values | `ThemeStatus.PENDING` |

## File Organization

```
src/
├── app/
│   └── api/
│       ├── themes/
│       ├── documents/
│       ├── analysis/
│       └── reports/
├── components/
│   ├── ui/           # Base components
│   └── features/     # Feature components
└── lib/
    ├── prisma.ts
    ├── authz.ts
    └── analysis/
        ├── tfidf.ts
        ├── jaccard.ts
        └── ngram.ts
```

## Linting Rules

```javascript
// eslint.config.mjs
{
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "no-console": "warn"
  }
}
```

## Content Filter Rule

Always filter before analysis:
- Remove cover pages
- Remove acknowledgements
- Remove IBAM institutional content

```typescript
function filterContent(text: string): string {
  // Remove standard IBAM headers/footers
  // Remove acknowledgements section
  // Remove cover page
  return filteredText;
}
```