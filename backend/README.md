# GreenTree Foundation Backend

This Express API powers the GreenTree Foundation website forms, newsletter signups, and Stripe donation checkout while keeping private keys off GitHub Pages.

## Live Deployment

- Frontend hosting: GitHub Pages
- Frontend URL: `https://owusubs.github.io/greentree-foundation/`
- Custom domain: `https://greentree-foundation.org`
- Backend hosting: Render Web Service
- Backend URL: `https://greentree-foundation-api.onrender.com`
- Health check: `https://greentree-foundation-api.onrender.com/api/health`
- Stripe webhook URL: `https://greentree-foundation-api.onrender.com/api/stripe/webhook`

The health check should return:

```json
{
  "ok": true,
  "service": "greentree-api"
}
```

## Local Setup

1. Copy `.env.example` to `.env`.
2. Fill in the real local development values for:

```text
DATABASE_URL
DATABASE_SSL
FRONTEND_ORIGIN
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
RESEND_API_KEY
RESEND_FROM
ORG_NOTIFICATION_EMAIL
RUN_MIGRATIONS
```

3. Install dependencies:

```bash
npm install
```

4. Start the backend:

```bash
npm start
```

The local health check is available at:

```text
http://localhost:10000/api/health
```

## Render Configuration

The Render backend should be configured as a Node Web Service, not a Static Site.

Use these settings:

```text
Root Directory: backend
Build Command: npm install
Start Command: npm start
Health Check Path: /api/health
```

Required Render environment variables:

```text
NODE_VERSION=22
DATABASE_URL=<Render Postgres internal database URL>
DATABASE_SSL=true
FRONTEND_ORIGIN=https://owusubs.github.io/greentree-foundation,https://owusubs.github.io,https://greentree-foundation.org,https://www.greentree-foundation.org
STRIPE_SECRET_KEY=<Stripe secret key>
STRIPE_WEBHOOK_SECRET=<Stripe webhook signing secret>
RESEND_API_KEY=<Resend API key>
RESEND_FROM=GreenTree Foundation <onboarding@resend.dev>
ORG_NOTIFICATION_EMAIL=<organisation notification email>
RUN_MIGRATIONS=true
```

Do not commit real secret values to GitHub.

## Stripe Configuration

Create a Stripe webhook endpoint with this URL:

```text
https://greentree-foundation-api.onrender.com/api/stripe/webhook
```

Subscribe it to this event:

```text
checkout.session.completed
```

After creating the webhook, copy the signing secret that starts with `whsec_` into Render as:

```text
STRIPE_WEBHOOK_SECRET=whsec_...
```

If any Stripe keys were exposed in screenshots or messages, rotate them in Stripe and update Render immediately.

## Frontend Connection

The frontend `script.js` should point to the live Render backend:

```js
const API_BASE_URL =
  window.GREENTREE_API_BASE_URL || "https://greentree-foundation-api.onrender.com";
```

After changing frontend files, commit them to GitHub and wait for GitHub Pages to redeploy.

## Custom Domain DNS

The custom domain `greentree-foundation.org` should point to GitHub Pages.

Use these DNS records at the domain registrar:

Type: A
Host: @
Value: 185.199.111.153

Type: CNAME
Host: www
Value: owusubs.github.io


After DNS passes in GitHub Pages settings, enable `Enforce HTTPS`.

## Production Notes

- Use Stripe Checkout only; never collect card details directly on the website.
- Keep Render, Stripe, Resend, and database secrets private.
- Test volunteer, newsletter, contact, and donation flows after every deployment.
- Monitor Render logs after deploying changes.
- Add stronger spam protection before heavy public use.
- Add automated tests and a `package-lock.json` before treating this as a production-grade backend.
