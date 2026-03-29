# Feedboard Style Guide & Refactoring Instructions

## Overview

This document provides complete instructions for styling the Feedboard application — a news/topic tracking dashboard.

**Brand Name:** Feedboard
**Primary Color:** Cyan `#0891B2`
**Text Color:** Slate `#1E293B`
**Background:** White `#FFFFFF` with subtle slate tints

---

## 🚨 CRITICAL: Colors to REMOVE/REPLACE

### Kill List:
- **Generic AI blue** (`#3B82F6`, `#2563EB`) — Replace with cyan `#0891B2`
- **Any purple/violet colors** — REMOVE COMPLETELY
- **Random accent colors** — Standardize to cyan palette

### Search and Replace:
```
#3B82F6 → #0891B2 (primary cyan)
#2563EB → #0E7490 (darker cyan)
#60A5FA → #22D3EE (lighter cyan)
#1D4ED8 → #0E7490
```

---

## ✅ Color System

### Primary Palette (Cyan)
Use for: Active states, CTAs, links, selected pills, accent elements

| Token | Hex | Usage |
|-------|-----|-------|
| `primary-50` | `#ECFEFF` | Subtle backgrounds, hover states |
| `primary-100` | `#CFFAFE` | Selected backgrounds |
| `primary-200` | `#A5F3FC` | Focus rings |
| `primary-400` | `#22D3EE` | Light accent (dark mode) |
| `primary-500` | `#06B6D4` | Secondary accent |
| `primary-600` | `#0891B2` | **Main brand color** - buttons, active pills, links |
| `primary-700` | `#0E7490` | Hover states, app icon background |
| `primary-800` | `#155E75` | Active/pressed states |

### Neutral Palette (Slate)
Use for: Text, backgrounds, borders, inactive states

| Token | Hex | Usage |
|-------|-----|-------|
| `slate-50` | `#F8FAFC` | Page background |
| `slate-100` | `#F1F5F9` | Card backgrounds, surface |
| `slate-200` | `#E2E8F0` | Borders, dividers |
| `slate-300` | `#CBD5E1` | Stronger borders, inactive pills |
| `slate-400` | `#94A3B8` | Placeholder text, timestamps |
| `slate-500` | `#64748B` | Secondary text |
| `slate-600` | `#475569` | Body text |
| `slate-700` | `#334155` | Labels |
| `slate-800` | `#1E293B` | **Primary text color**, headings |
| `slate-900` | `#0F172A` | Extra dark headings |

### Semantic Colors (Use ONLY for their intended purpose)

| Color | Hex | Usage |
|-------|-----|-------|
| Success | `#22C55E` | Success states only |
| Warning | `#F59E0B` | Warnings only |
| Error | `#EF4444` | Errors only |

---

## 🎨 Component Styling Rules

### Topic Pills/Tags

**Inactive Pill**
```css
background: transparent;
border: 1px solid #E2E8F0;
color: #475569;
border-radius: 9999px;
padding: 8px 16px;
font-weight: 500;
```
Hover: `border-color: #CBD5E1; background: #F8FAFC;`

**Active/Selected Pill**
```css
background: #0891B2;
color: white;
border-radius: 9999px;
padding: 8px 16px;
font-weight: 500;
```

**Add Topic Pill**
```css
background: transparent;
border: 1px dashed #CBD5E1;
color: #64748B;
border-radius: 9999px;
```
Hover: `border-color: #0891B2; color: #0891B2;`

### News Cards

**Standard Card**
```css
background: white;
border: 1px solid #E2E8F0;
border-radius: 12px;
padding: 16px;
```
Hover: `border-color: #CBD5E1; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);`

**Card Layout**
```
[Source Icon 40x40] [Title + Source + Time]
```

**Source Icon Container**
```css
width: 40px;
height: 40px;
border-radius: 8px;
background: #F1F5F9;
display: flex;
align-items: center;
justify-content: center;
```

### Tabs (News / Reddit)

**Tab Container**
```css
display: flex;
gap: 4px;
border-bottom: 1px solid #E2E8F0;
```

**Inactive Tab**
```css
padding: 8px 16px;
color: #64748B;
font-weight: 500;
border-bottom: 2px solid transparent;
```
Hover: `color: #1E293B;`

**Active Tab**
```css
padding: 8px 16px;
color: #0891B2;
font-weight: 500;
border-bottom: 2px solid #0891B2;
```

