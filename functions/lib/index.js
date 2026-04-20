"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const https_1 = require("firebase-functions/v2/https");
const express_1 = __importDefault(require("express"));
const googleapis_1 = require("googleapis");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const admin = __importStar(require("firebase-admin"));
const crypto_1 = __importDefault(require("crypto"));
admin.initializeApp();
const db = admin.firestore();
const app = (0, express_1.default)();
app.set('trust proxy', 1);
app.use((0, cors_1.default)({ origin: true, credentials: true }));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json());
// Strict rate limiting for the API
const apiLimiter = (0, express_rate_limit_1.default)({
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
const getBaseUrl = (req) => {
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
        }
        catch (e) { }
    }
    const matched = WHITELIST.find(w => host.includes(w));
    if (matched)
        return `https://${matched}`;
    if (host.includes('localhost')) {
        const protocol = req.protocol === 'http' ? 'http' : 'https';
        return `${protocol}://${host}`;
    }
    return 'https://brandforge-492618.web.app';
};
const getOAuth2Client = (redirectUri) => {
    const cid = process.env.GOOGLE_CLIENT_ID;
    const csec = process.env.GOOGLE_CLIENT_SECRET;
    return new googleapis_1.google.auth.OAuth2(cid, csec, redirectUri || "https://brandforge-492618.web.app/auth/callback");
};
app.get("/api/auth/google/url", (req, res) => {
    const clientOrigin = req.query.origin || getBaseUrl(req);
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
            const decodedState = JSON.parse(Buffer.from(state, 'base64').toString());
            if (decodedState.origin)
                targetOrigin = decodedState.origin;
        }
        catch (e) {
            console.error("Failed to parse state origin", e);
        }
    }
    try {
        const oauth2Client = getOAuth2Client();
        const { tokens } = await oauth2Client.getToken(code);
        // Create a temporary handshake record in Firestore
        const handshakeId = crypto_1.default.randomUUID();
        await db.collection("oauth_handshakes").doc(handshakeId).set({
            tokens,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        // Redirect back to the main domain's finalize endpoint using the parsed origin
        const finalizeUrl = `${targetOrigin}/api/auth/finalize?code=${handshakeId}`;
        console.log(`[Auth Callback] Handshake created. Redirecting to: ${finalizeUrl}`);
        res.redirect(finalizeUrl);
    }
    catch (error) {
        console.error("Auth error:", error);
        res.status(500).send("Authentication failed");
    }
});
// Finalize endpoint that actually sets the cookie on the correct domain
app.get("/api/auth/finalize", async (req, res) => {
    const code = req.query.code;
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
        const { tokens } = doc.data();
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
    }
    catch (error) {
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
const getAuthenticatedClient = (req) => {
    const tokensStr = req.cookies.__session;
    if (!tokensStr)
        return null;
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
        const drive = googleapis_1.google.drive({ version: "v3", auth });
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
    }
    catch (error) {
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
        const forms = googleapis_1.google.forms({ version: "v1", auth });
        const response = await forms.forms.responses.list({
            formId
        });
        res.json({ responses: response.data.responses || [] });
    }
    catch (error) {
        console.error("Error listing responses:", error);
        res.status(500).json({ error: "Failed to list responses" });
    }
});
app.get("/api/google/forms/:formId/responses/:responseId", async (req, res) => {
    var _a, _b, _c, _d;
    const auth = getAuthenticatedClient(req);
    if (!auth) {
        res.status(401).json({ error: "Not authenticated" });
        return;
    }
    const { formId, responseId } = req.params;
    try {
        const forms = googleapis_1.google.forms({ version: "v1", auth });
        const response = await forms.forms.responses.get({
            formId,
            responseId
        });
        // Get form metadata to map question IDs to titles
        const formMetadata = await forms.forms.get({ formId });
        const items = formMetadata.data.items || [];
        // Map answers to question titles for better AI extraction
        const answersWithTitles = Object.entries(response.data.answers || {}).map(([questionId, answer]) => {
            var _a;
            const item = items.find((i) => { var _a, _b; return ((_b = (_a = i.questionItem) === null || _a === void 0 ? void 0 : _a.question) === null || _b === void 0 ? void 0 : _b.questionId) === questionId; });
            const title = (item === null || item === void 0 ? void 0 : item.title) || "Unknown Question";
            let textValue = "";
            if ((_a = answer.textAnswers) === null || _a === void 0 ? void 0 : _a.answers) {
                textValue = (answer.textAnswers.answers || []).map((a) => a.value).join(", ");
            }
            return { questionId, title, value: textValue };
        });
        res.json({
            response: response.data,
            formattedAnswers: answersWithTitles
        });
    }
    catch (error) {
        console.error("Error getting response:", ((_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.data) || error);
        const detailedMsg = ((_d = (_c = (_b = error === null || error === void 0 ? void 0 : error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.error) === null || _d === void 0 ? void 0 : _d.message) || error.message || "Failed to get response";
        res.status(500).json({ error: `Google API Error: ${detailedMsg}` });
    }
});
// Export the express app as a Firebase Cloud Function (2nd Gen) called "api"
exports.api = (0, https_1.onRequest)({
    secrets: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GEMINI_API_KEY"],
    invoker: "public",
    maxInstances: 10,
    cors: true
}, app);
//# sourceMappingURL=index.js.map