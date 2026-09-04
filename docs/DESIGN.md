---
name: Modern Enterprise Travel ERP
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#5c3f40'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#906f70'
  outline-variant: '#e5bdbe'
  surface-tint: '#be0037'
  primary: '#b80035'
  on-primary: '#ffffff'
  primary-container: '#e11d48'
  on-primary-container: '#fffaf9'
  inverse-primary: '#ffb3b6'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#006847'
  on-tertiary: '#ffffff'
  tertiary-container: '#00845a'
  on-tertiary-container: '#eefff3'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdada'
  primary-fixed-dim: '#ffb3b6'
  on-primary-fixed: '#40000c'
  on-primary-fixed-variant: '#920028'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.025em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  title-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.02em
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-lg: 1.5rem
  margin: 1rem
  margin-md: 1.5rem
  margin-lg: 2rem
  space-xxs: 0.125rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
  space-2xl: 2rem
---

## Brand & Style

This design system targets high-velocity travel management operations, tour operators, and corporate travel desks managing complex booking manifests, inventory allocations, and corporate billing. The visual atmosphere balances high-density information architecture with decisive operational clarity. 

The aesthetic is **Corporate / Modern High-Density SaaS**: clean, structured, and unapologetically engineered for high productivity. Rather than decorative excess, visual differentiation is achieved through surgical typographic contrast, razor-sharp geometric borders, disciplined monochromatic structural zones, and an assertive crimson accent that drives critical workflows, inventory alerts, and primary booking operations.

Users should experience immediate feelings of control, precision, and financial reliability. Dense multi-leg itineraries, passenger manifests, and complex invoice reconciliation surfaces remain crisp and scannable over long work shifts.

## Colors

The palette uses high-contrast functional color allocation tailored for enterprise travel logistics:

- **Primary (`#E11D48` Crimson):** Reserved strictly for high-priority interactive workflows, primary confirmations, active navigational indicators, and primary conversion triggers. Tonal variations include `#BE123C` for pressed/hover states and `#FFE4E6` for interactive soft states.
- **Secondary (`#0F172A` Deep Slate):** Anchors deep structural hierarchy. Applied to the executive sidebar navigation, primary header typography, and active tab indicators. Tonal slate scales include `#1E293B` (sidebar elevation / elevated containers), `#334155` (secondary typography), and `#F1F5F9` to `#F8FAFC` (canvas grounding).
- **Functional Semantics:**
  - **Confirmed / Paid / Ticketed (`#10B981` Emerald):** Denotes finalized financial settlements, confirmed PNRs, and active voucher statuses. Paired with `#ECFDF5` background tints.
  - **Pending / In-Review (`#F59E0B` Amber):** Flags ticketing deadlines, quotation expirations, and unassigned inventory. Paired with `#FFFBEB` background tints.
  - **Critical / Void / Cancelled (`#DC2626` Rose Red):** Discrepancies, failed payment gateways, and cancelled segments.
- **Structural Lines (`#E2E8F0`):** Precise 1px borders providing structure without adding visual heaviness to dense data grids.

## Typography

Typographic scale is tuned for enterprise screen efficiency and scannability. **Plus Jakarta Sans** provides geometric legibility with modern humanist proportions, preventing visual fatigue during intensive data operations.

- **Tabular Figures & Monospace:** All numerical amounts, PNR record locators, flight codes (e.g., `BA-2490`), and currency figures must utilize tabular lining numbers (`font-variant-numeric: tabular-nums`) or `JetBrains Mono` for exact vertical alignment across multi-row tables.
- **Hierarchy Rules:** Section headlines use tighter negative tracking (`-0.02em`) to anchor dashboards. Table column headers and status indicators utilize `label-sm` with slight positive tracking (`0.02em`) and upper-case casing for rapid visual scanning across dense grid columns.

## Layout & Spacing

The layout is built on a **Fluid Master-Detail Grid** tailored for wide desktop viewports (1440px+):

- **Executive Navigation Shell:** Fixed 260px left sidebar for high-level module switching (Bookings, Accounts, Inventory, Invoices, Analytics). Collapsible to an 72px icon-only state for operators working on laptops.
- **Canvas Model:** 
  - Desktop: Multi-column responsive layout with 16px/24px gutters and a 12-column dynamic flex container. Tables and manifest grids stretch to 100% available canvas width.
  - Tablet/Laptop (1024px–1439px): Sidebar defaults to collapsed (72px) with horizontal top filters and a sliding drawer pattern for secondary detail panes.
  - Mobile (under 768px): Operational emergency mode; transforms into a single-column layout prioritizing critical passenger lookup, flight delay logs, and quick contact cards.
