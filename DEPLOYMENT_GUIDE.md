# Production Deployment Guide & Best Practices Handbook
**CareSync (MERN Stack + Socket.IO + Brevo + Cloudinary)**

This document serves as the definitive guide, checklist, and architectural reference for deploying full-stack MERN applications to cloud environments (Render, Vercel, AWS, etc.). It documents every issue solved, lessons learned, and best practices to ensure zero downtime and prevent recurring deployment bugs.

---

## Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [Complete Pre-Deployment Checklist](#2-complete-pre-deployment-checklist)
3. [Environment Variables Reference](#3-environment-variables-reference)
4. [Critical Lessons Learned & Solutions](#4-critical-lessons-learned--solutions)
   - [4.1 Cloud SMTP Port Blocking (The 500/502 Connection Timeout Trap)](#41-cloud-smtp-port-blocking-the-500502-connection-timeout-trap)
   - [4.2 REST API Payload Strictness (Empty String vs Optional Fields)](#42-rest-api-payload-strictness-empty-string-vs-optional-fields)
   - [4.3 SPA Client-Side Routing & 404 Not Found on Page Refresh](#43-spa-client-side-routing--404-not-found-on-page-refresh)
   - [4.4 Cross-Origin Cookies & Reverse Proxy Setup](#44-cross-origin-cookies--reverse-proxy-setup)
   - [4.5 Leaking Localhost URLs into Production Emails](#45-leaking-localhost-urls-into-production-emails)
   - [4.6 Production Mode Disabling Demo/Mock Features](#46-production-mode-disabling-demomock-features)
   - [4.7 Multi-Provider Auth Synchronization (Google OAuth vs Manual OTP)](#47-multi-provider-auth-synchronization-google-oauth-vs-manual-otp)
5. [Step-by-Step Render Deployment Runbook](#5-step-by-step-render-deployment-runbook)
6. [Post-Deployment Verification & Smoke Tests](#6-post-deployment-verification--smoke-tests)
7. [Troubleshooting Matrix](#7-troubleshooting-matrix)

---

## 1. Architecture Overview

```
 ┌────────────────────────────────┐         HTTPS / REST API           ┌────────────────────────────────┐
 │     Frontend (React + Vite)    │ ─────────────────────────────────> │     Backend (Express + Node)   │
 │   Render Static Site           │ <───────────────────────────────── │   Render Web Service           │
 │   caresync-ph5d.onrender.com   │       Cross-Site Secure Cookie     │   mega-project-backend-daf7... │
 └────────────────────────────────┘                                    └────────────────────────────────┘
                 │                                                                     │
                 │ WebSockets                                                          ├────> MongoDB Atlas
                 ▼                                                                     ├────> Cloudinary (Images)
 ┌────────────────────────────────┐                                                    └────> Brevo REST API (Port 443)
 │       Socket.IO Server         │                                                           (Emails & OTPs)
 │   (Attached to HTTP Server)    │
 └────────────────────────────────┘
```

- **Frontend**: Vite + React SPA hosted as a **Render Static Site**.
- **Backend**: Node.js / Express Web Service hosted on **Render Web Service** with Socket.IO attached to native `http.Server`.
- **Database**: MongoDB Atlas Cluster.
- **Media Storage**: Cloudinary for doctor/patient profile avatars.
- **Email Service**: Brevo (Sendinblue) transactional email via **HTTPS REST API** on Port 443.

---

## 2. Complete Pre-Deployment Checklist

Before deploying any new build or service to production, verify every item below:

- [ ] **No Hardcoded `localhost`**: Inspect all API endpoints, redirect URLs, email action links, and socket connections.
- [ ] **SPA Rewrite Rule Configured**: The static site hosting provider has a redirect/rewrite rule routing `/*` to `/index.html`.
- [ ] **Cloud SMTP Avoidance**: Email sending must use an HTTPS REST API (Port 443) rather than raw SMTP sockets (Ports 25, 465, 587).
- [ ] **Reverse Proxy Trust (`trust proxy`)**: Express has `app.set("trust proxy", 1)` enabled.
- [ ] **Cross-Domain Cookie Flags**: All session/auth cookies must specify `sameSite: "none"` and `secure: true`.
- [ ] **CORS Configuration**: Allowed origins array includes both development (`http://localhost:5173`) and live frontend URLs (`https://caresync-ph5d.onrender.com`), with `credentials: true`.
- [ ] **Database Network Access**: MongoDB Atlas Network Access whitelist contains `0.0.0.0/0` (Allow Access from Anywhere) so dynamic cloud IPs can connect.
- [ ] **Environment Variables Loaded**: All required keys in `.env` are mirrored in the cloud provider's Environment settings.
- [ ] **Demo / Mock Flows Enabled**: Any mock payment or simulation flows are explicitly toggled on via environment variables (`PAYMENT_MODE=demo`).

---

## 3. Environment Variables Reference

### Backend Service (Render Web Service)
| Variable Name | Required | Description | Example / Note |
|---|---|---|---|
| `PORT` | Yes | Port for Express server | `4000` (Render provides this dynamically) |
| `MONGODB_URL` | Yes | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/test` |
| `CLIENT_URL` | Yes | Public URL of the frontend | `https://caresync-ph5d.onrender.com` |
| `JWT_SECRET` | Yes | Secret for signing auth tokens | Any strong random string |
| `BREVO_API_KEY` | Yes | Brevo REST API Key | Starts with `xkeysib-...` (From *SMTP & API ➔ API Keys*) |
| `BREVO_USER` | Yes | Verified sender email in Brevo | `deepak5656jha@gmail.com` |
| `PAYMENT_MODE` | Optional | Controls booking payment flow | Set to `demo` for one-click payment without gateway |
| `CLOUD_NAME` | Yes | Cloudinary account name | `sshbpngv` |
| `API_KEY` | Yes | Cloudinary API Key | `352599969372463` |
| `API_SECRET` | Yes | Cloudinary API Secret | Secret string |
| `GOOGLE_CLIENT_ID` | Optional | Google OAuth 2.0 Client ID | `*.apps.googleusercontent.com` |

### Frontend Service (Render Static Site)
| Variable Name | Required | Description | Example / Note |
|---|---|---|---|
| `VITE_API_BASE` | Yes | URL pointing to backend API | `https://mega-project-backend-daf7.onrender.com/api/v1` |

---

## 4. Critical Lessons Learned & Solutions

### 4.1 Cloud SMTP Port Blocking (The 500/502 Connection Timeout Trap)
- **The Issue**: Nodemailer using `smtp.gmail.com:465` or `smtp-relay.brevo.com:587` worked on localhost, but on Render, requests to `/api/v1/send-otp` hung for 15–60 seconds before failing with `500 Internal Server Error (Email error: Connection timeout)`.
- **The Cause**: Cloud hosting platforms (Render Free Tier, AWS EC2, DigitalOcean, Vercel) block outbound network traffic on standard SMTP ports (`25`, `465`, `587`) to prevent abuse and spam bots.
- **The Fix**: Replaced raw SMTP with Brevo's **HTTPS REST API** (`https://api.brevo.com/v3/smtp/email`) using native `fetch` over **Port 443**. Port 443 is standard HTTPS and is never blocked by cloud firewalls.
- **Rule of Thumb**: Never use raw TCP socket SMTP libraries in cloud containers. Use transactional email REST APIs over HTTPS.

### 4.2 REST API Payload Strictness (Empty String vs Optional Fields)
- **The Issue**: OTP verification emails worked, but the doctor request invitation failed with `502 Could not send email to doctor`.
- **The Cause**: `sendotp.js` passed both `html` and `text`, but `assignmentController.js` only passed `html`. The mail utility sent `textContent: text || ""`. Brevo's OpenAPI schema validator rejected `textContent: ""` (empty string) with HTTP 400 Bad Request.
- **The Fix**: In `sendMail.js`, dynamically build the payload: only include `textContent` if `text` is a non-empty string.
- **Rule of Thumb**: When interacting with external REST APIs, omit optional fields entirely rather than sending empty strings `""`.

### 4.3 SPA Client-Side Routing & 404 Not Found on Page Refresh
- **The Issue**: Navigating inside the app worked, but refreshing subroutes (e.g. `/assignment/respond?token=...` or `/login`) returned **`404 Not Found`**.
- **The Cause**: React Router manages URLs in the browser. When the browser makes a direct request to a sub-route on a static file server, the server looks for an actual file on disk. Render Static Sites do not read Netlify's `_redirects` file.
- **The Fix**: In Render Dashboard ➔ Frontend Static Site ➔ **Redirects / Rewrites**, add:
  ```
  Source: /*   Destination: /index.html   Action: Rewrite
  ```
- **Rule of Thumb**: All React/Vue/Vite SPAs hosted as static sites require a server-level rewrite rule mapping all routes (`/*`) to `/index.html`.

### 4.4 Cross-Origin Cookies & Reverse Proxy Setup
- **The Issue**: Logging in succeeded, but subsequent requests did not include auth cookies, causing unauthorized redirects.
- **The Cause**:
  1. Frontend (`caresync-ph5d.onrender.com`) and Backend (`mega-project-backend-daf7.onrender.com`) are on different subdomains.
  2. Cloud platforms terminate SSL at a reverse proxy (Cloudflare/Nginx), forwarding requests to Express over plain HTTP internally. Without trust settings, Express considers the request insecure and refuses to set `secure: true` cookies.
- **The Fix**:
  - In `backend/index.js`: `app.set("trust proxy", 1);`
  - In `backend/utils/jwt.js`: `cookieOptions = { httpOnly: true, secure: true, sameSite: "none" };`
  - In CORS: specify `credentials: true` and whitelist the exact frontend origin.
- **Rule of Thumb**: Decoupled HTTPS deployments always require `trust proxy: 1`, `sameSite: "none"`, and `secure: true`.

### 4.5 Leaking Localhost URLs into Production Emails
- **The Issue**: Invitation emails sent to doctors contained links like `http://localhost:5173/assignment/respond?token=...`.
- **The Cause**: Code defaulted to `process.env.CLIENT_URL || "http://localhost:5173"`. When `CLIENT_URL` was not configured on Render, it fell back to localhost.
- **The Fix**: Implemented dynamic URL detection in `getClientUrl(req)`:
  1. Uses `process.env.CLIENT_URL` if set.
  2. Extracts `req.headers.origin` or `req.headers.referer` from the incoming request.
  3. Detects cloud deployment (`process.env.RENDER`).
  4. Only uses `http://localhost:5173` on local development machines.
- **Rule of Thumb**: Never rely on a single static string fallback for URLs sent to external users. Always inspect request headers (`req.headers.origin`).

### 4.6 Production Mode Disabling Demo/Mock Features
- **The Issue**: Appointment booking failed with `501 Online payment is not set up yet`.
- **The Cause**: `const paymentMode = () => (NODE_ENV === "production" ? "none" : "demo");` automatically shut down demo payments on production.
- **The Fix**: Default `paymentMode` to `"demo"` (`process.env.PAYMENT_MODE || "demo"`), allowing one-click payments to work in all environments.
- **Rule of Thumb**: Do not link mock/demo behavior strictly to `NODE_ENV === "development"`. Control feature flags via dedicated environment variables.

### 4.7 Multi-Provider Auth Synchronization (Google OAuth vs Manual OTP)
- **The Issue**: Google registration completed authentication but failed database validation because the `Otp` collection had no record for the email.
- **The Cause**: Manual signup verified emails through OTP records, while Google OAuth verified emails externally without creating an internal OTP record.
- **The Fix**: In `backend/controllers/googleauth.js`, automatically create a verified OTP record (`verified: true`) upon successful Google OAuth verification.
- **Rule of Thumb**: When supporting multiple authentication flows (e.g. Email/Password vs OAuth), ensure all flows converge into the same database state.

---

## 5. Step-by-Step Render Deployment Runbook

### Backend Setup (Web Service)
1. In Render Dashboard, click **New +** ➔ **Web Service**.
2. Connect your GitHub repository (`CareSync` / `MedManage`).
3. Settings:
   - **Root Directory**: `backend` (or root if using root scripts)
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
4. Add all environment variables listed in Section 3.
5. In MongoDB Atlas, verify Network Access allows `0.0.0.0/0`.

### Frontend Setup (Static Site)
1. In Render Dashboard, click **New +** ➔ **Static Site**.
2. Connect your GitHub repository.
3. Settings:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. In the left menu, click **Redirects / Rewrites**:
   - Add rule: `/*` ➔ `/index.html` (Action: `Rewrite`)
5. Add `VITE_API_BASE` in the **Environment** tab.

---

## 6. Post-Deployment Verification & Smoke Tests

Run these manual or automated checks right after deployment:

| Test Case | Action | Expected Result | Status |
|---|---|---|---|
| **Health Check** | Visit `https://backend-url/api/v1/me` | HTTP 401 (Not logged in) or 200 with user data | Passed |
| **Direct Route Refresh** | Visit `https://frontend-url/login` directly | Login page renders; no 404 error | Passed |
| **Email OTP Dispatch** | Enter email on registration step | HTTP 200 within 1s; OTP delivered to inbox | Passed |
| **Google Authentication** | Click "Continue with Google" | Google popup loads, registers/logs in, sets cookie | Passed |
| **Cross-Site Cookie** | Inspect browser DevTools ➔ Cookies | `token` cookie present with `Secure` and `SameSite=None` | Passed |
| **Doctor Request Email** | Receptionist sends request to doctor | Doctor receives email with live URL (`caresync-...`) | Passed |
| **Doctor Token Response** | Doctor clicks email link and clicks Accept | Request accepted without login, active in queue | Passed |
| **Demo Payment Booking** | Patient books slot and clicks "Pay" | Booking created instantly with queue token | Passed |
| **Live WebSocket Queue** | Receptionist calls next patient | Doctor and patient screens update without page refresh | Passed |

---

## 7. Troubleshooting Matrix

| Symptom | Root Cause | Solution |
|---|---|---|
| `500 Email error: Connection timeout` | SMTP port blocked by cloud host | Switch `sendMail.js` to Brevo HTTPS REST API (Port 443). |
| `502 Could not send email to doctor` | Empty `textContent: ""` in API body | Omit `textContent` when empty; send plain text fallback. |
| `404 Not Found` on page refresh or email link | Missing SPA rewrite rule | Add `/* -> /index.html [Rewrite]` in Render Static Site. |
| Cookie not saved after login | Missing `trust proxy` or `SameSite` flags | Add `app.set("trust proxy", 1)` and `sameSite: "none", secure: true`. |
| Email has `localhost:5173` link | Missing `CLIENT_URL` env variable | Use `getClientUrl(req)` dynamic detection and set `CLIENT_URL` in Render. |
| `501 Online payment is not set up yet` | Production mode turned off demo mode | Set `PAYMENT_MODE=demo` or default `paymentMode()` to `"demo"`. |
| Mongoose `MongooseServerSelectionError` | MongoDB Atlas IP blocked | Add `0.0.0.0/0` to Atlas Network Access IP Whitelist. |

