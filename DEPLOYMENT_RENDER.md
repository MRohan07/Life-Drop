# LifeDrop — Complete Render Deployment Guide

This guide covers deploying the full **LifeDrop** platform to **[Render](https://render.com)**.

LifeDrop consists of three components:
1. **Managed PostgreSQL Database** (`lifedrop-db`)
2. **Express.js + TypeScript Web API** (`lifedrop-api`)
3. **React + Vite Frontend Static Site** (`lifedrop-frontend`)

---

## ⚡ Method 1: Automated Blueprint Deployment (Recommended)

LifeDrop includes an Infrastructure-as-Code [render.yaml](file:///Users/rohan/Desktop/Life%20Drop/render.yaml) blueprint that automatically provisions the database, backend, and frontend with single-click setup.

### Step 1: Push Your Code to GitHub
Render connects to your GitHub repository to build and deploy.

```bash
# 1. Stage and commit all changes
git add .
git commit -m "Configure production build and Render deployment blueprint"

# 2. Add your GitHub repository (replace with your repo URL)
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/lifedrop.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy Blueprint on Render
1. Go to your **[Render Dashboard](https://dashboard.render.com)**.
2. Click the **"New +"** button in the top navigation and select **"Blueprint"**.
3. Connect your GitHub account and select your **`lifedrop`** repository.
4. Render will parse `render.yaml` and display the 3 resources:
   - `lifedrop-db` (PostgreSQL Database)
   - `lifedrop-api` (Node Web Service)
   - `lifedrop-frontend` (Static Site)
5. Fill in the requested sync variables:
   - **`ADMIN_PASSKEY_PIN`**: Enter your 6-digit administrative passkey (e.g., `901234`).
   - Leave `FRONTEND_URL` and `VITE_API_BASE_URL` blank for the initial build; you can fill them once Render assigns the public URLs.
6. Click **"Apply"**. Render will provision the database, run migrations, and launch your services!

### Step 3: Connect Frontend and Backend URLs
Once the initial build finishes, Render assigns public URLs to both services:
- Backend URL: `https://lifedrop-api.onrender.com`
- Frontend URL: `https://lifedrop-frontend.onrender.com`

1. Go to **`lifedrop-frontend`** -> **Environment**:
   - Add / Edit `VITE_API_BASE_URL`: `https://lifedrop-api.onrender.com/api/v1`
   - Trigger a **Manual Deploy** (Clear build cache & deploy).
2. Go to **`lifedrop-api`** -> **Environment**:
   - Set `FRONTEND_URL`: `https://lifedrop-frontend.onrender.com`
   - Set `CORS_ORIGINS`: `https://lifedrop-frontend.onrender.com`
   - Render will automatically restart the backend service.

### Step 4: Seed Initial Accounts & Mock Data
Open the Render dashboard:
1. Navigate to **`lifedrop-api`** -> click the **"Shell"** tab.
2. Run:
   ```bash
   npm run prisma:seed
   ```
3. Your database is now populated with demo administrators (`adminrohan@gmail.com`), blood banks, hospitals, and active inventory!

---

## 🛠️ Method 2: Manual Dashboard Setup (Step-by-Step)

If you prefer to configure each service manually in the Render UI:

### 1. Create the PostgreSQL Database
1. In Render Dashboard, click **New +** -> **PostgreSQL**.
2. Settings:
   - **Name**: `lifedrop-db`
   - **Database**: `lifedrop`
   - **User**: `lifedrop_user`
   - **Region**: `Oregon (US West)` (or closest to your users)
   - **Instance Type**: `Free`
3. Click **Create Database**.
4. Once created, copy the **Internal Database URL** (e.g., `postgresql://lifedrop_user:...@dpg-...-a.oregon-postgres.render.com/lifedrop`).

---

### 2. Create the Backend Web Service
1. Click **New +** -> **Web Service**.
2. Connect your `lifedrop` repository.
3. Configure the service:
   - **Name**: `lifedrop-api`
   - **Region**: Same region as database (e.g. `Oregon`)
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**:
     ```bash
     npm install --include=dev && npm run build && npx prisma migrate deploy
     ```
   - **Start Command**:
     ```bash
     npm start
     ```
   - **Instance Type**: `Free`
4. Add **Environment Variables**:
   | Key | Value | Description |
   |---|---|---|
   | `NODE_ENV` | `production` | Production environment |
   | `DATABASE_URL` | *(paste Internal Database URL)* | Internal connection to Postgres |
   | `JWT_ACCESS_SECRET` | *(generate random 64-char string)* | e.g., `node -e "console.log(crypto.randomBytes(32).toString('hex'))"` |
   | `JWT_ACCESS_EXPIRES_IN` | `15m` | Access token lifespan |
   | `REFRESH_TOKEN_EXPIRES_DAYS` | `7` | Refresh session lifespan |
   | `ADMIN_PASSKEY_PIN` | `901234` | Super-admin elevation PIN |
   | `SMS_PROVIDER` | `mock` | SMS notification provider |
   | `LOG_LEVEL` | `info` | Structured logging |
   | `FRONTEND_URL` | `https://lifedrop-frontend.onrender.com` | Primary frontend origin |
   | `CORS_ORIGINS` | `https://lifedrop-frontend.onrender.com` | Allowed CORS origins |

5. Under **Advanced Settings**:
   - **Health Check Path**: `/health`
6. Click **Create Web Service**.

---

### 3. Create the Frontend Static Site
1. Click **New +** -> **Static Site**.
2. Connect your `lifedrop` repository.
3. Configure:
   - **Name**: `lifedrop-frontend`
   - **Root Directory**: `.` (leave default)
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Add **Environment Variables**:
   | Key | Value |
   |---|---|
   | `VITE_API_BASE_URL` | `https://lifedrop-api.onrender.com/api/v1` |
5. Add **Rewrite Rule** (for client-side routing / React SPA):
   - Go to **Redirects / Rewrites** tab.
   - Click **Add Rule**:
     - **Type**: `Rewrite`
     - **Source**: `/*`
     - **Destination**: `/index.html`
6. Click **Create Static Site**.

---

## 🩺 Verification & Health Checks

Once deployed, verify everything is healthy:
1. **API Liveness**: `https://<your-api>.onrender.com/health` (should return `{"status":"ok"}`)
2. **Database Readiness**: `https://<your-api>.onrender.com/health/ready` (should return `{"status":"ready","database":"connected"}`)
3. **Swagger API Docs**: `https://<your-api>.onrender.com/docs`
4. **Frontend UI**: Visit `https://<your-frontend>.onrender.com`, log in with `adminrohan@gmail.com` / `Admin@123` (PIN `901234`).
