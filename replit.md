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

## Recent Updates

### October 19, 2025

#### Dashboard Auto-Switch & Full Contract Details View
- **✅ WebSocket Auto-Refresh**: Dashboard now automatically refreshes arrivals and switches to "Completed" tab when a guest submits their signature on the tablet. Includes success toast notification for immediate feedback
- **✅ Full Contract Details Dialog**: When viewing completed arrivals (eye icon), the system now fetches and displays complete contract information including:
  - Guest Information (name, email, phone, ID number)
  - Reservation Details (reservation number, room, dates, number of nights, room type)
  - Full Terms & Conditions text (fetched from hotel settings with fallback)
  - Digital Signature image with timestamp
- **✅ Enhanced Error Handling**: Added comprehensive error handling for contract fetching with user-friendly toast notifications for failed requests, missing contract IDs, or network errors. Falls back to basic guest info dialog on errors
- **✅ E2E Testing**: Verified complete flow with automated tests - contract viewing displays all required sections correctly

#### Tablet Signature UI Improvements & Check-in Flow Fix
- **✅ Changed "Save Signature" button to "Submit"**: Updated tablet signature page button text from "Save Signature" to "Submit" for clearer guest-facing language
- **✅ Contract Status Auto-Completion**: When guests click "Submit" on the tablet, the contract status is automatically set to "completed" (not "pending")
- **✅ Arrival Status Update**: Fixed critical issue where arrivals remained in "Pending" tab after check-in. Now when a guest submits their signature, the arrival status (hasCheckedIn) is automatically updated, moving the guest from "Pending" to "Completed" tab on the dashboard
- **✅ Improved User Feedback**: Updated success message to "Check-in Completed - Your registration has been submitted successfully" for better clarity
- **✅ Success State**: Button displays "Submitted" with checkmark icon after successful submission
- **✅ Dashboard Sync**: Dashboard now correctly reflects completed check-ins in real-time. Guests disappear from "Pending" and appear in "Completed" immediately after submitting their signature

#### Supabase Database Migration
- **✅ Supabase Integration Completed**: Successfully migrated from Replit PostgreSQL to Supabase
- Database Configuration: Supabase Transaction Pooler (port 6543) at aws-1-us-east-2.pooler.supabase.com
- **CRITICAL FIX**: Configured `prepare: false` for Supabase pooler compatibility
- Updated all hotel IDs throughout codebase to use new Supabase hotel IDs
- Current Hotels: Rosewood Jeddah (2b95c6e8-...), Grand Plaza Hotel (f39d5d3b-...)
- All features verified: PMS sync, arrivals display, tablet management, contract creation