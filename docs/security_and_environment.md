# Security & Environment Configuration

BrandForge relies on sensitive AI and Cloud API integrations. This document provides guidelines for managing keys, OAuth credentials, and environment-specific variables.

## Sensitive API Keys

The following keys are required for full platform functionality:

- **GEMINI_API_KEY**: Required for the Brand Strategy Engine and Logo Assistant (Nano Banana).
- **ANTHROPIC_API_KEY**: (Optional) Secondary intelligence provider.
- **OPENAI_API_KEY**: Required for DALL-E 3 visual inspiration.

### Local Management
Keys should be stored in a `.env` file in the project root. **Never commit `.env` to version control.**

```env
GEMINI_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
PORT=3000
```

## Google OAuth & Form Extraction

The Brand Discovery tool integrates with Google Forms to extract data. This requires professional OAuth configuration in the [Google Cloud Console](https://console.cloud.google.com/).

### Required Scopes
- `https://www.googleapis.com/auth/forms.responses.readonly`
- `https://www.googleapis.com/auth/userinfo.profile`

### Handling Scopes in Production
- Ensure the OAuth Consent Screen is configured with the correct BrandForge identity.
- Production environments must use verified domains for OAuth redirects.

## Production Secret Strategy

When transitioning to a hosted environment (e.g., Firebase, Vercel, AWS):

1. **Secret Managers**: Use Google Secret Manager or Firebase Secrets instead of plain environment variables.
2. **Key Rotation**: Rotate your `GEMINI_API_KEY` every 90 days.
3. **CORS Hardening**: In `server.ts`, restrict CORS origins strictly to your production URL.

## Local API Proxy Security

The local Express server (`server.ts`) acts as a proxy to avoid CORS issues with third-party APIs. 
- The proxy should only allow requests from the trusted frontend origin.
- Sensitive headers (like Bearer tokens) are injected at the server level to prevent exposure in the client-side network tab.