### Buttons

**Primary Button (Refresh)**
```css
background: #0891B2;
color: white;
border-radius: 8px;
padding: 8px 16px;
font-weight: 500;
display: flex;
align-items: center;
gap: 8px;
```
Hover: `background: #0E7490;`

**Icon Button (Dark Mode Toggle)**
```css
background: transparent;
color: #64748B;
padding: 8px;
border-radius: 8px;
```
Hover: `background: #F1F5F9; color: #1E293B;`

### Navigation Header

**Header Container**
```css
display: flex;
align-items: center;
justify-content: space-between;
padding: 16px 24px;
background: white;
border-bottom: 1px solid #E2E8F0;
```

**Logo**
- Use `logo-compact.svg` in header
- "Feed" in `#1E293B`, "board" in `#0891B2`

---

## 📐 Typography

### Font Stack
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

### Text Hierarchy

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| App Title | 20px | 600 | `#1E293B` + `#0891B2` |
| Section Label | 14px | 500 | `#64748B` |
| Card Title | 16px | 500 | `#1E293B` |
| Source Name | 14px | 500 | `#0891B2` |
| Timestamp | 14px | 400 | `#94A3B8` |
| Body Text | 14px | 400 | `#475569` |

---

## 🔧 Specific UI Fixes

### Header
1. Replace "Data-Tracker" text with Feedboard logo
2. Keep Refresh button → style with cyan `#0891B2`
3. Dark mode toggle → keep as icon button

### Topic Pills Row
1. "+ Add Topic" pill → dashed border style
2. Active topic pill → solid cyan background
3. Inactive pills → slate border, no background

### Tabs (News / Reddit)
1. Active tab → cyan underline + cyan text
2. Inactive tab → slate text, no underline

### News Cards
1. Clean card design with source icon
2. Title → slate-800 `#1E293B`
3. Source link → cyan `#0891B2`
4. Timestamp → slate-400 `#94A3B8`
5. Hover → subtle shadow + border color change

---

## 📁 Files Included

```
feedboard-brand/
├── logo-primary.svg        # Main logo with underline
├── logo-primary.png
├── logo-compact.svg        # Logo for navbar (no underline)
├── logo-compact.png
├── logo-dark.svg           # For dark backgrounds
├── logo-dark.png
├── app-icon.svg            # App icon
├── app-icon-512.png        # Google Play / web
├── app-icon-192.png        # Android PWA
├── apple-touch-icon.png    # iOS
├── favicon.svg
├── favicon-32.png
├── favicon-16.png
├── design-tokens.css       # CSS custom properties
├── tailwind.config.js      # Tailwind theme extension
├── constants.ts            # TypeScript exports
└── STYLE-GUIDE.md          # This file
```

---

## ✅ Implementation Checklist

- [ ] Update Tailwind config with cyan color palette
- [ ] Replace header text with Feedboard logo-compact
- [ ] Set favicon to new Feedboard favicon
- [ ] Update topic pills to new pill styles
- [ ] Update tabs to cyan active state
- [ ] Update Refresh button to cyan
- [ ] Update all links/accents to cyan
- [ ] Update focus rings to cyan
- [ ] Verify dark mode toggle still works
- [ ] Test all hover/active states

---

## 🎯 Design Principles

1. **Cyan is the hero** — Single accent color for all interactive elements
2. **Clean card design** — Source icons, clear hierarchy
3. **Pill-based filtering** — Rounded pills for topics
4. **Minimal borders** — Use sparingly, slate-200 default
5. **Subtle hover states** — Shadow + border color change

---

## Quick Reference

| Purpose | Color |
|---------|-------|
| Primary accent | `#0891B2` |
| Primary hover | `#0E7490` |
| Accent background | `#ECFEFF` |
| Active pill | `#0891B2` (bg) + white (text) |
| Main text | `#1E293B` |
| Secondary text | `#64748B` |
| Timestamp | `#94A3B8` |
| Borders | `#E2E8F0` |
| Page background | `#F8FAFC` |

---

## Dark Mode

When dark mode is active:

| Element | Light | Dark |
|---------|-------|------|
| Page bg | `#F8FAFC` | `#020617` |
| Card bg | `#FFFFFF` | `#0F172A` |
| Text | `#1E293B` | `#F1F5F9` |
| Borders | `#E2E8F0` | `#334155` |
| Accent | `#0891B2` | `#22D3EE` |
