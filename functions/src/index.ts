import { onRequest } from "firebase-functions/v2/https";
import express from "express";
import { google } from "googleapis";
import cookieParser from "cookie-parser";
import cors from "cors";
import rateLimit from "express-rate-limit";
import * as admin from "firebase-admin";
import crypto from "crypto";

admin.initializeApp();
const db = admin.firestore();

const app = express();
app.set('trust proxy', 1);

app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json());

// Strict rate limiting for the API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // 100 requests per 15 minutes per IP
  message: { error: "Too many requests. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api", apiLimiter);

const WHITELIST = [
  'brandforge-492618.web.app',
  'brandforge-492618.firebaseapp.com',
  'brand-forge.xyz'
];

const getBaseUrl = (req: express.Request) => {
  // Try headers in order of reliability for Cloud Run + Hosting
  const forwardedHost = req.get('x-forwarded-host');
  const referer = req.get('referer');
  const host = forwardedHost || req.get('host') || "";
  
  if (referer) {
    try {
      const refUrl = new URL(referer);
      if (WHITELIST.includes(refUrl.hostname)) {
        return `${refUrl.protocol}//${refUrl.host}`;
      }
    } catch (e) {}
  }

  const matched = WHITELIST.find(w => host.includes(w));
  if (matched) return `https://${matched}`;
  
  if (host.includes('localhost')) {
    const protocol = req.protocol === 'http' ? 'http' : 'https';
    return `${protocol}://${host}`;
  }
  
  return 'https://brandforge-492618.web.app';
};

const getOAuth2Client = (redirectUri?: string | null) => {
  const cid = process.env.GOOGLE_CLIENT_ID;
  const csec = process.env.GOOGLE_CLIENT_SECRET;
  
  return new google.auth.OAuth2(
    cid,
    csec,
    redirectUri || "https://brandforge-492618.web.app/auth/callback"
  );
};

app.get("/api/auth/google/url", (req, res) => {
  const clientOrigin = req.query.origin as string || getBaseUrl(req);
  console.log(`[Auth URL] Origin requested: ${clientOrigin}`);
  
  const redirectUri = `${clientOrigin}/auth/callback`;
  const oauth2Client = getOAuth2Client(redirectUri);
  const scopes = [
    "https://www.googleapis.com/auth/forms.responses.readonly",
    "https://www.googleapis.com/auth/forms.body.readonly",
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/userinfo.email"
  ];

  // We pass the origin in the state parameter to ensure we come back to the right domain
  const state = Buffer.from(JSON.stringify({ origin: clientOrigin })).toString('base64');

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    prompt: "consent",
    state: state
  });

  res.json({ url });
});

