# Deployment

## Local prototype

```bash
npm ci
npm run check
npm run dev
```

Open:

```text
http://localhost:4173/?site=site-dc1-london&tab=overview&view=grid&mode=loa
```

## Static production build

```bash
npm ci
npm run build
npm run preview
```

The generated `dist/` directory is static and can be hosted on Vercel, GitHub Pages, Azure Static Web Apps, CloudFront/S3, Netlify, or an enterprise web tier.

## Vercel

The included `vercel.json` identifies the Vite framework and provides the SPA fallback. Import the GitHub repository into Vercel and use the default build settings:

```text
Build command: npm run build
Output directory: dist
Install command: npm ci
```

## GitHub Pages preview

The repository includes `.github/workflows/pages.yml`.

After publishing the repository:

1. Open **Settings → Pages**.
2. Set **Source** to **GitHub Actions**.
3. Run **Deploy prototype to GitHub Pages**, or push to `main`.

The Vite build uses relative asset paths so the preview can run below the repository path.

## SPA routing

The prototype stores current screen state in URL query parameters rather than a path router. A production router should still route unknown application paths to `index.html`.

## Environment separation

Production should define separate development, test, staging, and production tenants, databases, object stores, queues, keys, and identity applications.

## Required production services

- authenticated API/BFF;
- PostgreSQL/PostGIS;
- object storage with malware scanning and signed URLs;
- asynchronous job queue;
- centralized logging, metrics, tracing, and alerting;
- secret manager/KMS;
- SSO/SCIM integration;
- backup, recovery, retention, and legal-hold policies.

Do not put carrier credentials, signing secrets, storage keys, or database service credentials in the browser bundle.
