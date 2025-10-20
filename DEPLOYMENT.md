# Deployment Guide for Render

This guide will help you deploy your Arrivoo application to Render with all features working correctly, including image uploads and static assets.

## Prerequisites

1. A GitHub account with your code repository
2. A Render account (free tier works)
3. A Supabase account for database and storage

## Part 1: Static Assets Setup

### What Static Assets Are

Static assets are files that don't change and are served directly by the web server:
- Logos (`/logo.svg`)
- Favicons
- Static images
- Fonts
- `robots.txt`, `manifest.json`, etc.

### How Static Assets Work

**In Development (Replit):**
- Vite automatically serves files from `client/public/`
- Access them at `http://localhost:5000/logo.svg`

**In Production (Render):**
- Build process copies `client/public/` → `dist/public/`
- Express serves from `dist/public/`
- Access them at `https://your-app.onrender.com/logo.svg`

### Using Static Assets in React

```jsx
// ✅ Correct - Use absolute paths from root
<img src="/logo.svg" alt="Logo" />
<link rel="icon" href="/favicon.ico" />

// ❌ Wrong - Don't use relative paths
<img src="./logo.svg" alt="Logo" />
<img src="../public/logo.svg" alt="Logo" />
```

## Part 2: Supabase Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note down:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **Anon Key** (public key for client-side access)
   - **Database URL** (PostgreSQL connection string)

### 2. Set Up Database

Your database is already configured to use Supabase. The connection is set via `SUPABASE_DATABASE_URL`.

### 3. Set Up Storage Buckets

In your Supabase Dashboard:

1. Go to **Storage** section
2. Click **New Bucket**
3. Create these buckets:
   - `hotel-logos` (Public bucket)
   - `hotel-assets` (Public bucket)
4. For each bucket:
   - Click on bucket name
   - Go to **Policies**
   - Add policy:
     ```sql
     -- Allow public read access
     CREATE POLICY "Public Access"
     ON storage.objects FOR SELECT
     USING ( bucket_id = 'hotel-logos' );
     
     -- Allow authenticated uploads
     CREATE POLICY "Authenticated users can upload"
     ON storage.objects FOR INSERT
     WITH CHECK ( bucket_id = 'hotel-logos' AND auth.role() = 'authenticated' );
     ```

**OR** use the Supabase bucket settings to make them public.

## Part 3: Render Deployment

### 1. Connect GitHub Repository

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **New +** → **Web Service**
3. Connect your GitHub repository: `https://github.com/Adnanblb/Arrivoo`

### 2. Configure Build Settings

**Build Command:**
```bash
npm install && npm run build
```

**Start Command:**
```bash
npm run start
```

**Environment:**
- Node.js

### 3. Set Environment Variables

In Render's Environment section, add these variables:

```bash
# Database
SUPABASE_DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres

# Supabase Storage
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here

# Session
SESSION_SECRET=your-random-secret-string-here

# Node Environment
NODE_ENV=production
```

**How to get these values:**

- **SUPABASE_DATABASE_URL**: Supabase Dashboard → Project Settings → Database → Connection String (use "Connection Pooling" for production)
- **SUPABASE_URL**: Supabase Dashboard → Project Settings → API → Project URL
- **SUPABASE_ANON_KEY**: Supabase Dashboard → Project Settings → API → Project API keys → `anon` `public`
- **SESSION_SECRET**: Generate a random string (e.g., `openssl rand -hex 32`)

### 4. Deploy

Click **Create Web Service** and wait for deployment to complete.

## Part 4: Verify Everything Works

### Test Static Assets

Visit `https://your-app.onrender.com/logo.svg` - you should see the logo

### Test Logo Upload

1. Log in as admin
2. Go to Admin Portal → Hotels
3. Edit a hotel
4. Upload a logo using the upload button
5. Logo should appear immediately

### Test Database

1. Log in with your credentials
2. Create a hotel, add arrivals, etc.
3. Data should persist across reloads

## Troubleshooting

### Images Not Showing

**Problem:** Static images (like `/logo.svg`) return 404

**Solution:**
1. Make sure `client/public/` folder exists with images
2. Check build logs - files should be copied to `dist/public/`
3. Verify Express is serving static files from correct path

### Logo Upload Fails

**Problem:** "Supabase client not initialized" error

**Solution:**
1. Check environment variables are set in Render
2. Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` are correct
3. Make sure buckets exist in Supabase Storage

**Problem:** "Upload failed" or CORS error

**Solution:**
1. Check Supabase bucket is **public**
2. Verify bucket policies allow uploads
3. Check file size < 5MB

### Database Connection Issues

**Problem:** "Can't connect to database"

**Solution:**
1. Use "Connection Pooling" string from Supabase (not direct connection)
2. Format: `postgresql://postgres.xxx:[password]@aws-0-xxx.pooler.supabase.com:6543/postgres`
3. Make sure password is URL-encoded if it contains special characters

## Post-Deployment Checklist

- [ ] Static logo loads at `/logo.svg`
- [ ] Can log in with admin credentials
- [ ] Can upload hotel logos successfully
- [ ] Logos display correctly after upload
- [ ] Database saves data correctly
- [ ] All pages load without errors

## Additional Resources

- [Render Docs](https://render.com/docs)
- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [Vite Static Assets](https://vitejs.dev/guide/assets.html)

---

## Quick Reference: File Locations

```
client/
├── public/              # Static assets (copied to dist/public in build)
│   ├── logo.svg        # Your logo (accessible at /logo.svg)
│   └── favicon.ico     # Favicon
├── src/
│   ├── components/
│   │   └── LogoUpload.tsx  # Logo upload component
│   └── ...

server/
├── storage-client.ts    # Supabase Storage utilities
├── routes/
│   └── upload.ts       # Upload API endpoints
└── ...
```

Need help? Check the application logs in Render Dashboard or Supabase logs for errors.
