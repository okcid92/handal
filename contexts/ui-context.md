# ui-context.md — Handal Design System & UI Rules

## Brand Identity

- **Primary Color**: #6c5448 (IBAM brown)
- **Secondary**: Neutral grays (#f5f5f5, #e5e5e5)
- **Accent**: White (#ffffff)
- **Text**: Dark gray (#1a1a1a)

## Typography

- **Font Family**: `system-ui, -apple-system, sans-serif`
- **Headings**: Bold, primary color
  - H1: 2rem / bold
  - H2: 1.5rem / bold
  - H3: 1.25rem / semibold
- **Body**: Regular, 1rem, high contrast

## Spacing System

- Base unit: 4px (Tailwind default)
- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64px

## Color Palette

```css
:root {
  --primary: #6c5448;
  --primary-light: #8a7568;
  --primary-dark: #4a3a32;
  --background: #f5f5f5;
  --surface: #ffffff;
  --text: #1a1a1a;
  --text-muted: #6b7280;
  --success: #10b981;
  --error: #ef4444;
  --warning: #f59e0b;
  --info: #3b82f6;
}
```

## Components

### Button
```tsx
// Primary button
<button className="bg-[#6c5448] text-white px-4 py-2 rounded hover:bg-[#4a3a32]">
  Submit
</button>

// Secondary button
<button className="border border-[#6c5448] text-[#6c5448] px-4 py-2 rounded hover:bg-gray-50">
  Cancel
</button>
```

### Status Badge
```tsx
const statusColors: Record<string, string> = {
  CLEAN: 'bg-green-100 text-green-800',
  FLAGGED_PLAGIARISM: 'bg-red-100 text-red-800',
  PENDING_VALIDATION: 'bg-yellow-100 text-yellow-800',
  VALIDATED: 'bg-blue-100 text-blue-800',
  ANALYSIS_IN_PROGRESS: 'bg-blue-100 text-blue-800',
  REJECTED: 'bg-red-100 text-red-800'
};

<span className={`px-2 py-1 rounded ${statusColors[status]}`}>
  {status}
</span>
```

### Input Field
```tsx
<input
  type="text"
  className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-[#6c5448]"
  placeholder="Enter theme title..."
/>
```

### Card
```tsx
<div className="bg-white rounded-lg shadow p-6">
  <h3 className="font-bold text-lg">{detectedTitle}</h3>
  <StatusBadge status={status} />
</div>
```

### Document Card (Always shows detectedTitle)
```tsx
interface DocumentCardProps {
  detectedTitle: string;
  status: DocumentStatus;
  score?: number;
}

export function DocumentCard({ detectedTitle, status, score }: DocumentCardProps) {
  return (
    <div className="bg-white border rounded-lg p-4">
      <h3 className="font-bold text-lg mb-2">{detectedTitle}</h3>
      <div className="flex gap-2">
        <StatusBadge status={status} />
        {score !== undefined && (
          <span className="text-sm">Score: {score.toFixed(1)}%</span>
        )}
      </div>
    </div>
  );
}
```

## Layouts

### Main Layout
```tsx
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <header className="bg-[#6c5448] text-white p-4">
        <h1>Handal</h1>
      </header>
      <main className="max-w-4xl mx-auto p-4">
        {children}
      </main>
    </div>
  );
}
```

### Theme List Page
```tsx
<div className="space-y-4">
  {themes.map(theme => (
    <div key={theme.id} className="bg-white border rounded-lg p-4">
      <h3 className="font-bold">{theme.detectedTitle}</h3>
      <StatusBadge status={theme.status} />
    </div>
  ))}
</div>
```

### Document Analysis Page
```tsx
<div className="space-y-6">
  <DocumentCard detectedTitle={doc.detectedTitle} status={doc.status} />
  
  <div className="bg-white rounded-lg p-6">
    <h2 className="font-bold mb-4">Analysis Breakdown</h2>
    <div className="grid grid-cols-3 gap-4">
      <div>TF-IDF: {breakdown.tfidf}%</div>
      <div>Jaccard: {breakdown.jaccard}%</div>
      <div>N-gram: {breakdown.ngram}%</div>
    </div>
  </div>
</div>
```

## Mandatory UI Rules

1. **All status text in UPPERCASE**
2. **Never show ID or filename** — always `detectedTitle`
3. **`detectedTitle` must be the first visible text**
4. **Primary color #6c5448** on all CTAs and headers
5. **Content filter** applied to document previews

## Responsive Breakpoints

- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

## Status Color Mapping

| Status | Color |
|--------|-------|
| PENDING | Yellow |
| PENDING_VALIDATION | Yellow |
| VALIDATED_CD | Blue |
| VALIDATED_DA | Blue |
| VALIDATED | Green |
| REJECTED | Red |
| CLEAN | Green |
| FLAGGED_PLAGIARISM | Red |
| ANALYSIS_IN_PROGRESS | Blue |
| ANALYSIS_COMPLETE | Blue |
| APPROVED | Green |