# Vercel Deployment Guide

This project is configured for deployment on Vercel.

## Prerequisites

1. A [Vercel Account](https://vercel.com/signup).
2. This repository pushed to GitHub.

## Backend Deployment (Serverless)

The backend is configured to run as a Serverless Function.

1. Go to the [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **"Add New..."** -> **"Project"**.
3. Import your `ai-doc-analyser` repository.
4. **Configure Project:**
   - **Root Directory:** Click "Edit" and select `ai-doc-analyser-backend`.
   - **Framework Preset:** Select "Other".
   - **Environment Variables:** Add your `.env` variables here (e.g., `GROQ_API_KEY`, `PORT` is not needed).
5. Click **Deploy**.

## Frontend Deployment (Static Site)

1. Go to the [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **"Add New..."** -> **"Project"**.
3. Import your `ai-doc-analyser` repository (again).
4. **Configure Project:**
   - **Root Directory:** Click "Edit" and select `ai-doc-analyser-frontend`.
   - **Framework Preset:** Vercel should auto-detect "Vite".
   - **Build Command:** `npm run build` (default).
   - **Output Directory:** `dist` (default).
   - **Environment Variables:** Add `VITE_API_URL` pointing to your deployed Backend URL (e.g., `https://your-backend.vercel.app`).
5. Click **Deploy**.

## CI/CD (Auto-Deployment)

Once you have connected your repository to Vercel as described above:

- **CD (Continuous Deployment):** Vercel will automatically deploy new changes whenever you push to the `main` branch.
- **CI (Continuous Integration):** A GitHub Action has been added to `.github/workflows/ci.yml` which will run your tests automatically on every push to ensure code quality before deployment.
