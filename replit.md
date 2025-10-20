# Hotel Check-In Platform with Flexible PMS Integration

## Overview

This project is a professional hotel check-in platform designed to streamline guest registration through digital signature capture and flexible integration with various Property Management Systems (PMS). It supports multiple PMS platforms (e.g., Opera Cloud, Protel, Cloudbeds) via a modular connector architecture. The application caters to administrators managing multiple hotels, hotel staff handling daily operations, and guests completing their check-in process. The platform aims to enhance efficiency, improve guest experience, and provide a secure, professional solution for the hospitality industry, with a focus on multi-tenancy for managing multiple hotels.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System:** React 18 with TypeScript, Vite, Wouter for routing.

**UI Component System:** Shadcn UI with Radix UI primitives, Tailwind CSS for styling, and Material Design principles for light/dark themes.

**State Management & Data Fetching:** TanStack Query for server state management, React Hook Form with Zod for form handling and validation.

**Key Design Decisions:** Component-first architecture, mobile-responsive design, digital signature capture, custom theme provider.

### Backend Architecture

**Server Framework:** Express.js with TypeScript for the REST API, custom middleware for logging and error handling.

**Data Layer:** Supabase PostgreSQL with Drizzle ORM, supporting hotels, PMS configurations, registration contracts, and users. Configured for Supabase pooler compatibility and falls back to Replit PostgreSQL.

**PMS Integration Layer:** Modular connector architecture with an `IPmsConnector` interface and `PmsFactory` for supporting various PMS types (Opera Cloud, Protel, Cloudbeds mock implementations).

**API Design:** RESTful endpoints with Zod schema validation for request bodies, centralized route registration, and error handling middleware.

**Key Architectural Decisions:** Modular PMS connector system, separation of concerns, database-first approach, and secure storage of digitally signed contracts.

### System Design Choices

*   **Multi-Tenancy:** Each hotel sees only its own data (arrivals, contracts, devices, logos) based on authenticated user's `hotelId`. Dynamic hotel branding (name, logo) is displayed.
*   **Role-Based Access Control:** Two user roles supported: `admin` (full system access, can manage all hotels and users) and `hotel_staff` (access to specific hotel data only). Admin users are redirected to `/admin` portal, hotel staff to `/hotel` dashboard after login.
*   **Admin Portal:** Comprehensive management interface for system administrators. Features include:
    *   Hotel management: Create, edit, delete hotels with fields for name, address, contact info, and max visible reservations
    *   User management: Create, edit, delete users, assign roles (admin/hotel_staff), and associate users with specific hotels
    *   Full CRUD operations with real-time data updates via TanStack Query
    *   Protected admin-only API routes with `requireAdmin` middleware
*   **Tablet Management System:** Tablets self-register with unique device IDs, capture metadata, and confirm connectivity via WebSocket. Device status (online/offline) is tracked. A dedicated Tablet Signature View displays guest registration cards, receives real-time updates, captures digital signatures, and auto-submits signed contracts.
*   **Manual Check-In Workflow:** Allows staff to manually create check-ins with options to either "Create & Send to Tablet" or "Save Only" for later processing.
*   **Arrival Management:** Features include adding, editing (room number, number of nights with auto-calculated checkout date), and deleting arrival records.
*   **Contract Management:** Generates professional PDF documents for registration contracts, including guest info, reservation details, full terms & conditions, and digital signatures. The dashboard provides a full contract details view.
*   **Real-time Updates:** WebSocket for bidirectional communication, automatic reconnection, used for tablet registration and real-time device management. Dashboard auto-refreshes and switches tabs upon guest signature submission.
*   **Session Management & Authentication:** Secure session management with PostgreSQL-backed session store, `connect-pg-simple`, Express-session, role-based middleware (`requireAuth`, `requireAdmin`, `requireHotelStaff`), and frontend `AuthContext`. Includes login history tracking.

## External Dependencies

**Database & ORM:** Drizzle ORM configured for PostgreSQL (via `@neondatabase/serverless` for Neon DB or Supabase).

**Third-Party UI Libraries:** Radix UI primitives, Lucide React for iconography, react-signature-canvas for digital signatures, date-fns for date manipulation.

**Automation & Document Generation:** `node-cron` for scheduling, `PDFKit` for generating PDF documents.

**Session Management & Authentication:** `connect-pg-simple`, `Express-session`.

**WebSocket & Real-time Communication:** Custom `useWebSocket` hook.

## Recent Updates

### October 20, 2025

#### Admin Portal & Multi-Tenant Management System
- **✅ Role-Based Access Control**: Implemented admin and hotel_staff roles with proper middleware protection
- **✅ Admin Portal UI**: Comprehensive admin dashboard at `/admin` for managing hotels and users
- **✅ Hotel Management**: Full CRUD operations for hotels (create, edit, delete) with support for:
  - Hotel name, address, phone, email
  - Max visible reservations per hotel (configurable by admin)
  - Hotel-specific logos (schema support added, upload feature pending)
- **✅ User Management**: Full CRUD operations for users with role assignment
  - Create users with email, password, role (admin/hotel_staff)
  - Associate users with specific hotels
  - Prevent admins from deleting their own account
- **✅ Admin Routes**: Protected API endpoints at `/api/admin/*` with requireAdmin middleware
- **✅ Smart Login Routing**: Admins redirected to `/admin`, hotel staff to `/hotel` based on role
- **✅ Admin User Created**: System administrator account (albalbisi77@gmail.com) with full access
- **✅ Storage Layer**: Added getAllUsers(), deleteUser(), deleteHotel() methods to storage interface

#### Removed Reservation Limit
- **✅ Unlimited Arrivals**: Removed the 8 reservation limit from `getArrivalsByHotel` method
- **✅ No Restrictions**: Hotels can now add as many reservations/arrivals as needed
- **✅ Database Query**: Updated query to return all arrivals without artificial limits

#### Fixed Database Connection Issue
- **✅ Database Switch**: Switched from disabled Supabase/Neon endpoint to Replit's built-in PostgreSQL database
- **✅ Error Resolution**: Fixed "The endpoint has been disabled. Enable it using Neon API and retry" errors
- **✅ Session Store**: Session management now works correctly with Replit database
- **✅ Clean Logs**: All database connection errors eliminated from server logs

#### Bug Fixes & Testing
- **✅ Fixed Select Component**: Changed empty string value to "none" in hotel select dropdown (Radix UI requirement)
- **✅ Fixed Routing**: Corrected AdminPortal redirect from /dashboard to /hotel for non-admin users
- **✅ End-to-End Testing**: Comprehensive tests passed for all admin portal features:
  - Admin login and routing to /admin portal
  - Hotel CRUD operations (create, edit, delete)
  - User CRUD operations (create, delete)
  - Access control verification (hotel_staff blocked from /admin)
  - Role-based routing working correctly