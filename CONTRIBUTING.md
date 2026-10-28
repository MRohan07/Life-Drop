# Contributing to LifeDrop

Thank you for contributing to the **LifeDrop** Blood Donation & Emergency Coordination Platform.

---

## 📁 Project Structure

```text
src/
├── assets/
│   ├── icons/
│   ├── images/
│   └── fonts/
├── components/
│   ├── ui/          # Atomic reusable UI components (Button, Input, Card, Modal)
│   └── shared/      # Global shared layout components (Navbar, Footer, Sidebar)
├── modules/         # Feature modules (home, auth, dashboard)
├── hooks/           # Global custom hooks
├── utils/           # Helper functions and algorithms
├── types/           # Global TypeScript definitions
├── routes/          # Route definitions with lazy loading & Suspense
├── styles/          # Global Tailwind and design system CSS
└── App.tsx          # Root application component
```

---

## 🧩 How to Add a New UI Component

Follow the exact **3-file component pattern**:

```text
src/components/ui/Badge/
├── Badge.tsx         # UI markup & Tailwind styling only
├── Badge.types.ts    # TypeScript interfaces & props definitions
└── index.ts          # Exactly 1-line re-export: export * from './Badge';
```

### 1. `Badge.types.ts`
```typescript
/* @module: Badge.types — Type definitions for Badge component */
export interface BadgeProps {
  label: string;
  variant?: 'emergency' | 'success' | 'warning';
}
```

### 2. `Badge.tsx`
```typescript
/* @module: Badge — Reusable UI badge component */
import React from 'react';
import { BadgeProps } from './Badge.types';

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'success' }) => {
  return <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${variant === 'emergency' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>{label}</span>;
};
```

### 3. `index.ts`
```typescript
export * from './Badge';
```

---

## 📦 How to Add a New Module

Follow the **module pattern** (e.g. `src/modules/campaigns/`):

```text
src/modules/campaigns/
├── components/       # Module-specific UI components
├── hooks/            # Module-specific custom hooks & business logic
├── CampaignsPage.tsx # Page-level component (default + named export)
└── index.ts          # Cleanly exports components, hooks, and default page
```

---

## 📐 Coding & Quality Rules

1. **Module Header**: Every single file must start with:
   ```typescript
   /* @module: FileName — brief description of purpose */
   ```
2. **File Size Limit**: Maximum **100 lines per file**. If a file grows larger, split it into sub-components, custom hooks, or utility helpers.
3. **Exports**: Use **named exports** everywhere. Only page-level route components may include a default export for `React.lazy()` compatibility.
4. **Tailwind CSS Only**: Use Tailwind CSS utility classes. Avoid inline styles or separate CSS files per component.
5. **Code Quality**: Keep TypeScript strict and error-free (`npx tsc --noEmit`).

---

## 💬 Git Commit Message Convention

Format: `type(module): message`

### Types:
* `feat`: A new user-facing feature
* `fix`: A bug fix
* `refactor`: Code restructuring without functional change
* `style`: Styling and aesthetic improvements
* `docs`: Documentation updates

### Examples:
```bash
feat(auth): add login form
fix(ui): button hover state
feat(dashboard): add live emergency radar
refactor(shared): streamline navbar branding
```
