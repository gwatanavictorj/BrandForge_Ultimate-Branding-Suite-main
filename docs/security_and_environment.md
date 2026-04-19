# Strategic Intelligence Vault: Security & Environment Reference

[← Back to Index](../README.md) | [Operations](operations.md) | [Deployment](production_transition.md)

This document provides the authoritative guidelines for managing BrandForge's sensitive AI integrations, Cloud API credentials, and environment-specific governance.

---

## 🔑 Sensitive API Credentials
BrandForge relies on high-fidelity AI models. The following keys are required for full platform tactical capability.

*   **`GEMINI_API_KEY`**: Drives the Brand Strategy Engine and Logo Assistant (Nano Banana).
*   **`OPENAI_API_KEY`**: Optional provider for DALL-E 3 visual inspiration.
*   **`ANTHROPIC_API_KEY`**: Optional alternative intelligence provider.

### Local Development Standard
Keys must be stored in a `.env` file in the project root. **Commiting these values to version control is a critical security failure.**

```env
GEMINI_API_KEY=v1_xxxx_xxxx
OPENAI_API_KEY=sk_xxxx_xxxx
GOOGLE_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOXXXX-xxxx
```

---

## 🧬 Google OAuth & Data Ingestion
The Brand Discovery extraction engine requires professional-grade OAuth2 configuration in the [Google Cloud Console](https://console.cloud.google.com/).

### Required OAuth Scopes
| Scope | Purpose |
| :--- | :--- |
| `forms.responses.readonly` | Enables the extraction of client qualitative DNA. |
| `userinfo.profile` | Handles identity mapping for project ownership. |

### Production Governance
*   Ensure the **OAuth Consent Screen** is verified with the BrandForge industrial identity.
*   Authorized redirect URIs must be constrained strictly to proven production domains (e.g., `https://brandforge.app/auth/callback`).

---

## 🏛️ Production Secret Strategy
When transitioning to a hosted environment (Firebase App Hosting, Google Cloud Run), adhere to the following absolute standards:

1.  **Secret Managers**: Use **Google Secret Manager** or **Firebase Secrets** instead of plain environment variables. Injected secrets are encrypted at rest and in transit.
2.  **Key Rotation Protocol**: Rotate your `GEMINI_API_KEY` every 90 days to minimize exposure risk.
3.  **CORS Hardening**: In `server.ts`, restrict `Access-Control-Allow-Origin` strictly to your production URL.

---

## 🛡️ Proxy Security Anatomy
The local Express server acts as a secured proxy to prevent CORS anomalies and protect client-side integrity.

*   **Credential Masking**: Sensitive headers (Bearer tokens) are injected at the server level, preventing exposure via the browser's Network tab.
*   **Origin Validation**: The proxy layer rejects any request not originating from the trusted development or production frontend.

---

*Copyright © 2026 TANATEQ INNOVATIONS LTD. All Rights Reserved.*
*Security Clearance: L1-Industrial Standard*
