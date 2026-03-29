# Feedboard Brand Assets

Complete brand package for the Feedboard news/topic tracking app.

## Quick Start

1. Copy files to your project
2. Import `design-tokens.css` in your global styles
3. Update `tailwind.config.js` with the provided theme
4. Replace existing logo with Feedboard assets
5. Follow `STYLE-GUIDE.md` for component restyling

## Files

| File | Purpose |
|------|---------|
| `logo-primary.svg/png` | Main logo with underline |
| `logo-compact.svg/png` | Navbar logo (no underline) |
| `logo-dark.svg/png` | For dark backgrounds |
| `app-icon-*.png` | App store icons |
| `favicon.*` | Browser favicons |
| `design-tokens.css` | CSS custom properties |
| `tailwind.config.js` | Tailwind theme |
| `constants.ts` | TypeScript exports |
| `STYLE-GUIDE.md` | **Complete restyling instructions** |

## Brand Colors

| Name | Hex | Use |
|------|-----|-----|
| Primary (Cyan) | `#0891B2` | Accents, CTAs, active pills |
| Primary Hover | `#0E7490` | Hover states |
| Primary Light | `#22D3EE` | Dark mode accent |
| Accent Background | `#ECFEFF` | Selected/active backgrounds |
| Text Primary | `#1E293B` | Main body text |
| Text Secondary | `#64748B` | Muted text |
| Timestamp | `#94A3B8` | Time labels |
| Borders | `#E2E8F0` | Default borders |

## Key Components

### Topic Pills
- Active: Cyan `#0891B2` background, white text
- Inactive: Transparent, slate border
- Add: Dashed border, slate text

### News Cards
- White background
- Subtle border `#E2E8F0`
- Source icon + title + source link + timestamp
- Hover: Shadow + border color change

### Tabs
- Active: Cyan underline + cyan text
- Inactive: Slate text, no underline

## Logo Usage

```html
<!-- Header/Navbar -->
<img src="/logo-compact.svg" alt="Feedboard" height="32" />

<!-- Full logo with underline (marketing) -->
<img src="/logo-primary.svg" alt="Feedboard" height="48" />
```

## Favicon Setup

```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
```
