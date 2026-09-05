# Design System Alignment Plan (Light Theme & Minimal Aesthetic)

## Goal Description

Refactor `Home`, `Communities`, `Canteens`, `Events`, and `Profile` pages to fully align with the light‑themed minimal design system from the Landing Page. We will remove the dark backgrounds, orange accent colors, gaming/dashboard aesthetics, and heavy gradients, and replace them with:
- Soft off-white background (`#FAF9F6`)
- Typography using `font-dmserif` for main headers and clean hierarchy
- Rounded pill buttons (black/white/gray/muted blue-gray, no orange)
- Clean, bordered white cards (`bg-white border border-black/5 rounded-2xl shadow-sm`)
- Soft, minimal shadows and spacing
- Text color using `#0f0f10` (foreground) and `text-neutral-500` (muted/secondary)

## Proposed Changes

### Global CSS (`src/app/globals.css`)
- Update CSS variables for light theme (background: `#faf9f6`, foreground: `#0f0f10`, card: `#ffffff`, border: `rgba(0, 0, 0, 0.05)`, brand: `#000000`, accent: `#505f78`).
- Remove the neon glow-hover effect and replace it with a clean minimal shadow/translate hover.

### App Layout (`src/app/(app)/layout.tsx`)
- Refactor the global background blobs if needed (keep soft beige blobs).
- Update the mobile and desktop nav sidebar to match the Landing Page style:
  - Soft light backgrounds, clean border lines, and dark text.
  - Remove dark theme styles like `text-white`, `bg-brand/10` (when orange-themed), etc.
  - Set active tab color to a clean accent style (e.g., bg-black text-white or bg-[#505f78]/10 text-[#505f78]).

### Home Page (`src/app/(app)/home/page.tsx`)
- Replace the tab filters with the landing page design (soft white rounded-full buttons with black or neutral active states).
- Change post cards to use clean bordered white cards (`bg-white border border-black/5 rounded-2xl shadow-sm`).
- Replace orange branding (`bg-brand`, `bg-brand/10`, `text-brand`, etc.) with black/white/accent blue-gray.
- Ensure all text utilizes the updated foreground color (remove hardcoded `text-white`).

### Communities Page (`src/app/(app)/communities/page.tsx`)
- Redesign classroom locator card to use clean light styling.
- Convert official clubs/communities cards into white cards with soft borders, removing dark theme dependencies.
- Update Search input box to be consistent with the clean, minimalist theme.

### Canteens Page (`src/app/(app)/canteens/page.tsx`)
- Align headers, cards, badges, and detail buttons to the light theme.
- Replace orange text and buttons with clean black and muted blue-gray style elements.

### Events Page (`src/app/(app)/events/page.tsx`)
- Clean up event lists, date headers, filters, and cards.
- Remove neon gradient tags/covers, replacing them with subtle, minimal styling.

### Profile Pages (`src/app/(app)/profile/me/page.tsx` & `src/app/(app)/profile/[userId]/page.tsx`)
- Clean up cover banner to use soft beige/neutral colors instead of dark orange gradients.
- Refactor connection/stats cards, activity limit progress bars, settings tabs, and toggle buttons.

## Verification Plan

- Run the dev server (`npm run dev`) and manually inspect each updated page.
- Verify typography hierarchy, light-off-white background consistency, card borders, pill buttons, and soft shadows.
