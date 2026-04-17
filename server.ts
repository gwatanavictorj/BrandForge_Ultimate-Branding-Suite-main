import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { google } from "googleapis";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

import fs from "fs";

if (fs.existsSync(".env.local")) {
  dotenv.config({ path: ".env.local" });
}
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.APP_URL || 'http://localhost:3000'}/auth/callback`
  );

  // --- OAuth Routes ---

  app.get("/api/auth/google/url", (req, res) => {
    const scopes = [
      "https://www.googleapis.com/auth/forms.responses.readonly",
      "https://www.googleapis.com/auth/forms.body.readonly",
      "https://www.googleapis.com/auth/drive.readonly",
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email"
    ];

    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      prompt: "consent"
    });

    res.json({ url });
  });

  app.get("/auth/callback", async (req, res) => {
    const { code } = req.query;
    if (!code) return res.status(400).send("No code provided");

    try {
      const { tokens } = await oauth2Client.getToken(code as string);
      
      // Store tokens in a secure cookie
      res.cookie("google_tokens", JSON.stringify(tokens), {
        httpOnly: true,
        secure: true,
        sameSite: "none",
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
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("OAuth callback error:", error);
      res.status(500).send("Authentication failed");
    }
  });

  app.get("/api/auth/status", (req, res) => {
    const tokens = req.cookies.google_tokens;
    res.json({ connected: !!tokens });
  });

  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("google_tokens", {
      httpOnly: true,
      secure: true,
      sameSite: "none"
    });
    res.json({ success: true });
  });

  // --- Google Forms API Routes ---

  const getAuthenticatedClient = (req: express.Request) => {
    const tokensStr = req.cookies.google_tokens;
    if (!tokensStr) return null;
    
    const tokens = JSON.parse(tokensStr);
    const client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    client.setCredentials(tokens);
    return client;
  };

  app.get("/api/google/forms", async (req, res) => {
    const auth = getAuthenticatedClient(req);
    if (!auth) return res.status(401).json({ error: "Not authenticated" });

    try {
      const drive = google.drive({ version: "v3", auth });
      // Search for Google Forms
      const response = await drive.files.list({
        q: "mimeType='application/vnd.google-apps.form' and trashed=false",
        fields: "files(id, name, webViewLink, iconLink)",
        pageSize: 50,
        includeItemsFromAllDrives: true,
        supportsAllDrives: true
      });
      console.log("Found forms:", response.data.files);
      res.json({ forms: response.data.files || [] });
    } catch (error) {
      console.error("Error listing forms:", error);
      res.status(500).json({ error: "Failed to list forms" });
    }
  });

  app.get("/api/google/forms/:formId/responses", async (req, res) => {
    const auth = getAuthenticatedClient(req);
    if (!auth) return res.status(401).json({ error: "Not authenticated" });

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
    if (!auth) return res.status(401).json({ error: "Not authenticated" });

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
      const answersWithTitles = Object.entries(response.data.answers || {}).map(([questionId, answer]) => {
        const item = items.find(i => i.questionItem?.question?.questionId === questionId);
        const title = item?.title || "Unknown Question";
        
        // Extract text from different answer types
        let textValue = "";
        if (answer.textAnswers?.answers) {
          textValue = (answer.textAnswers.answers || []).map(a => a.value).join(", ");
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

  // --- Vite Middleware ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
