import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import cookieSession from "cookie-session";
import dotenv from "dotenv";
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

dotenv.config();

const app = express();
const PORT = 3000;

// Google OAuth Client
const googleClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback'
);

app.use(express.json());
app.use(cookieSession({
    name: 'session',
    keys: [process.env.SESSION_SECRET || 'secret-key'],
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    secure: true,
    sameSite: 'none'
}));

// Google OAuth Routes
app.get("/api/auth/google/url", (req, res) => {
    const scopes = [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
    ];

    const authUrl = googleClient.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        include_granted_scopes: true,
    });

    res.json({ url: authUrl });
});

app.get(["/auth/google/callback", "/auth/google/callback/"], async (req, res) => {
    const { code } = req.query;
    if (!code) return res.status(400).send("No code provided");

    try {
        const { tokens } = await googleClient.getToken(code as string);
        googleClient.setCredentials(tokens);

        // Get user info
        const oauth2 = google.oauth2({ version: 'v2', auth: googleClient });
        const userInfo = await oauth2.userinfo.get();

        const email = userInfo.data.email;
        const name = userInfo.data.name;

        if (email) {
            req.session!.userEmail = email;
            req.session!.userName = name;
            
            // Log email to Google Sheets
            await logEmailToSheet(email, name || 'Unknown');
        }

        res.send(`
            <html>
                <body>
                    <script>
                        if (window.opener) {
                            window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS', email: '${email}' }, '*');
                            window.close();
                        } else {
                            window.location.href = '/';
                        }
                    </script>
                    <p>Authentication successful. This window should close automatically.</p>
                </body>
            </html>
        `);
    } catch (error: any) {
        console.error("Google Auth Error:", error);
        res.status(500).send("Authentication failed");
    }
});

app.get("/api/user/me", (req, res) => {
    res.json({
        email: req.session?.userEmail || null,
        name: req.session?.userName || null,
        isLoggedIn: !!req.session?.userEmail
    });
});

app.post("/api/user/logout", (req, res) => {
    req.session = null;
    res.json({ success: true });
});

async function logEmailToSheet(email: string, name: string) {
    const sheetId = process.env.GOOGLE_SHEET_ID;
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!sheetId || !clientEmail || !privateKey) {
        console.warn("Google Sheets configuration missing. Skipping logging.");
        return;
    }

    try {
        const auth = new google.auth.JWT({
            email: clientEmail,
            key: privateKey,
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });

        const sheets = google.sheets({ version: 'v4', auth });
        
        // Append to the first sheet (Sheet1)
        await sheets.spreadsheets.values.append({
            spreadsheetId: sheetId,
            range: 'Sheet1!A:C',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [[email, name, new Date().toISOString()]]
            }
        });
        console.log(`Logged ${email} to Google Sheet`);
    } catch (error) {
        console.error("Error logging to Google Sheet:", error);
    }
}

// Meta OAuth Routes
app.get("/api/auth/meta/url", (req, res) => {
    const redirectUri = process.env.META_REDIRECT_URI || `${req.protocol}://${req.get('host')}/auth/meta/callback`;
    const params = new URLSearchParams({
        client_id: process.env.META_CLIENT_ID!,
        redirect_uri: redirectUri,
        scope: "ads_read,ads_management,business_management,public_profile",
        response_type: "code",
    });
    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
    res.json({ url: authUrl });
});

app.get("/auth/meta/callback", async (req, res) => {
    const { code } = req.query;
    if (!code) return res.status(400).send("No code provided");

    try {
        const redirectUri = process.env.META_REDIRECT_URI || `${req.protocol}://${req.get('host')}/auth/meta/callback`;
        const response = await axios.get(`https://graph.facebook.com/v18.0/oauth/access_token`, {
            params: {
                client_id: process.env.META_CLIENT_ID,
                client_secret: process.env.META_CLIENT_SECRET,
                redirect_uri: redirectUri,
                code,
            },
        });

        const { access_token } = response.data;
        req.session!.metaAccessToken = access_token;

        res.send(`
            <html>
                <body>
                    <script>
                        if (window.opener) {
                            window.opener.postMessage({ type: 'META_AUTH_SUCCESS' }, '*');
                            window.close();
                        } else {
                            window.location.href = '/';
                        }
                    </script>
                    <p>Authentication successful. This window should close automatically.</p>
                </body>
            </html>
        `);
    } catch (error: any) {
        console.error("Meta Auth Error:", error.response?.data || error.message);
        res.status(500).send("Authentication failed");
    }
});

// Meta API Endpoints
app.get("/api/meta/ad-accounts", async (req, res) => {
    const accessToken = req.session?.metaAccessToken;
    if (!accessToken) return res.status(401).json({ error: "Not authenticated" });

    try {
        const response = await axios.get(`https://graph.facebook.com/v18.0/me/adaccounts`, {
            params: {
                access_token: accessToken,
                fields: "name,account_id",
            },
        });
        res.json(response.data);
    } catch (error: any) {
        console.error("Fetch Ad Accounts Error:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to fetch ad accounts" });
    }
});

app.get("/api/meta/campaign-data", async (req, res) => {
    const accessToken = req.session?.metaAccessToken;
    const { adAccountId } = req.query;
    if (!accessToken) return res.status(401).json({ error: "Not authenticated" });
    if (!adAccountId) return res.status(400).json({ error: "Ad Account ID required" });

    try {
        // Fetch campaigns with insights
        const response = await axios.get(`https://graph.facebook.com/v18.0/${adAccountId}/campaigns`, {
            params: {
                access_token: accessToken,
                fields: "name,status,objective,insights{spend,impressions,clicks,purchase_roas,actions}",
                date_preset: "last_30d",
            },
        });

        // Transform Meta data to our Campaign format
        const campaigns = response.data.data.map((c: any) => {
            const insights = c.insights?.data?.[0] || {};
            const actions = insights.actions || [];
            const purchases = actions.find((a: any) => a.action_type === 'purchase')?.value || 0;
            const revenue = actions.find((a: any) => a.action_type === 'omni_purchase')?.value || 0; // Simplified
            
            return {
                id: c.id,
                name: c.name,
                status: c.status,
                spend: parseFloat(insights.spend || 0),
                impressions: parseInt(insights.impressions || 0),
                clicks: parseInt(insights.clicks || 0),
                purchases: parseInt(purchases),
                revenue: parseFloat(revenue),
                roas: parseFloat(insights.purchase_roas?.[0]?.value || 0),
                goal: c.objective,
                audience: 'N/A', // Meta API doesn't give this directly at campaign level easily
                creativeAngle: 'N/A',
                anomalies: []
            };
        });

        res.json({ campaigns });
    } catch (error: any) {
        console.error("Fetch Campaign Data Error:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to fetch campaign data" });
    }
});

// Vite middleware for development
if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
    });
    app.use(vite.middlewares);
} else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
    });
}

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
