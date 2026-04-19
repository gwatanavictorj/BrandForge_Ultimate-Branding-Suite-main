# Deployment & Operations Guide: BrandForge Production Roadmap

[← Back to Overview](../README.md)

This guide provides the authoritative procedures for transitioning BrandForge from a local development environment to a hardened, enterprise-grade production infrastructure. 

---

### In this article
- [Pre-flight Checklist](#pre-flight-checklist)
- [Configuration Reference](#configuration-reference)
- [Identity & Access Management](#identity--access-management)
- [Data Layer Hardening (Firestore)](#data-layer-hardening-firestore)
- [Continuous Deployment (CI/CD)](#continuous-deployment-cicd)
- [Security Hardening Protocols](#security-hardening-protocols)

---

## Pre-flight Checklist
Before initializing the production build, ensure the following absolute standards are satisfied:
- [ ] **Node.js**: v18.0.0+ verified in the production environment.
- [ ] **SSL Certification**: Valid wildcard or domain-specific certificate provisioned.
- [ ] **Secret Hygiene**: All API keys removed from source code and moved to environmental injection.
- [ ] **Browser Compatibility**: Polyfills verified for ES2022+ targets.

---

## Configuration Reference
BrandForge utilizes environmental injection to govern API interaction and platform state.

| Variable | Scope | Required | Security |
| :--- | :--- | :--- | :--- |
| `GEMINI_API_KEY` | Server | **Yes** | Secret Manager |
| `OPENAI_API_KEY` | Server | Optional | Secret Manager |
| `VITE_FIREBASE_CONFIG`| Client | **Yes** | Public/Restricted |
| `GOOGLE_CLIENT_SECRET`| Server | **Yes** | Secret Manager |

---

## Identity & Access Management
BrandForge requires a hardened identity layer to maintain project isolation and ownership.

### Google OAuth2 Configuration
1. Navigate to the **Google Cloud Console** > **APIs & Services**.
2. Configure the **OAuth Consent Screen** with your verified production domain.
3. Restrict **Authorized Redirect URIs** to `https://[your-domain].com/auth/callback`.

> [!IMPORTANT]
> Enable **Domain Verification** to prevent unauthorized identity impersonation.

---

## Data Layer Hardening (Firestore)
For production environments, Firestore must be constrained by strict security rules and optimized via composite indexing.

### Security Rules Protocol
Implement the following rule set to ensure 100% project isolation:
```javascript
service cloud.firestore {
  match /databases/{database}/documents {
    match /projects/{project} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.ownerId;
    }
  }
}
```

### Query Optimization
- Identify query patterns utilizing multiple filters (e.g., `industry` + `ownerId`).
- Manually provision **Composite Indexes** in the Firebase Console to maintain the **Commander Console** speed standard.

---

## Continuous Deployment (CI/CD)
BrandForge utilizes GitHub Actions for automated, zero-downtime deployment.

### Production Workflow (`.github/workflows/deploy.yml`)
```yaml
name: Production Deployment
on:
  push:
    branches: [ main ]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build Assets
        run: |
          npm install
          npm run build
      - name: Deploy to Hosting
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
```

---

## Security Hardening Protocols
Post-deployment, execute the following hardening steps:

1. **HSTS Enforcement**: Enable **HTTP Strict Transport Security** in your `firebase.json` or server headers.
2. **CORS Restriction**: Constraint cross-origin requests strictly to your production `APP_URL`.
3. **Map Sanitization**: Remove all `.map` files from the `/dist` directory before public serving to prevent reverse-engineering of the S.I.P logic.

---

*Copyright © 2026 TANATEQ INNOVATIONS LTD. All Rights Reserved.*
