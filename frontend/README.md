This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Community authentication

Configure `NEXT_PUBLIC_API_URL` as the Marketplace API base ending in
`/api/v1`, and `NEXT_PUBLIC_COMMUNITY_API_URL` as the Community API base ending
in `/api`. Marketplace sign-in uses Community credentials; seller product
management and buyer orders use the Community-issued bearer token. The
Marketplace backend's `COMMUNITY_JWT_SECRET` must match Community's
`JWT_SECRET_KEY`, and `COMMUNITY_JWT_ISSUER` must match Community's
`JWT_ISSUER` (`ApexiveAI` by default). Use a strong signing secret. The
Marketplace backend's `CORS_ORIGINS` must allow this frontend origin, and
Community's `CORS_ORIGINS` must allow it as well.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

This repository contains separate `backend/` and `frontend/` applications. To
deploy the Next.js frontend without changing the backend deployment:

1. Import the same GitHub repository as a **new Vercel project**.
2. Set **Root Directory** to `frontend`.
3. Keep the detected **Next.js** framework and default build/output settings.
4. Set `NEXT_PUBLIC_API_URL` to the deployed Marketplace API base ending in
   `/api/v1`. Set `NEXT_PUBLIC_COMMUNITY_API_URL` to the Community API base
   ending in `/api` if it differs from the default.
5. Ensure both APIs allow the frontend's Vercel domain in their CORS settings.

Redeploy after changing environment variables. Keep the backend Vercel project
pointed at its own application; a Vercel project configured with `backend` as
its Root Directory will not build this frontend.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
