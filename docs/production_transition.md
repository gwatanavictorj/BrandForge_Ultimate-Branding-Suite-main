# Deployment & Operations Guide: Hardened Production Roadmap

[← Back to Index](../README.md) | [Operator Manual](operations.md) | [Vault Reference](security_and_environment.md)

This guide provides the authoritative procedures for transitioning BrandForge from a local development environment to an executive-grade production infrastructure. 

---

## 🏗️ Pre-Flight Verification Checklist
Before initializing the production build, ensure the following absolute standards are satisfied:

- [ ] **Secret Hygiene**: All API keys removed from source code and moved to environmental injection.
- [ ] **Node.js Environment**: v20.x verified in the target production environment.
- [ ] **SSL Certification**: Valid HSTS-compliant certificates provisioned.
- [ ] **Bundle Audit**: Run `npm run build` and verify that the `/dist` directory contains no `.map` files unless debugging is explicitly required.

---

## 🔐 The Configuration Vault
BrandForge utilizes environmental injection to govern API interactions and platform state. 

| Variable | Scope | Requirement | Security Standard |
| :--- | :--- | :--- | :--- |
| `GEMINI_API_KEY` | Server | **Mandatory** | Secret Manager |
| `OPENAI_API_KEY` | Server | Optional | Secret Manager |
| `VITE_FIREBASE_CONFIG` | Client | **Mandatory** | Restricted Public |
| `GOOGLE_CLIENT_SECRET` | Server | **Mandatory** | Secret Manager |

---

## 🧬 Data Layer Hardening (Firestore)

### 1. Security Rules Protocol
For production, Firestore must be constrained to prevent cross-project data leakage. 

```javascript
service cloud.firestore {
  match /databases/{database}/documents {
    match /projects/{project} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.ownerId;
    }
  }
}
```

### 2. Composite Index Provisioning
To maintain the **Commander Console** performance standard, manually provision index patterns for high-frequency queries:
*   `ownerId` (Asc) + `updatedAt` (Desc)
*   `industry` (Asc) + `ownerId` (Asc)

---

## 🚀 Continuous Deployment (CI/CD)
BrandForge utilizes GitHub Actions for hardened, zero-downtime deployments.

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
      - name: Hardened Build
        run: |
          npm install
          npm run build
      - name: Firebase Deploy
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
```

---

## 🛡️ Security Hardening Protocols
Post-deployment, execute the following industrial hardening steps:

1. **HSTS Enforcement**: Enable **HTTP Strict Transport Security** in the hosting configuration.
2. **CORS Restriction**: Explicitly whitelist the production domain in `server.ts` to prevent unauthorized cross-origin requests.
3. **API Key Scoping**: Restrict the `GEMINI_API_KEY` to specific IP addresses (if supported by provider) or rotate credentials every 90 days.

---

*Copyright © 2026 TANATEQ INNOVATIONS LTD. All Rights Reserved.*
*Authoritative Revision: 2.1.0*
