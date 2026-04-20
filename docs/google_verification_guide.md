# Google OAuth Verification handbook for BrandForge

To remove the "Unverified App" screen and enable the Google Form extraction feature for all users, you must submit your app for verification in the Google Cloud Console.

## 1. Google Cloud Console Prep
Navigate to: [Google Cloud Console > APIs & Services > OAuth Consent Screen](https://console.cloud.google.com/apis/credentials/consent)

### Required Information
- **App Name**: BrandForge
- **User Support Email**: hello@brand-forge.xyz
- **App Logo**: Upload the original BrandForge logo (from your assets).
- **Application Home Page**: `https://brand-forge.xyz`
- **Application Privacy Policy Link**: `https://brand-forge.xyz/privacy`
- **Application Terms of Service Link**: `https://brand-forge.xyz/terms`
- **Authorized Domains**: Add `brand-forge.xyz`

## 2. Scopes
Ensure you have added the following scopes:
- `.../auth/forms.responses.readonly`
- `.../auth/userinfo.email`
- `.../auth/userinfo.profile`

## 3. The Demo Video (CRITICAL)
Google requires a 1-2 minute YouTube video (unlisted is fine) showing how the app works.

### Video Script/Workflow:
- **Intro**: "This is BrandForge, an agency tool for automated branding strategy."
- **Login**: Show yourself logging in with Google. **IMPORTANT**: The video must show the URL bar with `brand-forge.xyz` visible.
- **OAuth Grant**: Click "Connect Google Form" in the Discovery section. Show the Google sign-in popup.
- **Usage**: Select a form, show the data being extracted into the BrandForge dashboard.
- **Outro**: "We only use this data to pre-populate the branding strategy modules for the user."

## 4. Final Submission
Click **"Submit for Verification"**. It typically takes 2-5 business days for the first round of feedback.

---
> [!NOTE]
> Until verified, you can still use the app by clicking "Advanced" > "Go to brand-forge.xyz (unsafe)" on the warning screen.
