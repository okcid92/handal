# 01-design-system.md — Design System Feature

Read @contexts/Agent.md before starting

---

## Goal
Build the base UI components (Button, StatusBadge, Input, Card) with IBAM branding (#6c5448)

## Implementation

### Step 1: Create component structure
```
src/
├── components/
│   └── ui/
│       ├── Button.tsx
│       ├── StatusBadge.tsx
│       ├── Input.tsx
│       └── Card.tsx
```

### Step 2: Implement Button component
- Primary: bg-[#6c5448], text-white
- Secondary: border-[#6c5448], text-[#6c5448]
- Hover: darken by 10%
- Disabled: opacity-50

### Step 3: Implement StatusBadge component
- CLEAN: bg-green-100 text-green-800
- FLAGGED_PLAGIARISM: bg-red-100 text-red-800
- PENDING_VALIDATION: bg-yellow-100 text-yellow-800
- VALIDATED: bg-blue-100 text-blue-800

### Step 4: Implement Input component
- Border: border-gray-300
- Focus: border-[#6c5448]
- Rounded corners

### Step 5: Implement Card component
- White background
- Rounded-lg
- Shadow
- Padding: p-6

## Check When Done
- [ ] Button with primary/secondary variants works
- [ ] StatusBadge shows correct color for each status
- [ ] Input has focus state with primary color
- [ ] Card displays correctly with children
- [ ] All components use #6c5448 for primary styling