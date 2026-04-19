# Road to Production: Firebase Transition Guide

This document provides a rigorous roadmap for transitioning BrandForge from its local `localStorage` mock to a live, cloud-hosted environment. All steps follow the **Step → Infrastructure → Security** documentation standard.

---

## Phase 1: Cloud Foundation & Infrastructure

### 1. Project Initialization
- **Step**: Go to the [Firebase Console](https://console.firebase.google.com/) and initialize a new project.
- **Infrastructure**: Provision a "Web App" and record the API Key, Auth Domain, and Project ID.
- **Security**: In the Google Cloud Console, restrict the API key to only allow requests from your production domain (e.g., `brandforge.io`).

### 2. CLI Configuration
- **Step**: Initialize the workspace using `firebase init`.
- **Infrastructure**: Select **Hosting**, **Firestore**, and **Authentication**.
- **Security**: Ensure `.firebaserc` is ignored in `.gitignore` to prevent accidental credential exposure in cross-team environments.

---

## Phase 2: Authentication (Global & Local)

BrandForge requires a unified state-aware authentication layer. Transition the `src/firebase.ts` mock to the following standard:

### 1. Email/Password (Local Sign-In)
- **Step**: Enable the **Email/Password** provider in the Firebase Auth dashboard.
- **Infrastructure**: Implement the registration/login logic in `src/AuthContext.tsx`:
  ```typescript
  import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
  
  const auth = getAuth();
  
  // Registration
  export const registerLocal = (email, password) => 
    createUserWithEmailAndPassword(auth, email, password);
    
  // Login
  export const loginLocal = (email, password) => 
    signInWithEmailAndPassword(auth, email, password);
  ```
- **Security**: Implement robust front-end validation (min 8 chars, 1 special char) and utilize Firebase's built-in **Brute Force Protection**.

### 2. Google Sign-In (Enterprise Access)
- **Step**: Enable the **Google** provider and configure your OAuth consent screen.
- **Infrastructure**: Use `signInWithPopup` with `GoogleAuthProvider`.
- **Security**: In production, prefer `signInWithRedirect` for mobile browser stability.

---

## Phase 3: Firestore Persistence & Schemas

### 1. Data Hardening
- **Step**: Deploy the production rules located in `firestore.rules`.
- **Infrastructure**: Provision the database in **Production Mode** to ensure all access is denied by default.
- **Security**: 
  ```javascript
  // Standard Security Policy
  match /users/{userId} {
    allow read, write: if request.auth != null && request.auth.uid == userId;
  }
  ```

---

## Phase 4: Environmental Parity (AI Governance)

### 1. API Key Sanitization
- **Infrastructure**: Ensure all AI keys (Gemini/OpenAI) are prefixed with `VITE_` for client-side injection during the build process.
- **Security**: **NEVER** commit your `.env.local` or `.env.production` files. Use GitHub Secrets or Vercel Environment Variables.

### 2. Quota & Cost Management
- **Infrastructure**: Set up billing alerts in both Google Cloud (Gemini) and OpenAI dashboards.
- **Security**: Implement rate-limiting in your server proxy (`server.ts`) to prevent API key depletion during unauthorized automated scraping.

---

## Phase 5: Build & Deployment

### 1. Atomic Deployment
- **Step**: Execute `npm run build && firebase deploy --only hosting`.
- **Infrastructure**: Verify that the build output (dist/ folder) does not contain any sensitive `.map` files that expose source code.
- **Security**: Enable **SSL Enforcement** and **HSTS** in the Firebase Hosting configuration (`firebase.json`).

*Copyright © 2026 TANATEQ INNOVATIONS LTD.*
