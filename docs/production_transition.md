# Road to Production: The Hardened Roadmap

This document serves as the authoritative guide for transitioning BrandForge from its local `localStorage` development environment to a live, cloud-hosted **Commander Console**. Every phase follows the **Step → Infrastructure → Security** documentation standard.

---

## Phase 1: Environment & Config Governance

Before deployment, you must synchronize your environment variables. 

### ⚙️ Master Environment Config Table

| Variable | Source | Required | Security Level |
| :--- | :--- | :--- | :--- |
| `GEMINI_API_KEY` | Google AI Studio | **Yes** | **Critical** (Server) |
| `OPENAI_API_KEY` | OpenAI Platform | Optional | **Critical** (Server) |
| `APP_URL` | Production Domain | **Yes** | Public/Internal |
| `GOOGLE_CLIENT_ID` | Google Cloud Console | Optional | Public (Client) |
| `GOOGLE_CLIENT_SECRET`| Google Cloud Console | Optional | **Critical** (Server) |
| `VITE_FIREBASE_API_KEY`| Firebase Console | **Yes** | Public (Client) |

- **Step**: Create a `.env.production` file in the project root.
- **Infrastructure**: Use **GitHub Secrets** or **Google Cloud Secret Manager** to inject these keys during CI/CD.
- **Security**: **NEVER** expose the `GOOGLE_CLIENT_SECRET` or `OPENAI_API_KEY` in client-side code prefixing with `VITE_`.

---

## Phase 2: Authentication (Global & Local)

BrandForge requires a hardened identity layer to manage project ownership.

### 1. Email/Password (The Absolute Local Standard)
- **Step**: Enable the **Email/Password** provider in Microsoft/Firebase Authentication.
- **Infrastructure**: Implement the `AuthContext.tsx` registration/login hooks using standard SDK methods.
- **Security**: Implement 8-character minimum passwords and utilize **Recaptcha Enterprise** in the login UI to prevent automated brute-force attacks.

### 2. Google OAuth (Enterprise Handshake)
- **Step**: Configure the OAuth consent screen with your production domain.
- **Infrastructure**: Restrict the redirect URIs strictly to `brandforge.io/auth/callback`.
- **Security**: Enable **Domain Verification** to prevent impersonation.

---

## Phase 3: Firestore Optimization & Security

### 1. Composite Indexing (Query Speed)
- **Step**: Identify query patterns that use multiple filters (e.g., Filtering `projects` by `industry` and `owner`).
- **Infrastructure**: Navigate to the Firebase **Indexes** tab and provision composite indices for your primary collections. 
- **Security**: Without proper indexing, the "Commander Console" speed standard cannot be maintained in production.

### 2. Security Rules (Data Isolation)
- **Step**: Deploy the production `firestore.rules`.
- **Infrastructure**:
  ```javascript
  service cloud.firestore {
    match /databases/{database}/documents {
      match /projects/{project} {
        allow read, write: if request.auth != null && request.auth.uid == resource.data.ownerId;
      }
    }
  }
  ```
- **Security**: Implement **Field-Level Validation** to ensure AI results injected into Firestore conform to the `BrandStrategy` JSON schema.

---

## Phase 4: Atomic Deployment & Scaling

### 1. Build & Sanitization
- **Step**: Execute `npm run build`.
- **Infrastructure**: Use a **Vite 6** build target that optimizes for modern browsers (ES2022+).
- **Security**: Remove all `.map` files from the `dist/` directory to prevent reverse-engineering of the S.I.P logic.

### 2. SSL & Global Frame Integrity
- **Step**: Provision a custom domain with **Wildcard SSL**.
- **Infrastructure**: Ensure **HSTS (HTTP Strict Transport Security)** is enabled in your `firebase.json` or server config.
- **Security**: Configure **CORS** to only allow requests from your specific `APP_URL`.

---

*Copyright © 2026 TANATEQ INNOVATIONS LTD. All Rights Reserved.*
