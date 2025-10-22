# AI Development Rules for DANFE Manager

This document outlines the core technologies and specific library usage rules to ensure consistency, maintainability, and adherence to best practices within the project.

## 1. Tech Stack Overview

*   **Frontend Framework:** React (using Vite for tooling).
*   **Language:** TypeScript for strong typing and improved code quality.
*   **Styling:** Tailwind CSS for utility-first styling and responsive design.
*   **UI Components:** shadcn/ui (built on Radix UI primitives) for all user interface elements.
*   **Routing:** React Router DOM for client-side navigation.
*   **Data Management:** React Query (`@tanstack/react-query`) for server state management and caching.
*   **Backend & Database:** Supabase (`@supabase/supabase-js`) for authentication, database, and storage.
*   **Forms & Validation:** React Hook Form combined with Zod for schema validation.
*   **Icons:** Lucide React.
*   **Notifications:** Sonner (for modern toasts) and shadcn/ui Toast (for traditional notifications).

## 2. Library Usage Guidelines

To maintain a simple and elegant codebase, adhere to the following rules:

| Feature | Mandatory Library | Notes |
| :--- | :--- | :--- |
| **UI Components** | shadcn/ui | Use existing components from `src/components/ui/`. If a new component is needed, create it in `src/components/` and style it with Tailwind. |
| **Styling** | Tailwind CSS | All styling must be done using Tailwind utility classes. Ensure all designs are responsive. |
| **Icons** | Lucide React | Use icons imported from `lucide-react`. |
| **Routing** | React Router DOM | All routes must be defined in `src/App.tsx`. |
| **Backend/Auth/DB** | Supabase | Use the client defined in `src/integrations/supabase/client.ts` for all data operations and authentication. |
| **Forms** | React Hook Form + Zod | Use `react-hook-form` for form state and `zod` for validation schemas. |
| **Notifications** | Sonner | Use the `Sonner` component (imported as `Sonner` in `App.tsx`) for user feedback toasts. |
| **File Structure** | Standardized | Components in `src/components/`, pages in `src/pages/`, hooks in `src/hooks/`. |

**Important:** Do not introduce new third-party libraries unless absolutely necessary and approved. Prioritize using the existing stack.