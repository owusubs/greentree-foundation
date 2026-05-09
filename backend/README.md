# GreenTree Foundation Backend

This Express API powers the public static website forms while keeping private keys off GitHub Pages.

## Local Setup

1. Copy `.env.example` to `.env`.
2. Fill in `DATABASE_URL`, `FRONTEND_ORIGIN`, Stripe, Resend, and notification email values.
3. Install dependencies:

```bash
npm install
```

4. Start the server:

```bash
npm start
```

The health check is available at `http://localhost:10000/api/health`.

## Render Setup

1. Create a Render PostgreSQL database.
2. Create a Render Web Service using this `backend` folder.
3. Use `npm install` as the build command and `npm start` as the start command.
4. Add the environment variables from `.env.example`.
5. In Stripe, add a webhook endpoint pointing to:

```text
https://YOUR-RENDER-SERVICE.onrender.com/api/stripe/webhook
```

Subscribe the webhook to `checkout.session.completed`.

## Frontend Connection

After Render gives you the backend URL, update the first line of `script.js`:

```js
window.GREENTREE_API_BASE_URL || "https://YOUR-RENDER-SERVICE.onrender.com";
```

Replace the placeholder with your real Render URL, then push the site to GitHub Pages.
