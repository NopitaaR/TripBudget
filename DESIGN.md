# TripBudget — Design System (DESIGN.md)

This document is the single source of truth for **visual and interaction design**. It was extracted directly from the exported prototype (`tripbudget.html`) — its CSS custom properties, class rules, and inline styles — cross-checked against `PRD.md` for functional context. Any future implementation (React or otherwise) must reproduce these values exactly rather than reinterpreting the brief from scratch.

**Reference priority when implementing:**
1. `PRD.md` — what the product does
2. `DESIGN.md` (this file) — how it looks and behaves visually
3. `tripbudget.html` — visual reference for anything not explicitly written down here

---

## 1. Design Concept & Principles

**Concept:** Clean Outdoor × Modern Finance × Friendly Travel.

The interface reads as modern, calm, trustworthy, and lightweight — financial but never corporate; travel-flavored but never a camping-themed skin. It should feel like a real native mobile app, not a shrunk desktop dashboard.

Six governing principles (apply to every screen):
1. **Mobile-first** — one column, phone-native patterns (bottom nav, sheets, large tap targets).
2. **Financial clarity** — money values (totals, owed/receive amounts, per-expense amounts) always carry the strongest visual weight on their screen.
3. **Fast interaction** — Add Expense is reachable in ≤2 taps and its form has no unnecessary fields.
4. **Clear hierarchy** — a user should always be able to tell, at a glance: where am I, which trip, how much spent, what I owe/will receive, what to do next.
5. **Consistency** — one button system, one card system, one type scale, reused everywhere.
6. **Friendly travel personality** — delivered through emoji/category icons and warm accent color, not through decorative illustration or theming.

Explicitly avoid: corporate banking chrome, saturated/childish color, dashboard density, glassmorphism, heavy shadows, gradients, or excessive animation.

---

## 2. Color System

All hex values are taken verbatim from the prototype's `:root` custom properties.

| Token | Hex | Purpose | Where used |
|---|---|---|---|
| `--color-primary` (green) | `#1F4D3B` | Primary/brand color. Positive financial state ("will receive"). | Primary buttons, active bottom-nav icon/label, current-trip card background, floating Add button, pill-button outlines, active tab/category chip, "will receive" amounts |
| `--color-primary-light` (green-light) | `#EAF1EC` | Soft primary tint | Avatar background, "will receive" hero card background, success checkmark circle background |
| `--color-background` | `#F7F4EE` | App background (warm off-white) | Screen background behind all cards/content |
| `--color-surface` | `#FFFFFF` | Card/surface background | Cards, list rows, inputs, bottom nav bar, icon buttons |
| `--color-text` (ink) | `#26241F` | Primary text (dark charcoal) | Headings, titles, amounts, primary body text |
| `--color-muted` | `#8B8578` | Secondary text (muted gray) | Metadata, timestamps, helper text, supporting labels |
| `--color-accent` | `#E5A445` | Warm yellow/orange accent | "Upcoming" trip badge text base tone, travel-flavored highlights (used sparingly, never as a primary-action color) |
| `--color-accent-light` | `#FBF0DD` | Soft accent tint | Row category icon background, "Upcoming" badge background |
| `--color-border` | `#EDE8DD` | Soft neutral border | Card borders, input borders, row dividers, bottom-nav top border |
| `--color-warning-text` | `#8A5A15` | Warning/accent text on light accent backgrounds | "Upcoming" badge label text |
| `--color-error` (owe) | `#B5502F` | Error/"you owe" state | "You owe" hero text, owe-state amounts |
| `--color-error-bg` (owe-bg) | `#FBEDE7` | Soft error tint | "You owe" hero card background |
| `--color-success` (get) | same as primary `#1F4D3B` | Success/"you will receive" state | Reuses primary green — the app intentionally does not introduce a second "success green"; see note below |
| `--color-success-bg` (get-bg) | same as primary-light `#EAF1EC` | Soft success tint | "You will receive" hero card background |

**Rule:** Do not introduce any color outside this table. "Owe" vs. "receive" is communicated by warm-terracotta (`#B5502F`) vs. forest-green (`#1F4D3B`), which are deliberately **muted, desaturated tones** rather than alarming stoplight red/green — this is a design requirement, not an oversight. Every owe/receive state must also carry a text label ("You owe" / "You will receive" / "{name} owes you"), never color alone.

> Note on the prototype's outer canvas color (`#DDD7C8`, the page background behind the phone frame): this exists only to stage the phone mockup for presentation and is **not** part of the app's design system — do not carry it into implementation.

---

## 3. Typography

**Font family:** Plus Jakarta Sans (Google Fonts), weights 400/500/600/700/800, loaded as the sole typeface. No secondary/serif family is used anywhere. Fallback stack: `'Plus Jakarta Sans', sans-serif`.

