# Public Assets Folder

This folder contains static assets that will be served directly by the web server.

## Usage in React Components

Files in this folder can be referenced using absolute paths from the root:

```jsx
<img src="/logo.svg" alt="Logo" />
<link rel="icon" type="image/svg+xml" href="/logo.svg" />
```

## What Goes Here

- Logos and branding assets
- Favicons
- Static images that don't change
- Fonts
- robots.txt
- manifest.json

## Production Build

When you build for production (`npm run build`), these files will be copied to the `dist/public` folder and served by Express.
