# Design System Specification: The Academic Curator

## 1. Overview & Creative North Star
**Creative North Star: "The Digital Curator"**
This design system is built to transform complex information into an authoritative, editorial experience. Inspired by the scholarly and traditional elements of the reference logo—the precision of the woven patterns and the warmth of the tapered edges—the system moves away from the "generic SaaS" look. It adopts an "Editorial Academic" aesthetic: a balance of vast white space, sophisticated tonal layering, and high-contrast typography.

The system breaks the standard "box-in-a-box" layout. Instead, it utilizes intentional asymmetry, where large `display-lg` headlines anchor the page and content flows through "floating" tiers of depth. We treat the interface not as a screen, but as a series of premium parchment and glass layers that invite focused study and professional trust.

---

## 2. Colors: Tonal Depth vs. Structural Lines
The palette is a refined extraction of the logo's soul: the slate blue of ink (`primary: #4f6174`) and the warm, earthy sienna of traditional crafts (`secondary: #75584e`).

### The "No-Line" Rule
**Borders are prohibited for sectioning.** To create a premium, seamless feel, we define boundaries through background shifts only. 
- Use `surface` (#f8f9fa) as your global canvas.
- Transition to `surface-container-low` (#f1f4f5) to define a content area.
- Use `surface-container-highest` (#dee3e6) for utility sidebars.
The eye should follow the color transition, not a 1px stroke.

### Surface Hierarchy & Nesting
Treat the UI as physical layers.
1.  **Level 0 (Base):** `surface` (#f8f9fa) - Global background.
2.  **Level 1 (Sections):** `surface-container-low` (#f1f4f5) - Large layout blocks.
3.  **Level 2 (Objects):** `surface-container-lowest` (#ffffff) - High-priority cards or input modules.

### The Glass & Gradient Rule
To provide "visual soul," primary CTAs and hero states should avoid flat fills. Use a subtle linear gradient from `primary` (#4f6174) to `primary_dim` (#435568). For floating navigation or modal overlays, use `surface_container_lowest` with a **60% opacity and a 20px backdrop-blur**, creating a frosted glass effect that feels modern and lightweight.

---

## 3. Typography: Authoritative Precision
We use **Inter** for its neutral, high-legibility characteristics, but we apply it with editorial weight to convey academic rigor.

*   **Display (lg/md):** Reserved for "Hero" moments. Use `on-surface` (#2d3335) with a letter-spacing of `-0.02em` to create a compact, authoritative impact.
*   **Headline (sm/md):** Used for section starts. Ensure significant vertical breathing room above headlines (at least 3x the font size).
*   **Title (md/sm):** Set in `on-surface-variant` (#5a6062) to provide a clear hierarchy without competing with primary headlines.
*   **Body (lg/md):** The workhorse. Use `on-surface` for maximum readability. Line height should be generous (1.6) to reference textbook layouts.
*   **Labels:** Use `primary` (#4f6174) for labels to draw the eye to functional metadata.

---

## 4. Elevation & Depth
Elevation is achieved through **Tonal Layering** and **Ambient Shadows**, never through harsh outlines.

### The Layering Principle
Place a `surface-container-lowest` (#ffffff) card on a `surface-container` (#ebeef0) background. This "white-on-grey" stacking creates a natural lift that feels sophisticated and organic.

### Ambient Shadows
If a floating element (like a dropdown or modal) requires a shadow, it must be "Ambient":
- **Color:** Use 8% opacity of `on-surface` (#2d3335).
- **Blur:** Large (24px to 40px).
- **Spread:** -4px (to keep the shadow "tucked" under the element).

### The "Ghost Border" Fallback
In high-density data views where borders are functionally required for accessibility, use a **Ghost Border**: `outline-variant` (#adb3b5) at **15% opacity**. It should be felt, not seen.

---

## 5. Components

### Buttons
*   **Primary:** A gradient of `primary` to `primary_dim`. Roundedness: `md` (0.375rem). Use `on-primary` for text.
*   **Secondary:** No background. Use a `ghost-border` and `primary` text.
*   **Tertiary:** Text-only in `secondary` (#75584e) for an academic, understated feel.

### Input Fields
Avoid "box" inputs. Use a `surface-container-low` background with a `sm` (0.125rem) bottom-only border in `primary` that grows to 2px on focus. This mimics a "fill-in-the-blank" scholarly form.

### Cards & Lists
*   **Forbidden:** Divider lines between list items.
*   **Requirement:** Use 16px of vertical white space and a subtle background hover state using `surface-container-high` (#e5e9eb). 
*   **Cards:** Use `surface-container-lowest` with an `xl` (0.75rem) corner radius for a soft, premium feel.

### Chips
Use `secondary-container` (#ffdbce) with `on-secondary-container` (#674b41) text. The warmth of the brown tones from the logo serves as a perfect highlight for "Active" or "Selected" states without being loud.

---

## 6. Do's and Don'ts

### Do:
*   **Do** embrace asymmetry. Align a headline to the left and a description card to the right with 25% empty space between them.
*   **Do** use `primary_fixed` (#ccdff6) for "Read Only" or "Archival" tags to provide a soft, scholarly contrast.
*   **Do** ensure all interactive elements have a minimum tap target of 44px, despite the "refined" visual appearance.

### Don't:
*   **Don't** use 100% black text. Always use `on-surface` (#2d3335) to keep the "ink-on-paper" softness.
*   **Don't** use standard shadows. If it looks like a default Material Design shadow, it is too heavy.
*   **Don't** use bright "Signal" colors. For errors, use the refined `error` (#a83836) which is a muted, academic brick red, rather than a neon red.