| Role | Size | Weight | Notes |
|---|---|---|---|
| 1. Display / Hero (trip total on Home/Wallet hero, big amount) | 32px | 800 | `letter-spacing: -0.5px`. Reserved for the single most important number on a screen. |
| 2. Page heading (`h1`: "My Trips", "Add Expense", "Settlement") | 22px | 700 | One per screen, top of content. |
| 3. Section heading (`h2`: "Quick actions", "Members", "Recent Expenses") | 15px | 700 | Sits directly above the section's content, 12px bottom margin. |
| 4. Card heading (trip name inside Current Trip card) | 21px | 700 | Color inverts to white on the green trip-card background. |
| 5. Body (form labels' entered text, member names, row titles) | 14.5px | 600 | Standard readable content weight. |
| 6. Secondary text (`.muted`: dates, "Karina paid", supporting captions) | 13px | 400 | Muted-gray color token. |
| 7. Caption (avatar name under member circle, nav-adjacent micro-labels) | 11–12px | 400–600 | Smallest readable size; only for redundant/supporting labels. |
| 8. Financial / numerical value (per-expense amount, per-person share, debt-row amount) | 14.5–20px | 700–800 | Always bold; never the same weight as surrounding body text even at small sizes. |
| 9. Button text | 15px | 700 | Pill/small buttons use 12.5–13px / 700. |
| 10. Navigation label (bottom nav) | 10.5px | 600 | Paired with a 19px icon glyph above it. |

**Rule:** Financial numbers are always bold (700/800) and are always the largest text in their immediate container, even when that container is small (e.g., a debt-row amount is smaller in absolute px than a page heading, but is still bolder than any other text in that row).

---

## 4. Spacing System

Base scale (px): **4 · 8 · 10 · 12 · 14 · 16 · 18 · 20 · 22 · 24**. The prototype does not use a strict powers-of-4 scale beyond this — it favors 10/12/16/20/22 as its working rhythm. Treat the following as the canonical scale for implementation:

`--space-xs: 4px` · `--space-sm: 8px` · `--space-sm2: 12px` · `--space-md: 16px` · `--space-lg: 20px` · `--space-xl: 24px`

| Context | Value |
|---|---|
| Screen horizontal padding | 20px both sides |
| Screen top padding | 20px |
| Screen bottom padding (clears bottom nav) | 100px |
| Card internal padding | 16–22px (hero cards 22px, standard cards 14–16px) |
| Gap between quick-action tiles / stat cards | 10–12px |
| Vertical gap between major sections | 22–24px |
| List row vertical padding | 12px, divided by a 1px border, no padding on last row |
| Form field bottom margin | 16px |
| Button top margin when stacked | 12–16px |
| Bottom nav internal padding | 10px 8px, plus `env(safe-area-inset-bottom)` |

**Rule:** Do not invent new spacing values. When something needs "more space," reach for the next value up this scale rather than a custom pixel value.

---

## 5. Layout

- **Primary viewport:** 390×844 (iPhone-class mobile), single column, no side-by-side panels.
- **Max content width (mobile):** the full screen width minus 20px padding on each side (i.e., content width = viewport − 40px).
- **Tablet (768–1023px) and Desktop (1024px+):** center the mobile layout in the viewport with a **max content width of 480px** (a slightly widened phone column), rather than reflowing into a multi-column dashboard. Do not stretch cards to fill wide viewports — preserve the same 20px side padding and the same vertical single-column rhythm; add breathing room (larger outer margin/background) instead of wider components. Bottom navigation remains mobile-style (fixed, bottom-anchored) at all breakpoints unless a future spec says otherwise.
- **Bottom navigation:** `position: absolute` (or `fixed` in a real app shell) to the bottom of the viewport, full width, sitting above safe-area inset.
- **Floating Add button:** the center bottom-nav item, raised **24px above** the nav bar's baseline (`margin-top: -24px` on a 46×46px circle), so it visually breaks the nav bar's top edge. This is the only floating/elevated nav element — there is no separate FAB layered over screen content.
- **Line length:** form labels, list rows, and body copy should never span the full 390px+ width unbroken; financial values and short labels naturally stay short, and longer copy (empty-state descriptions) should wrap at a comfortable measure (roughly 32–40 characters per line at this viewport).

---

## 6. Border Radius

| Token | Value | Used for |
|---|---|---|
| `--radius-lg` | 20px | Hero cards: Current Trip card, Wallet hero (owe/receive), amount-input wrapper |
| `--radius-md` | 16–18px | Standard cards: trip-mini, quick-action tile, stat card, debt-row, done-card |
| `--radius-btn` | 14px | Primary/ghost buttons |
| `--radius-input` | 13px | Text inputs, textarea |
| `--radius-sm` | 12px | Row category icon (`.ic`), pill-button/category-chip inner icon container |
| `--radius-xs` | 7px | Checkbox (`.check`) — square-ish, not fully rounded |
| `--radius-pill` | 100px (fully pill) | Category chips, filter tabs, status badges, "Mark as paid" pill button |
| `--radius-round` | 50% | Avatars, icon buttons (bell/profile/back/overflow), floating Add button |

**Rule:** Every card in the app uses either `--radius-lg` (hero-level) or `--radius-md` (standard) — never an arbitrary in-between value. Buttons are always `--radius-btn` unless they are pill-shaped chips/badges.

---

## 7. Shadows & Borders

The design uses **borders as the default elevation method**, not shadows. Cards are `1px solid var(--color-border)` on a white surface against the warm off-white background — that contrast alone reads as "raised" without needing a shadow.

Shadow is reserved for exactly two elements:
- **Floating Add button:** `0 6px 16px rgba(31,77,59,0.35)` (a soft, brand-colored glow proportional to the button, not a generic gray shadow).
- **Full prototype/device frame** (presentation-only, not part of in-app elevation): a large ambient shadow used only to stage the phone mockup — never apply this inside the actual app UI.

No other component should carry a `box-shadow`. Do not add hover-lift shadows, card shadows, or drop shadows to lists, inputs, or standard cards — this is a deliberate restraint rule from the prototype, not an omission.

---

## 8. Button System

| Type | Background | Text | Border | Radius | Height/Padding | Weight |
|---|---|---|---|---|---|---|
| **Primary** (`.btn`) | `--color-primary` (#1F4D3B) | White | none | 14px | `padding: 16px` full-width | 700, 15px |
| **Ghost / Secondary** (`.btn.ghost`) | transparent | `--color-text` | 1.5px `--color-border` | 14px | same as primary | 700, 15px |
| **Destructive** (Delete, e.g. on Expense Detail) | transparent | `--color-error` (#B5502F) | 1.5px light-error border (`#EAD3C8`) | 14px | same as primary/ghost, typically half-width paired with Edit | 700, 15px |
| **Icon button** (`.icon-btn`, `.back`) | `--color-surface` (white) | `--color-text` glyph | 1px `--color-border` | 50% (circle) | 38×38px (icon-btn) / 34×34px (back) | glyph 15–16px |
| **Pill button** (`.pill-btn`, "Mark as paid") | transparent → `--color-primary` when done | `--color-primary` → white when done | 1.5px `--color-primary` → none when done | 100px (pill) | `padding: 9px 14px` | 700, 12.5px |
| **Floating Add button** | `--color-primary` | White "+" glyph | none | 50% (circle) | 46×46px, raised −24px | glyph 22px |

**States:**
- **Disabled:** reduce to ~50% opacity and remove pointer affordance (cursor default); do not change hue.
- **Active/pressed:** darken background by ~8–10% (primary) or apply the surface's `:active` scale — no bounce, no color inversion beyond what "done" states already define.
- **"Done" state** (pill button after "Mark as paid" is tapped): background fills solid `--color-primary`, text turns white, and the button becomes non-interactive (`disabled`) — this is the only button whose visual style changes based on completed action rather than hover/focus.

**Rule:** The Add Expense action is always the most visually prominent action on any screen it appears on (Home quick actions, Trip Detail primary CTA, bottom-nav center button) — implemented via the primary button style and/or the raised floating circle, never via size alone.

---

## 9. Bottom Navigation

- **Items (exactly four, in this order):** Home · Trips · **Add** · Balance. No fifth item; profile/settings are never added here (they live behind the top-right avatar icon on Home and similar top bars).
- **Height:** bar padding `10px 8px` plus `calc(14px + env(safe-area-inset-bottom, 0px))` at the bottom — effectively ~70–76px visual height depending on device safe area.
- **Icon size:** 19px for the three standard items; the Add button's glyph is 22px inside its own 46×46px circle.
- **Label size:** 10.5px / 600 weight, directly under the icon.
- **Active state:** icon + label turn `--color-primary`.
- **Inactive state:** icon + label are `--color-muted`.
- **Background:** `--color-surface` (white), with a `1px solid --color-border` top edge — no shadow.
- **Add button emphasis:** filled `--color-primary` circle, white glyph, raised above the bar (`margin-top: -24px`), with the brand-colored soft shadow described in Section 7. This is the only nav item with a filled background, a shadow, or a raised position.
- **Position:** anchored to the bottom of the screen/viewport (`position: absolute/fixed; left:0; right:0; bottom:0`), always visible except is not shown as an overlay above modal-style flows (bottom sheets, if used, should sit above it).

---

## 10. Cards

All cards share: white or tinted surface, `--color-border` (or no border, on tinted hero cards), consistent internal padding, and `--radius-lg`/`--radius-md` per Section 6. Interaction: entire card is tappable where it navigates (cursor pointer, no separate "view" button except the explicit "View trip →" link on the Current Trip card, which is a visual affordance, not the only tap target).

| Card type | Radius | Background | Key contents | Emphasis |
|---|---|---|---|---|
| **Current Trip Card** | 20px | Solid `--color-primary`, white text | icon, trip name, dates + traveler count, total spending (32px/800), "View trip →" | Strongest card on Home — full-bleed color, largest type on the screen |
| **Trip Card** (`.trip-mini`, Trips screen) | 18px | White, bordered | icon, name, dates + people count, amount spent, status badge (top-right) | Status badge (`Upcoming`/`Completed`) is the only differentiator between trip states |
| **Expense Card** (`.row`, list item) | n/a (row, not a boxed card) | transparent, divided by 1px bottom border | category icon (40×40, 12px radius, accent-light bg), name, payer/date, amount (right-aligned) | Amount is bold and right-aligned; no card chrome — kept as a lightweight row to avoid "too many cards" |
| **Balance Card** (`.wallet-hero`) | 20px | Tinted `--color-error-bg` (owe) or `--color-success-bg` (receive) | label ("You owe"/"You will receive"), amount (32px/800 in matching hue) | Tint + label + colored number — never color alone |
| **Settlement Card** (`.debt-row`) | 16px | White, bordered | avatar, "{payer} → {recipient}" or "You owe {name}", amount, "Mark as paid" pill | Amount sits left-of-center in bold; action pill stays visually secondary (outline, not filled, until done) |
| **Member Card** (`.member-chip` / avatar+name) | n/a (row or standalone avatar) | transparent (chip) or none (bare avatar+caption) | avatar circle with initial, name, optional checkbox/amount | Used identically in Add Members, Add Expense split list, and Expense Detail |
| **Summary Card** (`.stat`, Trip Detail) | 16px | White, bordered | one bold number (20px/700) + one muted label | Always used in a 2-up row (Total spending / Per person) |

---

## 11. Trip UI

Every trip representation (hero card, mini card) surfaces the same five facts, in the same order: **icon → name → destination/dates → member count → total spending**, plus a **status** signal:
- **Active/current trip:** shown as the full-bleed green hero card on Home — the strongest possible visual treatment, reserved for exactly one trip at a time.
- **Upcoming:** white card with an accent-tinted "Upcoming" pill badge (top-right).
- **Past/Completed:** white card with a neutral gray "Completed" pill badge (top-right); no other visual downgrade (same size, same type weight) — the badge alone communicates status, per the "subtle" requirement in the PRD.

---

## 12. Expense UI

Every expense row/detail surfaces: **category icon → name → payer → date → amount**, in that visual order (icon left, amount right, name/payer/date stacked in the middle column). Category is communicated primarily through a single emoji glyph inside the 40×40px accent-tinted icon square — do not add a second category indicator (no colored dot, no text tag) alongside it. Expense lists must stay a plain divided row list (Section 10) rather than boxed cards, to keep the list scannable and visually quiet per the "avoid excessive cards" principle.

---

## 13. Balance UI

The Balance screen (prototype label "Wallet" — see PRD §7.9 on this naming note) is built from two stacked hero cards (Section 10's Balance Card), each followed by its line-item breakdown (Settlement Card style rows):
1. "You owe" hero (error tint) → per-creditor debt rows, each with "Mark as paid."
2. "You will receive" hero (success/primary tint) → per-debtor rows, each with "Mark as paid."

Status is always dual-coded: tint color + explicit text label ("You owe" / "You will receive" / "{name} owes you"). Never rely on color alone. If a section has nothing to show (e.g., user owes nobody), omit that hero+list pair rather than showing it empty — if **both** are empty, replace the whole screen body with the All-Settled success state (Section 15).

---

## 14. Settlement UI

Each settlement entry reads left-to-right as **payer → recipient → amount → status**, matching the PRD's `"Nopi pays Karina Rp65.000"` structure but rendered compactly as `"{Payer} → {Recipient}"` on one line with the amount bold beneath it, and the "Mark as paid" pill button at the row's right edge. The pill button is intentionally an outline (not filled) in its default state so it never outweighs the amount typography; it only becomes a filled/solid green "done" pill after being tapped. Once every entry in the trip is marked paid, the entire list is replaced by the All-Settled success state.

---

## 15. Empty States

Structure (all empty states share this layout): centered column, large single glyph/icon (~44px) or the success check-circle, a short bold heading, one muted supporting sentence, and (except for the all-settled success state) a primary button for the obvious next action.

| Screen | Heading | Supporting text | Action |
|---|---|---|---|
| Home, no active trip | No active trip | Plan your next adventure | + Create Trip |
| Trips, no trips | No trips yet | Your next adventure starts here. | + Create Trip |
| Expense List, no expenses | No expenses yet | Start tracking your group spending. | + Add Expense |

Empty states must never look like an error: no red, no warning iconography — same background and type treatment as any other screen, just centered and sparse.

---

## 16. Success States

- **Toast** (`.toast`): dark-ink pill, white text, bottom-anchored above the nav (100px from bottom), slides up and fades in (`opacity`/`translateY(8px→0)` over 0.25s), auto-dismisses after ~1.8s. Used for: "Expense added", "Payment marked as completed" (and its detail line, e.g. "Putra paid Karina Rp65.000").
- **Row-level completion** (`.done-card` / a marked-paid `.debt-row`): the row's opacity drops to ~0.5 and its pill button becomes the filled "done" state (Section 8) — the row is not removed from view, it visibly settles in place.
- **All-Settled full state** (Section 15's layout, reused): a `--color-primary`-tinted circular checkmark (56px), heading **"All settled 🎉"**, supporting line **"No outstanding payments."** No confetti/animation beyond the emoji — keep it subtle.

---

## 17. Forms

- **Text input / textarea:** white surface, 1.5px `--color-border`, 13px radius, `padding: 13px 14px`, 14.5px text. Focus state: border color switches to `--color-primary` (no glow/shadow). Label sits above the field: 12.5px/600, muted color, 7px margin below.
- **Amount input:** visually distinct from normal fields — centered, 38px/800 text, no visible border, inside a bordered 20px-radius wrapper (`.amount-wrap`) with a small muted "Amount" caption above it. Must use a numeric-optimized keyboard.
- **Category selection:** pill-shaped chips in a wrapping row (`.cat-grid`), single-select, active chip fills solid `--color-primary` with white text; inactive chips are white/bordered. Not a dropdown, not a separate screen.
- **Member selection (split-between):** list of member rows, each with an avatar + name and a trailing checkbox (`.check`, 22×22px, 7px radius); checked state fills `--color-primary` with a white check glyph. Used identically for "who's joining" (no checkbox needed there, just a list) and "split between" (checkbox needed).
- **Filter tabs** (Expense List categories): pill-shaped, single-select, same active/inactive treatment as category chips, laid out in a horizontal row.
- **Touch targets:** every interactive control (chip, checkbox, row, pill button, icon button) should resolve to at least 44×44px of tappable area even where the visible glyph is smaller — pad the hit area rather than enlarging the visual element.
- **Error states:** not present in the prototype; when added, use the error color pair (`#B5502F` text / `#EAD3C8`-family border) on the affected field plus a short inline message — do not introduce a new error color.

---

## 18. Icons

Style: simple, single-color-or-emoji glyphs at small, consistent sizes — no icon font/SVG library is used in the prototype; category and navigation glyphs are rendered as emoji (🍜 ⛽ 🎟️ 🏕️ 🛒 📦 🏠 🧳 💰 🔔 👤) inside plain text/shape containers. This reads as lightweight and travel-flavored without needing an illustration system.

**Rule for implementation:** if emoji are replaced with an icon library for crispness/consistency across platforms, pick **one** icon set (simple/rounded/line-style, matching weight) and use it everywhere — never mix an icon font with emoji, or mix two icon libraries. Icon sizing follows the component it belongs to (19px nav icons, ~18–20px row/category icons, 15–16px glyphs inside 34–38px circular buttons).

---

## 19. Interaction Design

- **Buttons/cards:** tap only (no hover state is load-bearing — hover, where present on non-touch devices, is a subtle background/opacity shift, not a transform or shadow-lift).
- **Navigation:** switching bottom-nav tabs or drilling into a detail screen is an instant view swap (no page transition animation in the prototype); back navigation returns to the screen that opened the current one.
- **Category/member/tab selection:** immediate single-select toggle, no confirmation needed, visually updates instantly.
- **Add Expense:** live-recalculates the "split N ways — Rp{x} each" note as amount or member selection changes; submitting shows the toast and returns to Trip Detail immediately (no intermediate loading state needed at this data scale).
- **Mark as paid:** immediate, optimistic UI update (row dims, button fills solid, toast confirms) — no confirmation dialog, since this is a low-stakes bookkeeping action, not a real payment.
- **Delete expense:** should get a confirmation step before completing (per PRD) even though the static prototype doesn't render one — implement as a simple confirm dialog, not a full-screen interruption.
- **Animation:** the only animated interaction in the prototype is the toast's fade/slide (0.25s ease). Keep any additional motion (e.g., a row dimming on "mark as paid") equally short (~150–250ms) and purposeful. No bounce easing, no staggered list entrances, no auto-playing decorative motion.

---

## 20. Responsive Design

| Breakpoint | Range | Behavior |
|---|---|---|
| Mobile | 320–767px | Primary target. Full-width single column exactly as prototyped, 20px side padding. |
| Tablet | 768–1023px | Center the same single-column layout; cap content width at 480px; increase outer margin (background) rather than widening cards. Bottom nav stays fixed/full-width of the centered column, not the full viewport. |
| Desktop | 1024px+ | Same as tablet: centered ~480px column on the page background, mobile-style bottom nav preserved. Do **not** reflow into a sidebar/dashboard layout, do **not** introduce a desktop top nav, do **not** turn cards into a multi-column grid. |

The mobile visual hierarchy (hero card → quick actions → recent list, etc.) is preserved unchanged at every breakpoint; only the surrounding canvas widens.

---

## 21. Accessibility

- **Color contrast:** body text (`#26241F` on `#F7F4EE`/`#FFFFFF`) and muted text (`#8B8578` on the same backgrounds) must meet WCAG AA for their size; verify the accent (`#E5A445`) and error (`#B5502F`) tones meet AA when used as text, not only as backgrounds/tints.
- **Touch targets:** minimum ~44×44px for every interactive element (see Section 17).
- **Focus states:** all inputs, buttons, and chips must show a visible focus ring/outline for keyboard use, even though the primary target is touch — use the primary color for the focus indicator rather than a bespoke shadow/glow.
- **Semantics:** icon-only controls (bell, avatar, back, overflow "⋮") need accessible labels (e.g., "Notifications", "Profile", "Back", "More options"); category/nav icons rendered as emoji need an accompanying text label or `aria-label` since emoji alone are not reliably read by assistive tech.
- **Form labels:** every input keeps a visible, associated text label (already true in the prototype) — never placeholder-only labeling.
- **Non-color-only status:** already covered in Sections 13–14 — owe/receive/paid states must pair color with text/iconography, never rely on hue alone.
- **Keyboard navigation:** all tap targets (cards, chips, checkboxes, pill buttons) must also be reachable and operable via keyboard (`tab` + `enter`/`space`), which likely means implementing them as real `<button>`/`<input type="checkbox">` elements rather than bare `<div onclick>` as in the static prototype.

---

## 22. Component Inventory

Reusable components to implement (one definition each, reused everywhere the pattern repeats):

`Button` (primary/ghost/destructive variants) · `IconButton` · `PillButton` (with default/done states) · `FloatingAddButton` · `Card` (base) · `TripHeroCard` · `TripMiniCard` · `StatCard` · `BalanceHeroCard` (owe/receive variants) · `SettlementRow` · `ExpenseRow` · `MemberChip` (plain / with checkbox / with amount) · `Avatar` · `Badge` (upcoming/completed) · `CategoryChip` / `FilterTab` (same component, two contexts) · `TextInput` · `TextArea` · `AmountInput` · `BottomNav` · `Toast` · `EmptyState` · `SuccessState` (shared by all-settled and any future full-screen confirmations) · `ScreenHeader` (back button + title, or greeting + avatar/bell variant).

---

## 23. Screen-by-Screen Design Reference

### 1. Home
- **Purpose:** at-a-glance status of the current trip and recent spending.
- **Layout:** greeting header (name + subline, bell + avatar icon-buttons) → Current Trip hero card → "Quick actions" 4-up row → "Recent activity" divided row list.
- **Hierarchy:** trip hero card first and largest; Add Expense quick-action tile visually distinct (filled primary) from its three siblings.
- **Primary CTA:** Add Expense (quick action, filled).
- **Secondary actions:** Members / Settlement / Summary quick actions; "See all" link to Expense List; tapping trip card or any activity row navigates onward.
- **Navigation:** bottom nav "Home" active.
- **Empty variant:** no-active-trip empty state replaces the hero card only; rest of screen (quick actions minus trip-dependent ones, as applicable) still renders.

### 2. Trips
- **Purpose:** browse all trips by status.
- **Layout:** page heading "My Trips" + "+" icon button (top-right) → "Upcoming" section → "Active" section (when present) → "Past Trips" section, each a stack of Trip Mini Cards.
- **Hierarchy:** section order signals recency/relevance (upcoming/active before past); badge is the only per-card status differentiator.
- **Primary CTA:** "+" → Create Trip.
- **Secondary actions:** tap any trip card → Trip Detail.
- **Navigation:** bottom nav "Trips" active.
- **Empty variant:** whole-screen "No trips yet" empty state when zero trips exist.

### 3. Create Trip
- **Purpose:** capture minimum trip info fast.
- **Layout:** back + page heading → Trip name → Location → Start/End date (2-up row) → Notes (optional, textarea) → primary button.
- **Hierarchy:** flat form, no sectioning needed — short enough to scan as one block.
- **Primary CTA:** "Create Trip" → advances to Add Members.
- **Secondary actions:** back arrow returns to Trips.
- **Navigation:** modal-like forward flow, not a bottom-nav destination itself.

### 4. Add Members
- **Purpose:** define trip participants immediately after creation.
- **Layout:** back + page heading ("Add Travelers") → supporting line → list of Member Chips (avatar + name) → "+ Add member" (ghost button) → "Continue" (primary button).
- **Hierarchy:** member list is the visual center; both buttons stacked at bottom, ghost above primary.
- **Primary CTA:** "Continue" → Trip Detail.
- **Secondary actions:** "+ Add member" appends a chip.
- **Navigation:** forward flow from Create Trip.

### 5. Trip Detail
- **Purpose:** central hub for one trip.
- **Layout:** header (back, trip name, overflow "⋮") → muted meta line (icon, dates, traveler count) → 2-up Stat Card row (Total spending / Per person) → "Members" avatar row → "Recent Expenses" divided row list (+ "See all") → primary "+ Add Expense" button.
- **Hierarchy:** stat row is the strongest numeric moment on the screen after the page heading.
- **Primary CTA:** "+ Add Expense" (pre-fills this trip).
- **Secondary actions:** "See all" → Expense List; any expense row → Expense Detail; "⋮" → edit/delete trip (see PRD §18 ambiguity).
- **Navigation:** reached from Home hero card or a Trips card; back returns to whichever opened it.

### 6. Add Expense
- **Purpose:** record a cost in the fewest possible steps.
- **Layout:** back + page heading → "What did you spend on?" text input → large centered Amount Input card → Category chip grid → "Paid by" input → "Split between" member-chip-with-checkbox list → live share note → primary "Add Expense" button.
- **Hierarchy:** amount is the single largest element on the screen; everything else is equally-weighted supporting input.
- **Primary CTA:** "Add Expense" → toast + return to Trip Detail.
- **Secondary actions:** category/member selection is inline, no sub-navigation.
- **Navigation:** reached from bottom-nav "Add", Home quick action, or Trip Detail's primary button; back returns to whichever opened it (defaults to Home if opened from the nav).

### 7. Expense List
- **Purpose:** browse/filter all of a trip's expenses.
- **Layout:** back + page heading "Expenses" → filter Tab row (All/Food/Transport/Tickets/Accommodation/Other) → date-grouped section headings ("Today", "Yesterday", …) each followed by divided Expense Rows.
- **Hierarchy:** filter row sits directly under the heading; date groupings are section headings (15px/700), not cards.
- **Primary CTA:** none dedicated (Add Expense remains reachable via bottom nav).
- **Secondary actions:** tap filter tab to narrow list; tap row → Expense Detail.
- **Navigation:** reached from Trip Detail or Home "See all"; back returns to Trip Detail.
- **Empty variant:** "No expenses yet" empty state when the trip (or active filter) has none.

### 8. Expense Detail
- **Purpose:** full record + correction of one expense.
- **Layout:** back + page heading (expense name) → category caption → large amount → "Paid by" (single Member Chip) → "Split between" (Member Chip list, each with its share amount) → Edit / Delete button pair.
- **Hierarchy:** amount remains the largest number; split breakdown is a plain list, not re-emphasized.
- **Primary CTA:** none singular — Edit and Delete are equal-weight ghost buttons (Delete in error color).
- **Secondary actions:** none beyond the two buttons.
- **Navigation:** reached from any expense row; back returns to whichever list opened it.

### 9. Balance
- **Purpose:** "what's my financial position right now."
- **Layout:** header ("Balance", avatar icon) → "You owe" Balance Hero Card → its Settlement Rows (debt-to-others) → "You will receive" Balance Hero Card → its Settlement Rows (owed-by-others) → "View full settlement" primary button.
- **Hierarchy:** the two hero amounts are the dominant numbers on the screen; per-person rows are secondary but still bold on their amount.
- **Primary CTA:** "View full settlement" → Settlement screen.
- **Secondary actions:** "Mark as paid" per row.
- **Navigation:** bottom nav "Balance" active.
- **Empty/success variant:** when nothing is owed in either direction, replace both hero+list pairs with the All-Settled success state.

### 10. Settlement
- **Purpose:** the whole group's minimal payment plan, not just the current user's.
- **Layout:** back + page heading → one-line explanation of the total/per-person basis → "Payments to make" heading → stacked Settlement Rows ("{Payer} → {Recipient}", amount, "Mark as paid").
- **Hierarchy:** explanation line is muted/small — supporting context, not competing with the amounts below it.
- **Primary CTA:** none singular; each row's "Mark as paid" is a self-contained action.
- **Secondary actions:** none.
- **Navigation:** reached from Balance's "View full settlement" or Home's "Settlement" quick action; back returns to whichever opened it.
- **Success variant:** once every row is paid, replace the list with the All-Settled success state (Section 15/16).

### 11. Empty States
See Section 15 for the shared layout and the three concrete instances (no active trip, no trips, no expenses). Each is a full or partial screen replacement, never a separate route.

### 12. All Settled State
See Section 16. Rendered in place of the Balance screen's body and/or the Settlement screen's list once every obligation is paid; identical visual treatment in both locations for consistency.

---

## 24. Design Tokens (reference block)

```
/* Color */
--color-primary: #1F4D3B;
--color-primary-light: #EAF1EC;
--color-background: #F7F4EE;
--color-surface: #FFFFFF;
--color-text: #26241F;
--color-muted: #8B8578;
--color-accent: #E5A445;
--color-accent-light: #FBF0DD;
--color-border: #EDE8DD;
--color-warning-text: #8A5A15;
--color-error: #B5502F;
--color-error-bg: #FBEDE7;
--color-success: #1F4D3B;   /* reuses primary */
--color-success-bg: #EAF1EC; /* reuses primary-light */

/* Typography */
--font-family: 'Plus Jakarta Sans', sans-serif;
--text-display: 32px / 800 / -0.5px;
--text-page-heading: 22px / 700;
--text-section-heading: 15px / 700;
--text-card-heading: 21px / 700;
--text-body: 14.5px / 600;
--text-secondary: 13px / 400;
--text-caption: 11px–12px / 400–600;
--text-financial-sm: 14.5px / 700;
--text-financial-md: 20px / 700;
--text-button: 15px / 700;
--text-nav-label: 10.5px / 600;

/* Spacing */
--space-xs: 4px;
--space-sm: 8px;
--space-sm2: 12px;
--space-md: 16px;
--space-lg: 20px;
--space-xl: 24px;

/* Radius */
--radius-lg: 20px;
--radius-md: 16px;   /* 16–18px */
--radius-btn: 14px;
--radius-input: 13px;
--radius-sm: 12px;
--radius-xs: 7px;
--radius-pill: 100px;
--radius-round: 50%;

/* Shadow */
--shadow-fab: 0 6px 16px rgba(31,77,59,0.35);
/* no other component shadows */

/* Icon sizes */
--icon-nav: 19px;
--icon-fab: 22px;
--icon-btn-glyph: 15px–16px;
--icon-row: 18px–20px;

/* Component dimensions */
--button-height: ~48px (16px vertical padding + text);
--input-height: ~46px (13px vertical padding + text);
--icon-btn-size: 38px (34px for back button);
--avatar-size: 34px;
--fab-size: 46px;
--nav-height: ~70–76px (incl. safe-area inset);
```

---

## 25. Visual Consistency Rules

- Do not introduce a color outside Section 2's table.
- Do not introduce a radius outside Section 6's token set.
- Do not create a new button style per screen — every button maps to one of Section 8's six types.
- Do not use a second typeface or a bespoke font size outside Section 3's scale.
- Do not add box-shadows beyond the two named in Section 7.
- Do not add gradients anywhere.
- Do not add animation beyond the short, purposeful transitions named in Section 19.
- Do not redesign a screen in isolation — a change to a shared component (e.g., the row pattern) applies everywhere that component is used.
- Reuse the Component Inventory (Section 22) instead of writing one-off markup per screen.
- Preserve the prototype's visual identity — this document formalizes it, it does not amend it.

---

## Summary

**1. Visual system extracted:** A warm, restrained palette (forest green primary, warm off-white background, muted terracotta for "owe," green reused for "receive"), a single sans-serif type family (Plus Jakarta Sans) with a clear weight-driven hierarchy, a two-tier radius system (20px hero / 14–18px standard / pill for chips), and border-based (not shadow-based) elevation, with exactly one shadow reserved for the floating Add button.

**2. Components identified:** 20 reusable components spanning buttons, cards (7 variants), form controls, navigation, and status/feedback patterns (toast, empty state, success state) — catalogued in Section 22.

**3. Screens documented:** all 12 required screens (Home, Trips, Create Trip, Add Members, Trip Detail, Add Expense, Expense List, Expense Detail, Balance, Settlement, Empty States, All Settled), each with purpose, layout, hierarchy, primary/secondary actions, and navigation behavior (Section 23).

**4. Visual ambiguities found:**
- The prototype's screen/nav label reads "Wallet"; the current brief calls it "Balance." Documented as the same screen (Section 13/23.9), consistent with the note already raised in PRD.md.
- No visible error/validation state exists in the static prototype (forms have no invalid-state styling); Section 17 specifies a rule (reuse the error color pair) rather than inventing new visual treatment.
- No explicit desktop/tablet layout exists in the prototype (it's a fixed 390×844 mockup); Section 20's responsive rules are derived from the mobile-first principle rather than lifted directly from prototype CSS, since none exists for wider viewports.

**5. Location:** `/mnt/user-data/outputs/DESIGN.md`
