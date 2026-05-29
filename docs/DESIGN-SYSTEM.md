# Telehealth Design System

> Built on shadcn/ui with Tailwind CSS v4 and OKLCH color tokens.

---

## Color Tokens

### Standard shadcn Tokens

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `background` | `oklch(1 0 0)` | `oklch(0.145 0 0)` | Page background |
| `foreground` | `oklch(0.145 0 0)` | `oklch(0.985 0 0)` | Primary text |
| `card` | `oklch(1 0 0)` | `oklch(0.205 0 0)` | Card background |
| `primary` | `oklch(0.55 0.12 210)` | `oklch(0.73 0.12 195)` | Brand teal/blue |
| `secondary` | `oklch(0.97 0 0)` | `oklch(0.269 0 0)` | Secondary actions |
| `muted` | `oklch(0.97 0 0)` | `oklch(0.269 0 0)` | Subtle backgrounds |
| `accent` | `oklch(0.97 0 0)` | `oklch(0.269 0 0)` | Hover states |
| `destructive` | `oklch(0.577 0.245 27.325)` | `oklch(0.704 0.191 22.216)` | Errors, danger |
| `border` | `oklch(0.922 0 0)` | `oklch(1 0 0 / 10%)` | Borders |
| `input` | `oklch(0.922 0 0)` | `oklch(1 0 0 / 15%)` | Input borders |
| `ring` | `oklch(0.55 0.12 210)` | `oklch(0.73 0.12 195)` | Focus rings |

### Custom Semantic Tokens

| Token | Light Mode | Dark Mode | Tailwind Class | Usage |
|-------|------------|-----------|----------------|-------|
| `warning` | `oklch(0.75 0.15 85)` | `oklch(0.80 0.15 85)` | `bg-warning`, `text-warning` | Pending, caution |
| `success` | `oklch(0.65 0.15 145)` | `oklch(0.70 0.15 145)` | `bg-success`, `text-success` | Available, confirmed |
| `info` | `oklch(0.65 0.15 230)` | `oklch(0.70 0.15 230)` | `bg-info`, `text-info` | Informational |

### Chart Tokens

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `chart-1` | `oklch(0.55 0.12 210)` | `oklch(0.73 0.12 195)` | Primary chart color (brand) |
| `chart-2` | `oklch(0.65 0.15 145)` | `oklch(0.70 0.15 145)` | Success/health metrics |
| `chart-3` | `oklch(0.65 0.15 230)` | `oklch(0.70 0.15 230)` | Info/secondary data |
| `chart-4` | `oklch(0.75 0.15 85)` | `oklch(0.80 0.15 85)` | Warning/alerts |
| `chart-5` | `oklch(0.55 0.12 270)` | `oklch(0.65 0.12 270)` | Accent/purple |

---

## Status Color Mapping

Use these consistently across the app:

| Status | Token | Tailwind |
|--------|-------|----------|
| Available / Online | `success` | `bg-success`, `text-success` |
| Pending / Waiting | `warning` | `bg-warning`, `text-warning` |
| Confirmed / Active | `primary` | `bg-primary`, `text-primary` |
| Completed / Done | `success` | `bg-success`, `text-success` |
| Cancelled / Error | `destructive` | `bg-destructive`, `text-destructive` |
| In Progress | `info` | `bg-info`, `text-info` |
| Urgent | `destructive` | `bg-destructive`, `text-destructive` |

---

## Usage Examples

```tsx
// Status badge
<Badge className="bg-success/10 text-success border-success/20">
  Confirmed
</Badge>

// Warning alert
<div className="bg-warning/10 border-warning/20 text-warning">
  Appointment pending
</Badge>

// Error state
<div className="bg-destructive/10 border-destructive/20 text-destructive">
  Failed to load
</div>

// Chart with themed colors
const chartConfig = {
  weight: { label: "Weight", color: "var(--chart-2)" },
  systolic: { label: "Systolic", color: "var(--chart-1)" },
  diastolic: { label: "Diastolic", color: "var(--chart-3)" },
} satisfies ChartConfig

// Using in Recharts
<Line stroke="var(--chart-1)" />
<Bar fill="var(--chart-2)" />
```

---

## How to Add New Tokens

Follow the shadcn pattern:

```css
/* 1. Define in :root */
:root {
  --my-token: oklch(0.65 0.15 195);
  --my-token-foreground: oklch(0.15 0.03 195);
}

/* 2. Define dark mode variant */
.dark {
  --my-token: oklch(0.73 0.12 195);
  --my-token-foreground: oklch(0.15 0.03 195);
}

/* 3. Expose to Tailwind */
@theme inline {
  --color-my-token: var(--my-token);
  --color-my-token-foreground: var(--my-token-foreground);
}
```

Then use: `bg-my-token`, `text-my-token-foreground`

---

*Last updated: 2026-05-29*
