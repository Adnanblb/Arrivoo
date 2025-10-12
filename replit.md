# Hotel Check-In Platform with Opera Cloud PMS Integration

## Overview

This is a hotel check-in platform designed to streamline guest registration with digital signature capture and Opera Cloud PMS integration. The application serves three primary user roles: administrators who manage multiple hotels, hotel staff who handle daily arrivals, and guests who complete their check-in process. Built with React and Express, it uses Material Design principles to provide a professional, trustworthy interface suitable for the hospitality industry.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18 with TypeScript for type safety and modern component patterns
- Vite as the build tool and development server for fast HMR and optimized production builds
- Wouter for lightweight client-side routing instead of React Router

**UI Component System**
- Shadcn UI component library with Radix UI primitives for accessible, customizable components
- Tailwind CSS for utility-first styling with custom design tokens
- Material Design principles adapted through custom CSS variables for light/dark themes
- Theme system supports both light and dark modes with persistent user preference

**State Management & Data Fetching**
- TanStack Query (React Query) for server state management, caching, and data synchronization
- React Hook Form with Zod validation for form handling and schema validation
- Custom hooks for mobile detection and toast notifications

**Key Design Decisions**
- Component-first architecture with reusable UI primitives (Button, Card, Badge, etc.)
- Mobile-responsive design with breakpoint-aware components (ArrivalsTable switches to GuestCard on mobile)
- Digital signature capture using react-signature-canvas for guest registration
- Custom theme provider for centralized theme management across the application

### Backend Architecture

**Server Framework**
- Express.js with TypeScript for the REST API
- Custom middleware for request logging and error handling
- Vite integration in development mode for seamless full-stack development

**Data Layer**
- In-memory storage implementation (MemStorage) as the current data persistence layer
- Interface-based storage abstraction (IStorage) allows easy swapping to database implementations
- Drizzle ORM configured for PostgreSQL (currently not actively used but infrastructure is in place)

**API Design**
- RESTful endpoints prefixed with `/api`
- Centralized route registration through `registerRoutes` function
- Error handling middleware for consistent error responses

**Key Architectural Decisions**
- Separation of concerns: routes, storage, and business logic are modular
- Storage interface allows switching from in-memory to persistent database without changing business logic
- Development/production environment handling with conditional Vite setup

### External Dependencies

**Database & ORM**
- Drizzle ORM configured for PostgreSQL via `@neondatabase/serverless`
- Neon serverless database setup with WebSocket support
- Schema defined in shared folder for type safety across frontend/backend
- Migration system configured through drizzle-kit

**Third-Party UI Libraries**
- Radix UI primitives (@radix-ui/*) for accessible component foundations
- Lucide React for consistent iconography
- react-signature-canvas for digital signature capture
- date-fns for date formatting and manipulation

**Development Tools**
- Replit-specific plugins for development banner, error overlay, and cartographer
- TypeScript for static type checking across the entire codebase
- ESBuild for server-side bundling in production

**Planned Integrations**
- Opera Cloud PMS integration (referenced in design guidelines but not yet implemented)
- The application is architecturally prepared for PMS integration through the storage abstraction layer

**Session Management**
- connect-pg-simple configured for PostgreSQL-based session storage
- Session infrastructure is set up but authentication/authorization implementation is pending