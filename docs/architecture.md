# Technical Architecture: The BrandForge Standard

BrandForge is built on the **"Modern Blueprint"** design philosophy—a high-density, professional aesthetic optimized for a 1:1 "Commander Console" experience.

---

## 🎨 Design Tokens (The Truth Layer)

All UI elements are driven by the CSS variables defined in [index.css](file:///c:/Users/user/Documents/GitHub/BrandForge_Ultimate-Branding-Suite-main/src/index.css).

### 1. The Zinc/Slate Color Scale
BrandForge uses a sophisticated custom neutral scale for professional depth.
- **Brand Primary**: Zinc 950 (`#0A0D12`) for high-contrast visibility.
- **Surface Scale**:
  - `brand-50`: `#FAFAFA` (Global Background)
  - `brand-100`: `#F5F5F5` (Card Gutters)
  - `brand-200`: `#E9EAEB` (Borders/Dividers)
  - `brand-500`: `#717680` (Secondary Text)
  - `brand-900`: `#181D27` (Primary Text)

### 2. Typography: Triple-Font Stack
- **Display (`Space Grotesk`)**: Used for Headers (`h1`, `h2`, `h3`). Technical, geometric, and distinct.
- **Sans (`Inter`)**: Used for Body, Buttons, and System UI. High legibility at all scales.
- **Mono (`JetBrains Mono`)**: Used for Metadata, Badge Labels, and Data Points.

### 3. Kinetic Spacing Tokens
The system uses a responsive spacing model that adapts between Mobile and Desktop.

| Token | Mobile | Desktop | Purpose |
| :--- | :--- | :--- | :--- |
| `space-gutter` | 16px | 32px | Global safety margins |
| `space-section` | 32px | 64px | Horizontal tool grouping |
| `space-gap` | 12px | 24px | Card & Grid spacing |
| `space-item` | 8px | 16px | Internal element spacing |

### 4. Component Standards
- **Radius Hierarchy**: 20px (Modal) > 16px (Section) > 12px (Card) > 8px (Control).
- **Button Variants**:
  - **Hero (`lg`)**: 44px height (AAA Accessibility).
  - **Standard (`md`)**: 40px height.
  - **Compact (`sm`)**: 36px height.
  - **Micro (`xs`)**: 32px height.

---

## 🏛️ Spatial Architecture

### The Global Frame
The platform environment comprises three core persistent layers:
1. **Sidebar Navigation**: Static on desktop, drawer-style on mobile. Fixed to `h-screen`.
2. **Notification Audit Center**: Real-time activity log with deep-linked navigation.
3. **Settings Console**: A 6-category configuration hub (Absolute state control).

### The "Zero-Scroll" Standard
- **Constraint**: All core branding tools (Discovery, Strategy, Logo, etc.) are optimized to be 100% scroll-free on a standard 1024px display.
- **Track**: The main content track is strictly **`max-w-screen-2xl` (1536px)** to prevent information dilution on ultrawide monitors.

---

## 🧠 Sequential Intelligence Pipeline (S.I.P)

BrandForge logic is governed by a **state-inheritance model**:
- **Persistence Foundation**: Local-first `localStorage` architecture (Bridgeable to Firestore).
- **Normalization Layer**: The "Data Healer" engine that repairs fragmented AI outputs.
- **State Flow**: `Discovery` → `Strategy` → `Visuals` → `Systems`. Each phase inherits the validated JSON of the previous phase.

---

*Copyright © 2026 TANATEQ INNOVATIONS LTD.*
