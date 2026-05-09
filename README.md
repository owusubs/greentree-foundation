# GreenTree Foundation Website

This repository is ready for GitHub Pages hosting at the root. The static pages live alongside `style.css`, `script.js`, and `assets/`.

## What Works Now

- Public website pages and navigation
- Donation forms wired to a backend API
- Volunteer/contact forms wired to a backend API
- Newsletter forms wired to a backend API
- Stripe success and cancel pages
- Privacy notice page
- Express backend in `backend/`
- Postgres schema for submissions and donations

## What You Must Set Before Going Live

1. Deploy the `backend/` service to Render.
2. Create a Render Postgres database.
3. Create Stripe and Resend accounts.
4. Set the Render environment variables listed in `backend/.env.example`.
5. Replace `https://YOUR-RENDER-SERVICE.onrender.com` at the top of `script.js` with your real Render backend URL.
6. Set `FRONTEND_ORIGIN` in Render to your real GitHub Pages URL.
7. In Stripe, add the webhook endpoint:

```text
https://YOUR-RENDER-SERVICE.onrender.com/api/stripe/webhook
```

Subscribe it to `checkout.session.completed`.

## GitHub Pages

After pushing this repo to GitHub:

1. Open the repository settings.
2. Go to **Pages**.
3. Choose **Deploy from a branch**.
4. Select your main branch and root folder.
5. Save.

GitHub will publish the site at your Pages URL.
