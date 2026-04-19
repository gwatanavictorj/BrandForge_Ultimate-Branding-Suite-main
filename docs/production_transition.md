# Road to Production: Firebase Transition Guide

This document provides a step-by-step roadmap for transitioning BrandForge from its current local `localStorage` mock to a live, cloud-hosted production environment using Firebase.

## Phase 1: Cloud Foundation

1. **Create Project**: Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project named `BrandForge`.
2. **Setup Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init
   ```
3. **Register Web App**: Add a new Web App to the project and copy the configuration details.

## Phase 2: Authentication

BrandForge currently simulates auth locally. To go live:
1. **Enable Google Sign-In**: In the Firebase Auth dashboard, enable the Google provider.
2. **Update `src/firebase.ts`**: Replace the mock functions with actual Firebase Auth SDK calls:
   ```typescript
   // Example transition
   import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
   export const auth = getAuth(app);
   export const signInWithGoogle = () => signInWithPopup(auth, new GoogleAuthProvider());
   ```

## Phase 3: Firestore Database

1. **Provision Database**: Create a Firestore database in "Production Mode."
2. **Deploy Rules**: Use the existing `firestore.rules` file in the root directory.
   ```bash
   firebase deploy --only firestore:rules
   ```
3. **Data Schema**: Refer to `firebase-blueprint.json` for the required document structures for `users` and `projects`.

## Phase 4: Production Environment Variables

1. **CI/CD**: If using GitHub Actions, add your `GEMINI_API_KEY` and Firebase Config as Repository Secrets.
2. **Local Production Test**:
   - Create a `.env.production` file.
   - Run `npm run build` followed by `npm run preview` to test the production bundle.

## Phase 5: Deployment

1. **Build & Deploy**:
   ```bash
   npm run build
   firebase deploy --only hosting
   ```
2. **Domain Mapping**: Connect your custom domain in the Firebase Hosting panel and verify SSL certificate status.

## Phase 6: AI Governance

Given the **Sequential Intelligence Pipeline (S.I.P)** requirements, production environments must maintain absolute key security:
1. **Multi-Provider Keys**: Ensure both `VITE_GEMINI_API_KEY` and `VITE_OPENAI_API_KEY` are configured in your hosting provider's environment variables (e.g., Firebase Functions Config or Vercel Secrets).
2. **Quota Management**: Monitor API usage in the Google Cloud Console (Gemini) and OpenAI Dashboard to prevent service interruption during high-traffic branding sessions.
3. **The Data Healer Persistence**: Periodically audit the `brandService.ts` logs (if logging to a cloud sink) to ensure the AI output normalization continues to meet the 100% fidelity standard in production.