- **Compact Spacing Rhythm:** Built around a strict 4px baseline. Form fields and table cells prioritize compact vertical padding (`space-sm` at 8px) to maximize above-the-fold record density without sacrificing touch or click precision.

## Elevation & Depth

This design system uses a **structural low-contrast outline and tonal layering model** rather than heavy drop shadows:

- **Flat Precision:** Surfaces are distinguished primarily by crisp `#E2E8F0` hairline borders and distinct background fills (`#FFFFFF` on `#F8FAFC` base).
- **Layering & Depth Levels:**
  - **Level 0 (Canvas Base):** Ground background tinted with `#F8FAFC`.
  - **Level 1 (Card & Module Layer):** Pure `#FFFFFF` panels bounded by a 1px `#E2E8F0` border. Zero shadow in neutral state; subtle ambient elevation on active hover (`0 2px 4px -1px rgba(15, 23, 42, 0.04)`).
  - **Level 2 (Dropdowns & Popovers):** Elevated surface with crisp outline and focused edge shadow: `0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -2px rgba(15, 23, 42, 0.04)`.
  - **Level 3 (Slide-over Detail Drawers & Modals):** Deep scrim overlay (`rgba(15, 23, 42, 0.45)`) combined with elevated container shadow (`0 20px 25px -5px rgba(15, 23, 42, 0.12)`).

## Shapes

The design system employs **Soft (`1`) geometric profiles**:
- Standard UI elements (inputs, data table action buttons, badge chips) utilize a tight `0.25rem` (4px) or `0.375rem` (6px) radius.
- Cards, KPI modular tiles, and modal shells use `rounded-lg` (`0.5rem` / 8px).
- Avoid circular pill buttons for operational controls. Pills are reserved exclusively for status badges and passenger count tags to visually isolate metadata from interactive controls.

## Components

### Buttons
- **Primary:** Background `#E11D48`, text `#FFFFFF`, border-radius 6px, font-weight 600. On hover: `#BE123C`. Focus: 2px offset ring with `#E11D48`.
- **Secondary / Neutral:** Background `#FFFFFF`, text `#0F172A`, 1px border `#E2E8F0`. On hover: `#F1F5F9`.
- **Destructive:** Background `#FEE2E2`, text `#DC2626`, 1px border `#FECACA`.

### Data Tables (Core ERP Pattern)
- **Header:** Background `#F8FAFC`, uppercase `label-sm` typography in `#64748B`, 1px bottom border `#E2E8F0`. Height fixed at 36px.
- **Row:** Height 44px (standard) or 36px (compact view). Alternating row striping is omitted in favor of `#F8FAFC` hover highlighting. Cell divider: 1px `#F1F5F9`.
- **Actions Cell:** Fixed right-aligned pinned column with contextual inline icon-actions (View PNR, Issue Ticket, Print Voucher).

### KPI Summary Cards
- Surface `#FFFFFF`, 1px border `#E2E8F0`, padding `1.25rem`.
- Contains: Micro category label (`label-sm`, `#64748B`), large primary metric (`headline-lg`, tabular numbers, `#0F172A`), and an inline trend badge (`+12.4%` in `#10B981` / `#ECFDF5`).

### Status Badges
- Semi-rounded pill geometry (`rounded-full`), height 22px, padding 2px 8px, font size 11px, weight 600.
- **Confirmed/Paid:** Text `#065F46`, background `#D1FAE5`, border `#A7F3D0`.
- **Pending/Hold:** Text `#92400E`, background `#FEF3C7`, border `#FDE68A`.
- **Cancelled/Void:** Text `#991B1B`, background `#FEE2E2`, border `#FECACA`.

### Input Fields & Selects
- Height: 36px (high-density compact). Background `#FFFFFF`, border 1px `#CBD5E1`, text `#0F172A`. Placeholder text `#94A3B8`.
- Focus state: Border color `#E11D48` accompanied by a 1px crimson ring.
- Integrated search inputs include leading travel-specific icons (airplane, bed, calendar, locator).

### Itinerary Segment Cards
- Segment blocks featuring horizontal flight leg connectors with departure, transit layover nodes, and arrival markers rendered using `#64748B` hairline paths and `#E11D48` terminal nodes.