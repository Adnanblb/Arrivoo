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

#### PDF Download for Registration Contracts
- **✅ Download Button**: Added "Download PDF" button to the contract details dialog for easy access to printable contracts
- **✅ Complete PDF Generation**: PDF now includes all contract information:
  - Guest Information (name, email, phone, address, ID number)
  - Reservation Details (reservation number, confirmation, room, room type, number of guests)
  - Stay Details (check-in/out dates, number of nights, special requests)
  - **Full Terms & Conditions** (complete hotel contract terms from hotel settings)
  - Digital Signature (guest signature image with timestamp)
- **✅ Professional Formatting**: PDF is properly formatted with sections, headers, and signature image embedding
- **✅ Error Handling**: Graceful fallback if hotel terms unavailable, continues PDF generation without terms

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

#### Manual Check-In Feature
- **✅ New Check-In Button**: Added "New Check-In" button in dashboard header for creating manual check-ins without PMS lookup
- **✅ Manual Check-In Dialog**: Full-featured form with fields:
  - Guest name (required)
  - Room number (required)
  - Check-in date (auto-filled with today's date)
  - Check-out date OR number of nights (mutually exclusive)
  - Validates that either check-out date or nights is provided
- **✅ Backend API**: New endpoint POST /api/contracts/manual that:
  - Validates required fields
  - Calculates departure date from number of nights if provided
  - Generates unique reservation number (format: MAN-{timestamp})
  - Creates both contract AND arrival entries
  - Links arrival to contract via contractId for proper status tracking
- **✅ Auto Send to Tablet**: After creating manual check-in, Send to Tablet dialog opens automatically
- **✅ Dashboard Integration**: Manual check-ins appear in Pending tab immediately (arrivals cache invalidated after creation)
- **✅ Complete Flow**: Verified end-to-end - create manual check-in → send to tablet → guest signs → moves to Completed tab
- **✅ E2E Testing**: Full manual check-in workflow tested successfully with automated tests

#### Supabase Database Migration
- **✅ Supabase Integration Completed**: Successfully migrated from Replit PostgreSQL to Supabase
- Database Configuration: Supabase Transaction Pooler (port 6543) at aws-1-us-east-2.pooler.supabase.com
- **CRITICAL FIX**: Configured `prepare: false` for Supabase pooler compatibility
- Updated all hotel IDs throughout codebase to use new Supabase hotel IDs
- Current Hotels: Rosewood Jeddah (2b95c6e8-...), Grand Plaza Hotel (f39d5d3b-...), Merya Hotels (a6cff5a0-...)
- All features verified: PMS sync, arrivals display, tablet management, contract creation

#### Multi-Tenancy & Data Isolation
- **✅ Complete Multi-Tenancy**: Each hotel sees only their own data (arrivals, contracts, devices, logos)
- **✅ Authentication-Based Filtering**: Dashboard uses `useAuth()` hook to fetch logged-in user's hotelId, hotelName, and logoUrl
- **✅ Dynamic Hotel Branding**: Hotel name and logo displayed on dashboard header automatically based on authenticated user
- **✅ Tablet Logo Display**: iPad waiting screen shows hotel-specific logo from authenticated user's data
- **✅ 8 Arrivals Maximum**: Dashboard limited to display maximum 8 reservations at a time per hotel
- **✅ API-Level Filtering**: All arrivals queries filter by hotelId with `.limit(8)` in storage layer
- **Test Hotels**:
  - Merya Hotels (test@meryahotels.com / 123123): 8 Saudi guest reservations with custom logo
  - Grand Plaza Hotel (hotel@hotel.com / hotel123): Separate set of arrivals
  - Rosewood Jeddah (Albalbisi11@gmail.com): Independent hotel data

#### Hotel-Specific Tablet QR Codes & Logo Display
- **✅ Hotel-Specific QR Codes**: Each hotel now has unique QR codes for tablet registration (not shared across hotels)
  - QR code URL format: `{origin}/tablet/register?hotelId={hotel_uuid}`
  - AddTabletGuide component uses `useAuth()` to get authenticated user's hotelId
  - Button disabled until hotelId is loaded to prevent empty QR codes
- **✅ Automatic Hotel ID Pre-Fill**: Tablet registration page reads hotelId from URL parameter and auto-fills the form
  - Uses URLSearchParams to extract hotelId from query string
  - Tablets register with specific hotel, ensuring proper isolation
- **✅ Logo Display Fixed**: Hotel logos now display correctly on dashboard and tablet pages
  - Added Express middleware to serve `/attached_assets` folder: `app.use('/attached_assets', express.static(...))`
  - Logos accessible at `/attached_assets/{filename}` (e.g., Merya logo_1760873504604.jpeg)
  - Verified: HTTP 200 OK, proper file serving with automatic URL encoding for spaces
- **✅ Multi-Tenant Device Registration**: Tablets register to specific hotels via hotelId parameter
  - Backend WebSocket associates device with hotelId for targeted communication
  - Device list filtered by hotelId - each hotel sees only their own tablets

#### Tablet Registration & WebSocket Improvements
- **✅ Auto-Create Missing Devices**: WebSocket now automatically creates database entries when tablets connect
  - If device sends `register_device` but doesn't exist in database, system creates it with proper metadata
  - Prevents "can't find the tablet" issue where tablets connected but weren't queryable
  - Includes deviceName, deviceType, browser, OS, screen size from WebSocket payload
- **✅ Hotel ID Mismatch Auto-Correction**: Tablets with wrong hotelId are automatically fixed on reconnection
  - When tablet reconnects via WebSocket, system checks if stored hotelId matches incoming hotelId
  - If mismatch detected, device is automatically moved to correct hotel in database
  - Fixes tablets that were registered to wrong hotel during testing or migration
  - Ensures "Send to Tablet" dropdown shows all connected tablets for the correct hotel
- **✅ Enhanced Device Metadata**: Frontend pages send deviceName in WebSocket payload
  - DeviceRegistration.tsx includes device name when registering
  - TabletSignature.tsx includes device name when reconnecting
  - Ensures auto-created devices have friendly names instead of "Auto-registered tablet"