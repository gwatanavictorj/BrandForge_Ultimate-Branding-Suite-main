# BrandForge Operational Manual

This manual contains technical specifications for deploying, maintaining, and scaling the BrandForge platform. It is intended for DevOps engineers and technical leads.

---

## 1. Continuous Deployment (CI/CD)

BrandForge uses GitHub Actions for automated quality assurance and production deployment.

### Production Pipeline Configuration
The deployment pipeline is triggered on every push to the `main` branch. 

**Location**: `.github/workflows/production.yml`

```yaml
name: BrandForge CD
on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install Dependencies
        run: npm ci
        
      - name: Build Application
        run: npm run build
        
      - name: Deploy to Production
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
```

### Essential Secrets
The following secrets must be configured in your GitHub Repository settings:
- `GITHUB_TOKEN`: Automated by GitHub for deployment authentication.
- `FIREBASE_SERVICE_ACCOUNT`: Service account key for Firebase Hosting deployment.
- `GEMINI_API_KEY`: Required for build-time validation scripts.

---

## 2. Containerization (Docker)

To ensure environment parity across the **S.I.P Pipeline**, BrandForge is containerized using Docker.

### Dockerfile
Use this multi-stage build configuration to optimize image size and security.

```dockerfile
# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:18-alpine
WORKDIR /app
RUN npm install -g tsx
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/server.ts ./
RUN npm install --omit=dev
EXPOSE 3000
CMD ["tsx", "server.ts"]
```

### Build & Run
```bash
# Build the image
docker build -t brandforge-suite:v1.0 .

# Run the container with environment variables
docker run -p 3000:3000 \
  -e GEMINI_API_KEY=your_key \
  -e OPENAI_API_KEY=your_key \
  brandforge-suite:v1.0
```

---

## 3. Environment Validation Checklist

Before each release, verify the follow-state of the production environment:

| Category | Requirement | Validation Command |
| :--- | :--- | :--- |
| **Logic** | Node.js v18.0.0+ | `node -v` |
| **Secrets** | All API Keys injected | `printenv | grep _API_KEY` |
| **Auth** | OAuth Redirects verified | Check GC Console for production URIs |
| **Persistence** | Firestore Rules active | `firebase firestore:rules:get` |
| **Portability** | JSON Import/Export test | Manual verification in Settings > Data |

---

## 4. Contribution Protocol

To maintain the **Commander Console** high-density standard, all technical contributions must follow these steps:

1. **Station Architecture**: New modules must be added as "Stations" in `src/components/` and registered in `Dashboard.TOOL_OPTIONS`.
2. **Data Inheritance**: Ensure all new state is captured in `src/types.ts` and successfully inherited by the `pdfService`.
3. **Anatomical Consistency**: Adhere to the **Zero-Scroll** UI constraint (ensure the main workbench fits within the viewport).
4. **Logic Isolation**: Keep complex AI orchestration logic within `brandService.ts` rather than component files.

---
*Operational Document Version: 1.0.0*
*Certified by Commit: 36b05a6*
