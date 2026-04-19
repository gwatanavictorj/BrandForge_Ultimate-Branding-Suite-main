# BrandForge Technical Architecture

This document outlines the core technical stack, data flow, and design standards of the BrandForge Branding Suite.

## Core Tech Stack

- **Frontend**: [React 19](https://react.dev/)
- **Build Tool**: [Vite 6](https://vitejs.dev/)
- **Server**: [Express](https://expressjs.com/) (serving as a local API proxy and static asset host)
- **Styling**: [TailwindCSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Animations**: [motion/react](https://www.framer.com/motion/) (Kinetic UI core)
- **AI Integration**: Sequential Intelligence Pipeline (S.I.P) utilizing Google Gemini (Nano Banana) and OpenAI DALL-E 3.

## Data Persistence & Storage

### Current State: Local Mock
To enable rapid prototyping and local-first development, BrandForge currently uses a **Mock Firebase** layer.
- **Location**: `src/firebase.ts`
- **Mechanism**: Persists data to the browser's `localStorage` under the `brandforge_` prefix.
- **Capabilities**: Simulates Auth (Google/Email), Firestore CRUD operations, and real-time storage event listeners.

### Target State: Production Firebase
The architecture is designed for a seamless transition to a live Google Cloud/Firebase environment:
- **Firestore**: For structured project and user data.
- **Firebase Auth**: For secure Google OAuth and email-based identity.
- **Firebase Hosting**: Primary production deployment target.

## Design System: "The Blueprint"

BrandForge adheres to a high-density, professional "Creative Suite" aesthetic known internally as the **Blueprint** standard.

### Spatial Tokens & Persistent Architecture
- **The Global Frame**: A persistent infrastructure layer comprising the Navigation Sidebar and real-time Notification Audit Center.
- **Global Track**: `max-w-screen-2xl` (1536px) for widescreen desktop precision.
- **Zero-Scroll Standard**: All core tools are optimized to be scroll-free on standard displays, ensuring a 1:1 "Commander Console" feel.

### Design Tokens & Token Hierarchy

The suite utilizes a strict token-based hierarchy designed for high-density information display and tactical legibility.

#### **Spatial & Radius Tokens**
| Element | Mobile (Default) | Desktop (md+) |
| :--- | :--- | :--- |
| **Modal Radius** | 14px | 20px |
| **Section Radius** | 12px | 16px |
| **Card Radius** | 8px | 12px |
| **Control Radius** | 6px | 8px |

#### **Color Palette (Brand Core)**
The palette utilizes the **Slate** and **Brand (Zinc)** scales for a neutral, professional environment that ensures brand colors (in the strategy phase) remain the hero elements.
- **Brand Neutral**: `--color-brand-50` (#FAFAFA) through `--color-brand-950` (#0A0D12).
- **Primary Action**: `brand-600` (Core) / `brand-700` (Hover).
- **Backgrounds**: `slate-50` (Platform) / `white` (Canvas/Cards).
- **Feedback**: `slate-500` (Labels) / `slate-900` (Headings).

#### **Typography System**
BrandForge uses a triple-font stack to differentiate between **Instruction**, **Action**, and **Data**.
- **Display (Space Grotesk)**: High-character headings and brand anchors.
- **Sans (Inter)**: Platform navigation, body text, and complex data forms.
- **Mono (JetBrains Mono)**: Intelligence logs, strategist notes, and mathematical outputs (Pd scores).

| Style | Tokens | Use Case |
| :--- | :--- | :--- |
| **H1** | `2xl` / `5xl` bold | Hero section headers |
| **H2** | `xl` / `3xl` bold | Tool/Module headers |
| **Body** | `sm` / `base` | General platform text |
| **Label** | `10px` / `12px` bold uppercase | Form labels / Metadata labels |
| **Label XS** | `9px` black uppercase | Visual density badges / Tagging |

### Component Patterns

#### **Buttons**
- **Variants**: 
    - `Primary`: Solid `brand-600`, focused action.
    - `Secondary`: Outlined `brand-200`, supporting actions.
    - `Ghost`: Transparent, low-priority navigation.
- **Micro-Interactions**: `active:scale-[0.98]` and `transition-all` enforced on all interactive elements.

#### **Cards & Containers**
- **Blueprint Card**: `bg-white`, `border-slate-100`, `shadow-sm`.
- **Strategy Glass**: `.glass` utility (bg-white/80, 20px blur) for overlaying strategic data on visual canvases.
- **Hover State**: Cards transition to `shadow-md` and `border-brand-100` on interactive hover.

#### **Spacing System (Kinetic Standard)**
| Token | Mobile | Desktop | Use Case |
| :--- | :--- | :--- | :--- |
| **Gutter** | 16px | 32px | Page edge padding |
| **Section** | 32px | 64px | Vertical module spacing |
| **Gap** | 12px | 24px | Grid/Flex item spacing |
| **Item** | 8px | 16px | Internal component spacing |

## Sequential Intelligence Pipeline (S.I.P)
The heart of BrandForge is the **S.I.P Methodology** (`src/services/brandService.ts`). It follows a strict 7-phase state-aware journey where each phase consumes the validated output of the previous one.

### The 8-Model Strategy Stack
Strategic synthesis is governed by the **8-Model Strategy Stack**, a high-fidelity intelligence layer that ensures absolute psychological and market alignment.

1.  **Carl Jung Archetypal Model:** Determines the psychological soul using a 3-tier matrix (Soul, Behavior, Industry Baseline).
2.  **Maslow’s Hierarchy of Needs:** Tethers value to human motivation (e.g., *Survival* to *Self-Actualization*).
3.  **Perceptual Positioning Model:** Cartesian mapping ($X/Y$) used to identify "Blue Ocean" market gaps.
4.  **Competitor Intelligence Synthesis:** Real-time, location-aware research feeding a tactical **SWOT** (Strengths, Weaknesses, Opportunities, Threats) matrix.
5.  **CDTS Narrative Framework:** Sequential brand storytelling: **C (Context)**, **D (Demand)**, **T (Tension)**, **S (Solution)**.
6.  **Propositional Density (Pd) Model:** Mathematical audit of symbolic efficiency. Ratio of **Semantic Meaning (Ps)** to **Visual Elements (Pv)**.
7.  **Signal-to-Font Mapping:** Deterministic alignment of brand traits to typographic categories.
8.  **Strategic Core Values Mapping:** Normalization of subjective values against industry-standard benchmarks.

### S.I.P Phase Progression
1.  **Identity**: Authentication and professional lens establishment.
2.  **Genesis (Discovery)**: Extraction of "Truth Signals" from raw intake data.
3.  **Synthesis (Strategy)**: Hydration of the 8-Model Stack using the **Data Healer** middleware.
4.  **Enrichment (Competitive Lab)**: Automated competitive research and SWOT alignment.
5.  **Visualization (Logo Strategy)**: Noun synthesis and Pd-scored concept smushing.
6.  **Standardization (Brand System)**: Algorithmic color/type harmonization.
7.  **Export (PDF Hub)**: High-fidelity generation with 1:1 UI visual parity.
