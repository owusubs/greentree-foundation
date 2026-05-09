require("dotenv").config();

const fs = require("fs");
const path = require("path");
const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { Pool } = require("pg");
const { Resend } = require("resend");
const Stripe = require("stripe");
const { z } = require("zod");

const requiredEnvironment = [
  "DATABASE_URL",
  "FRONTEND_ORIGIN",
  "ORG_NOTIFICATION_EMAIL",
  "RESEND_API_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET"
];

const missingEnvironment = requiredEnvironment.filter((key) => !process.env[key]);

if (missingEnvironment.length) {
  throw new Error(`Missing required environment variables: ${missingEnvironment.join(", ")}`);
}

const app = express();
const port = Number(process.env.PORT || 10000);
const frontendOrigins = process.env.FRONTEND_ORIGIN.split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);
const primaryFrontendOrigin = frontendOrigins[0];
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false }
});
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);

const emailSchema = z.string().trim().email().max(254);
const textSchema = z.string().trim().min(1).max(2000);
const optionalTextSchema = z.string().trim().max(2000).optional().or(z.literal(""));

const contactSchema = z.object({
  name: textSchema.max(120),
  email: emailSchema,
  message: textSchema,
  sourcePage: optionalTextSchema,
  website: optionalTextSchema
});

const volunteerSchema = contactSchema.extend({
  availability: optionalTextSchema
});

const newsletterSchema = z.object({
  email: emailSchema,
  consent: z.boolean(),
  sourcePage: optionalTextSchema,
  website: optionalTextSchema
});

const donationSchema = z.object({
  amount: z.string().trim().min(1).max(20),
  customAmount: z.string().trim().max(20).optional().or(z.literal("")),
  name: z.string().trim().max(120).optional().or(z.literal("")),
  email: z.string().trim().email().max(254).optional().or(z.literal("")),
  message: optionalTextSchema,
  sourcePage: optionalTextSchema,
  website: optionalTextSchema
});

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const isSpam = (payload) => Boolean(payload.website && payload.website.trim());

const parseDonationAmount = ({ amount, customAmount }) => {
  const selectedAmount = amount === "custom" ? customAmount : amount;
  const normalized = String(selectedAmount || "").replace(/[\u00A3,\s]/g, "");
  const pounds = Number(normalized);

  if (!Number.isFinite(pounds) || pounds < 1 || pounds > 10000) {
    throw new Error("Choose a donation amount between GBP 1 and GBP 10,000.");
  }

  return Math.round(pounds * 100);
};

const sendNotification = async ({ subject, replyTo, rows }) => {
  const htmlRows = rows
    .map(([label, value]) => `<p><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value || "Not provided")}</p>`)
    .join("");

  await resend.emails.send({
    from: process.env.RESEND_FROM || "GreenTree Foundation <onboarding@resend.dev>",
    to: [process.env.ORG_NOTIFICATION_EMAIL],
    replyTo: replyTo || undefined,
    subject,
    html: `<h2>${escapeHtml(subject)}</h2>${htmlRows}`
  });
};

const runMigrations = async () => {
  if (process.env.RUN_MIGRATIONS === "false") {
    return;
  }

  const schemaPath = path.join(__dirname, "schema.sql");
  await pool.query(fs.readFileSync(schemaPath, "utf8"));
};

const validate = (schema, request, response) => {
  const result = schema.safeParse(request.body);

  if (!result.success) {
    response.status(400).json({ error: result.error.issues[0].message });
    return null;
  }

  return result.data;
};

app.set("trust proxy", 1);
app.use(helmet());

app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (request, response) => {
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        request.body,
        request.headers["stripe-signature"],
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (error) {
      response.status(400).send(`Webhook Error: ${error.message}`);
      return;
    }

    try {
      if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const metadata = session.metadata || {};
        const donorEmail =
          session.customer_details && session.customer_details.email
            ? session.customer_details.email
            : metadata.donorEmail || null;

        await pool.query(
          `UPDATE donation_sessions
             SET status = $1, updated_at = NOW()
           WHERE stripe_session_id = $2`,
          ["paid", session.id]
        );

        await pool.query(
          `INSERT INTO donations (
             stripe_session_id,
             stripe_payment_intent_id,
             amount_pence,
             currency,
             donor_name,
             donor_email,
             status,
             raw_event
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (stripe_session_id)
           DO UPDATE SET
             stripe_payment_intent_id = EXCLUDED.stripe_payment_intent_id,
             amount_pence = EXCLUDED.amount_pence,
             currency = EXCLUDED.currency,
             donor_name = EXCLUDED.donor_name,
             donor_email = EXCLUDED.donor_email,
             status = EXCLUDED.status,
             raw_event = EXCLUDED.raw_event`,
          [
            session.id,
            session.payment_intent || null,
            session.amount_total || 0,
            session.currency || "gbp",
            metadata.donorName || null,
            donorEmail,
            session.payment_status || "paid",
            event
          ]
        );

        await sendNotification({
          subject: "New paid donation",
          replyTo: donorEmail,
          rows: [
            ["Amount", `GBP ${((session.amount_total || 0) / 100).toFixed(2)}`],
            ["Donor", metadata.donorName],
            ["Email", donorEmail],
            ["Stripe session", session.id]
          ]
        });
      }

      response.json({ received: true });
    } catch (error) {
      console.error(error);
      response.status(500).json({ error: "Webhook processing failed." });
    }
  }
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || frontendOrigins.includes(origin.replace(/\/$/, ""))) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin not allowed by CORS."));
    }
  })
);
app.use(express.json({ limit: "20kb" }));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 80,
    standardHeaders: "draft-7",
    legacyHeaders: false
  })
);