app.get("/auth/callback", async (req, res) => {
  const { code, state } = req.query;
  if (!code) {
    res.status(400).send("No code provided");
    return;
  }

  // Parse origin from state
  let targetOrigin = getBaseUrl(req);
  if (state) {
    try {
      const decodedState = JSON.parse(Buffer.from(state as string, 'base64').toString());
      if (decodedState.origin) targetOrigin = decodedState.origin;
    } catch (e) {
      console.error("Failed to parse state origin", e);
    }
  }

  try {
    const redirectUri = `${targetOrigin}/auth/callback`;
    const oauth2Client = getOAuth2Client(redirectUri);
    const { tokens } = await oauth2Client.getToken(code as string);
    
    // Create a temporary handshake record in Firestore
    const handshakeId = crypto.randomUUID();
    await db.collection("oauth_handshakes").doc(handshakeId).set({
      tokens,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Redirect back to the main domain's finalize endpoint using the parsed origin
    const finalizeUrl = `${targetOrigin}/api/auth/finalize?code=${handshakeId}`;
    console.log(`[Auth Callback] Handshake created. Redirecting to: ${finalizeUrl}`);
    res.redirect(finalizeUrl);
  } catch (error) {
    console.error("Auth error:", error);
    res.status(500).send("Authentication failed");
  }
});

// Finalize endpoint that actually sets the cookie on the correct domain
app.get("/api/auth/finalize", async (req, res) => {
  const code = req.query.code as string;
  if (!code) {
    res.status(400).send("Missing handshake code");
    return;
  }

  try {
    const handshakeRef = db.collection("oauth_handshakes").doc(code);
    const doc = await handshakeRef.get();

    if (!doc.exists) {
      res.status(404).send("Handshake expired or not found");
      return;
    }

    const { tokens } = doc.data()!;
    
    // Delete the handshake immediately after use
    await handshakeRef.delete();

    // Store tokens in a secure cookie ON THE CORRECT DOMAIN
    res.cookie("__session", JSON.stringify(tokens), {
      httpOnly: true,
      secure: true, 
      sameSite: "lax", 
      path: "/",
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Authentication successful. Finalizing session...</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("Finalize error:", error);
    res.status(500).send("Finalization failed");
  }
});

app.get("/api/auth/status", (req, res) => {
  const tokens = req.cookies.__session;
  console.log(`[Status Check] Host: ${req.get('host')}, Has Tokens: ${!!tokens}`);
  res.json({ connected: !!tokens });
});

app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("__session", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/"
  });
  res.json({ success: true });
});

const getAuthenticatedClient = (req: express.Request) => {
  const tokensStr = req.cookies.__session;
  if (!tokensStr) return null;
  
  const tokens = JSON.parse(tokensStr);
  const client = getOAuth2Client(null);
  client.setCredentials(tokens);
  return client;
};

app.get("/api/google/forms", async (req, res) => {
  const auth = getAuthenticatedClient(req);
  if (!auth) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  try {
    const drive = google.drive({ version: "v3", auth });
    console.log("[List Forms] Attempting to list from Google Drive...");
    const response = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.form' and trashed=false",
      fields: "files(id, name, webViewLink, iconLink)",
      pageSize: 50,
      includeItemsFromAllDrives: true,
      supportsAllDrives: true
    });
    const files = response.data.files || [];
    console.log(`[List Forms] Found ${files.length} forms.`);
    res.json({ forms: files });
  } catch (error: any) {
    console.error("Error listing forms:", error.message || error);
    res.status(500).json({ error: "Failed to list forms", details: error.message });
  }
});

app.get("/api/google/forms/:formId/responses", async (req, res) => {
  const auth = getAuthenticatedClient(req);
  if (!auth) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const { formId } = req.params;

  try {
    const forms = google.forms({ version: "v1", auth });
    const response = await forms.forms.responses.list({
      formId
    });

    res.json({ responses: response.data.responses || [] });
  } catch (error) {
    console.error("Error listing responses:", error);
    res.status(500).json({ error: "Failed to list responses" });
  }
});

app.get("/api/google/forms/:formId/responses/:responseId", async (req, res) => {
  const auth = getAuthenticatedClient(req);
  if (!auth) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const { formId, responseId } = req.params;

  try {
    const forms = google.forms({ version: "v1", auth });
    const response = await forms.forms.responses.get({
      formId,
      responseId
    });

    // Get form metadata to map question IDs to titles
    const formMetadata = await forms.forms.get({ formId });
    const items = formMetadata.data.items || [];
    
    // Map answers to question titles for better AI extraction
    const answersWithTitles = Object.entries(response.data.answers || {}).map(([questionId, answer]: [string, any]) => {
      const item = items.find((i: any) => i.questionItem?.question?.questionId === questionId);
      const title = item?.title || "Unknown Question";
      
      let textValue = "";
      if (answer.textAnswers?.answers) {
        textValue = (answer.textAnswers.answers || []).map((a: any) => a.value).join(", ");
      }

      return { questionId, title, value: textValue };
    });

    res.json({ 
      response: response.data,
      formattedAnswers: answersWithTitles
    });
  } catch (error: any) {
    console.error("Error getting response:", error?.response?.data || error);
    const detailedMsg = error?.response?.data?.error?.message || error.message || "Failed to get response";
    res.status(500).json({ error: `Google API Error: ${detailedMsg}` });
  }
});

// Export the express app as a Firebase Cloud Function (2nd Gen) called "api"
export const api = onRequest({ 
  secrets: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GEMINI_API_KEY"],
  invoker: "public",
  maxInstances: 10,
  cors: true
}, app);
