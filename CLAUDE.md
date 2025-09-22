# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server on http://localhost:3000
- `npm run build` - Build the application for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint to check code quality

## Project Architecture

This is a **Budget Explorer** application - an AI-powered government budget analysis tool built with Next.js 14 using the App Router. The application helps users (students, journalists, citizens) upload and analyze government budget documents.

### Key Architecture Components

**Frontend Framework**: Next.js 14 with App Router, TypeScript, React 19
**UI Framework**: shadcn/ui components with Radix UI primitives
**Styling**: Tailwind CSS with CSS variables for theming
**Charts**: Recharts for data visualization
**Forms**: React Hook Form with Zod validation

### App Structure

The app uses Next.js App Router with these main routes:
- `/` - Home page with upload interface
- `/dashboard` - Budget analysis dashboard
- `/compare` - Budget comparison interface

### Component Organization

**Core Components** (in `/components/`):
- `upload-interface.tsx` - File upload and processing
- `budget-charts.tsx` - Budget visualization charts
- `chat-interface.tsx` - AI chat for budget analysis
- `comparison-interface.tsx` - Budget comparison tools
- `comparison-charts.tsx` - Comparison visualizations
- `conversation-sidebar.tsx` - Chat history sidebar
- `document-info-sidebar.tsx` - Document metadata sidebar
- `header.tsx` - Main navigation header

**UI Components** (in `/components/ui/`): shadcn/ui components

### Design System

The app uses a comprehensive design system via shadcn/ui:
- CSS variables for theming (in `app/globals.css`)
- Consistent color palette and spacing
- Dark mode support via `next-themes`
- Radix UI primitives for accessibility

### Key Dependencies

- **UI**: @radix-ui components, lucide-react icons
- **Charts**: recharts for data visualization
- **Forms**: react-hook-form, @hookform/resolvers, zod
- **Theming**: next-themes, tailwindcss-animate
- **Analytics**: @vercel/analytics

## Development Notes

- Components use shadcn/ui "new-york" style
- Path aliases configured: `@/components`, `@/lib`, `@/lib/utils`
- TypeScript strict mode enabled
- Uses Geist font family (sans and mono)