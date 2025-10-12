# Hotel Check-In Platform with Flexible PMS Integration

## Overview

This is a professional hotel check-in platform designed to streamline guest registration with digital signature capture and flexible PMS integration. The application supports multiple Property Management Systems (Opera Cloud, Protel, Cloudbeds, etc.) through a modular connector architecture. It serves three primary user roles: administrators who manage multiple hotels, hotel staff who handle daily arrivals and search contracts, and guests who complete their check-in process. Built with React and Express with PostgreSQL database, it uses Material Design principles to provide a professional, trustworthy interface suitable for the hospitality industry.

## Key Features

### 1. Manual Check-in (PMS Lookup)
- Staff can manually enter a confirmation number to lookup reservations
- System uses modular PMS API connector to fetch reservation details from any PMS
- Retrieved data includes: guest name, reservation number, dates, room type/number, number of nights
- Auto-fills digital registration card with PMS data
- Shows "Reservation not found" message if lookup fails

### 2. Contract Search & Archive
- Staff can search all registration contracts (current and historical)
- Search by guest name, room number, or reservation number
- Displays comprehensive contract details including digital signature
- Supports both desktop table view and mobile card view

### 3. Contract Management
- Download/print capability for signed contracts (PDF generation coming soon)
- Full contract details view in modal dialog
- Secure storage with timestamps and PMS source tracking

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
- PostgreSQL database with Drizzle ORM for data persistence
- Database storage implementation (DbStorage) with full CRUD operations
- Interface-based storage abstraction (IStorage) for modularity
- Comprehensive schema supporting hotels, PMS configurations, registration contracts, and users

**PMS Integration Layer**
- Modular PMS connector architecture supporting multiple PMS types
- Interface-based design (`IPmsConnector`) for easy addition of new PMS systems
- Factory pattern (`PmsFactory`) for creating appropriate connectors
- Currently supports: Opera Cloud, Protel, and Cloudbeds (with mock implementations)

**API Design**
- RESTful endpoints prefixed with `/api`
- Key endpoints:
  - `/api/pms/lookup` - Manual check-in reservation lookup
  - `/api/contracts` - Contract CRUD operations
  - `/api/contracts/search` - Advanced contract search
  - `/api/hotels` - Hotel management
  - `/api/pms-config` - PMS configuration management
- Centralized route registration through `registerRoutes` function
- Zod schema validation for all request bodies
- Error handling middleware for consistent error responses

**Key Architectural Decisions**
- Modular PMS connector system allows supporting any PMS type
- Separation of concerns: routes, storage, PMS connectors, and business logic are isolated
- Database-first approach with PostgreSQL for data persistence
- All contracts stored with digital signatures for long-term compliance

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