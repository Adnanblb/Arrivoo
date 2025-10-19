# Hotel Check-In Platform with Flexible PMS Integration

## Overview

This project is a professional hotel check-in platform designed to streamline guest registration through digital signature capture and flexible integration with various Property Management Systems (PMS). It supports multiple PMS platforms (e.g., Opera Cloud, Protel, Cloudbeds) via a modular connector architecture. The application caters to administrators managing multiple hotels, hotel staff handling daily operations, and guests completing their check-in process. The platform aims to enhance efficiency, improve guest experience, and provide a secure, professional solution for the hospitality industry.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System:** React 18 with TypeScript, Vite for fast development and optimized builds, Wouter for lightweight routing.

**UI Component System:** Shadcn UI with Radix UI primitives, Tailwind CSS for styling, and Material Design principles adapted for light/dark themes.

**State Management & Data Fetching:** TanStack Query for server state management and caching, React Hook Form with Zod for form handling and validation.

**Key Design Decisions:** Component-first architecture, mobile-responsive design, digital signature capture, custom theme provider.

### Backend Architecture

**Server Framework:** Express.js with TypeScript for the REST API, custom middleware for logging and error handling.

**Data Layer:** Supabase PostgreSQL with Drizzle ORM for data persistence, supporting hotels, PMS configurations, registration contracts, and users. It uses `prepare: false` for Supabase pooler compatibility and falls back to Replit PostgreSQL if not configured.

**PMS Integration Layer:** Modular connector architecture with an `IPmsConnector` interface and `PmsFactory` for supporting various PMS types (Opera Cloud, Protel, Cloudbeds mock implementations).

**API Design:** RESTful endpoints with Zod schema validation for request bodies, centralized route registration, and error handling middleware.

**Key Architectural Decisions:** Modular PMS connector system, separation of concerns, database-first approach, and secure storage of digitally signed contracts.

### External Dependencies

**Database & ORM:** Drizzle ORM configured for PostgreSQL (via `@neondatabase/serverless` for Neon DB or Supabase), with a shared schema and drizzle-kit for migrations.

**Third-Party UI Libraries:** Radix UI primitives, Lucide React for iconography, react-signature-canvas for digital signatures, date-fns for date manipulation.

**Automation & Document Generation:** node-cron for scheduling hourly PMS sync and daily cleanup, PDFKit for generating professional PDF documents.

**Session Management & Authentication:** Production-ready secure session management with PostgreSQL-backed session store via `connect-pg-simple`, Express-session, `requireAuth` middleware, and frontend `AuthContext`. OTP system is currently disabled but infrastructure remains. Comprehensive login history tracking and secure logout.

**WebSocket & Real-time Communication:** Custom `useWebSocket` hook for bidirectional communication, automatic reconnection, used for tablet registration and real-time device management.

### Tablet Management System

**Device Registration:** Tablets self-register with unique device IDs, capture metadata, and confirm connectivity via WebSocket. Device status (online/offline) is tracked.

**Tablet Signature View:** Dedicated view for tablets to display guest registration cards, receive real-time updates via WebSocket, capture digital signatures, and auto-submit signed contracts. Optimized for tablet devices.