app.get("/api/health", (_request, response) => {
  response.json({ ok: true, service: "greentree-api" });
});

app.post("/api/volunteer", async (request, response, next) => {
  const payload = validate(volunteerSchema, request, response);

  if (!payload) {
    return;
  }

  if (isSpam(payload)) {
    response.json({ ok: true });
    return;
  }

  try {
    await pool.query(
      `INSERT INTO volunteer_submissions (name, email, availability, message, source_page)
       VALUES ($1, $2, $3, $4, $5)`,
      [payload.name, payload.email, payload.availability || null, payload.message, payload.sourcePage || null]
    );

    await sendNotification({
      subject: "New volunteer interest",
      replyTo: payload.email,
      rows: [
        ["Name", payload.name],
        ["Email", payload.email],
        ["Availability", payload.availability],
        ["Message", payload.message],
        ["Source page", payload.sourcePage]
      ]
    });

    response.status(201).json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.post("/api/contact", async (request, response, next) => {
  const payload = validate(contactSchema, request, response);

  if (!payload) {
    return;
  }

  if (isSpam(payload)) {
    response.json({ ok: true });
    return;
  }

  try {
    await pool.query(
      `INSERT INTO contact_messages (name, email, message, source_page)
       VALUES ($1, $2, $3, $4)`,
      [payload.name, payload.email, payload.message, payload.sourcePage || null]
    );

    await sendNotification({
      subject: "New website message",
      replyTo: payload.email,
      rows: [
        ["Name", payload.name],
        ["Email", payload.email],
        ["Message", payload.message],
        ["Source page", payload.sourcePage]
      ]
    });

    response.status(201).json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.post("/api/newsletter", async (request, response, next) => {
  const payload = validate(newsletterSchema, request, response);

  if (!payload) {
    return;
  }

  if (!payload.consent) {
    response.status(400).json({ error: "Please confirm newsletter consent." });
    return;
  }

  if (isSpam(payload)) {
    response.json({ ok: true });
    return;
  }

  try {
    await pool.query(
      `INSERT INTO newsletter_subscribers (email, email_normalized, consent, source_page)
       VALUES ($1, LOWER($1), $2, $3)
       ON CONFLICT (email_normalized)
       DO UPDATE SET
         email = EXCLUDED.email,
         consent = EXCLUDED.consent,
         source_page = EXCLUDED.source_page,
         updated_at = NOW()`,
      [payload.email, payload.consent, payload.sourcePage || null]
    );

    await sendNotification({
      subject: "New newsletter signup",
      replyTo: payload.email,
      rows: [
        ["Email", payload.email],
        ["Source page", payload.sourcePage]
      ]
    });

    response.status(201).json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.post("/api/donations/create-checkout-session", async (request, response, next) => {
  const payload = validate(donationSchema, request, response);

  if (!payload) {
    return;
  }

  if (isSpam(payload)) {
    response.json({ ok: true });
    return;
  }

  try {
    const amountPence = parseDonationAmount(payload);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      submit_type: "donate",
      payment_method_types: ["card"],
      customer_email: payload.email || undefined,
      success_url: `${primaryFrontendOrigin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${primaryFrontendOrigin}/cancel.html`,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "gbp",
            unit_amount: amountPence,
            product_data: {
              name: "GreenTree Foundation donation"
            }
          }
        }
      ],
      metadata: {
        donorName: payload.name || "",
        donorEmail: payload.email || "",
        sourcePage: payload.sourcePage || ""
      },
      payment_intent_data: {
        metadata: {
          donorName: payload.name || "",
          donorEmail: payload.email || "",
          donorMessage: payload.message || "",
          sourcePage: payload.sourcePage || ""
        }
      }
    });

    await pool.query(
      `INSERT INTO donation_sessions (
         stripe_session_id,
         stripe_checkout_url,
         amount_pence,
         currency,
         donor_name,
         donor_email,
         donor_message,
         source_page
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        session.id,
        session.url,
        amountPence,
        "gbp",
        payload.name || null,
        payload.email || null,
        payload.message || null,
        payload.sourcePage || null
      ]
    );

    response.status(201).json({ url: session.url });
  } catch (error) {
    next(error);
  }
});

app.use((error, _request, response, _next) => {
  console.error(error);

  if (error.message && error.message.startsWith("Choose a donation amount")) {
    response.status(400).json({ error: error.message });
    return;
  }

  response.status(500).json({ error: "The server could not complete that request. Please try again later." });
});

runMigrations()
  .then(() => {
    app.listen(port, "0.0.0.0", () => {
      console.log(`GreenTree API listening on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start GreenTree API", error);
    process.exit(1);
  });
