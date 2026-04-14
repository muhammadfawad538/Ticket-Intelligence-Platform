import { task } from "@trigger.dev/sdk";
import { z } from "zod";

// Ticket payload schema
const TicketSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  message: z.string(),
});

type TicketPayload = z.infer<typeof TicketSchema>;

interface TicketAnalysis {
  status: "resolved" | "pending" | "escalated";
  priority: "low" | "medium" | "high" | "critical";
  category: "billing" | "technical" | "account" | "general";
  sentiment: "angry" | "neutral" | "positive";
  response: string;
  next_action: string;
  confidence_score: number;
}

export const processTicket = task({
  id: "process-support-ticket",
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 10_000,
  },
  run: async (payload: TicketPayload) => {
    // Validate environment variables
    const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    const sheetId = process.env.GOOGLE_SHEET_ID;

    if (!serviceAccountJson) {
      throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not set");
    }
    if (!sheetId) {
      throw new Error("GOOGLE_SHEET_ID is not set");
    }

    console.log(`Processing ticket from ${payload.email}`);

    // Step 1: Analyze the ticket
    const analysis = analyzeTicket(payload.message);
    console.log(`Analysis: ${analysis.category} | ${analysis.sentiment} | ${analysis.priority}`);

    // Step 2: Get access token for Google Sheets
    const serviceAccount = JSON.parse(serviceAccountJson);
    const sheetsAccessToken = await getAccessToken(serviceAccount);

    // Step 3: Skip email for now
    console.log("Email sending skipped (will be configured later)");

    // Step 4: Log to Google Sheet
    const timestamp = new Date().toISOString();

    // First, verify we can access the sheet and get the first sheet name
    const sheetInfo = await getSheetInfo(sheetId, sheetsAccessToken);
    const firstSheetName = sheetInfo.sheets[0].properties.title;
    console.log(`Using sheet: ${firstSheetName}`);

    await appendToSheet(
      sheetId,
      sheetsAccessToken,
      firstSheetName,
      [
        timestamp,
        payload.name,
        payload.email,
        payload.message,
        analysis.category,
        analysis.sentiment,
        analysis.priority,
        analysis.status,
        analysis.response,
      ]
    );

    console.log("Logged to Google Sheet");

    return {
      success: true,
      ticketId: timestamp,
      analysis,
    };
  },
});

// Ticket analysis logic
function analyzeTicket(message: string): TicketAnalysis {
  const messageLower = message.toLowerCase();

  // Detect category
  const category = detectCategory(messageLower);

  // Detect sentiment
  const sentiment = detectSentiment(messageLower);

  // Assign priority
  const priority = assignPriority(messageLower, sentiment, category);

  // Generate response
  const { response, confidence, status } = generateResponse(
    message,
    category,
    sentiment,
    priority
  );

  // Determine if escalation is needed
  const shouldEscalate =
    (sentiment === "angry" && (priority === "high" || priority === "critical")) ||
    (category === "billing" && (priority === "high" || priority === "critical")) ||
    priority === "critical" ||
    confidence < 0.6;

  const finalStatus = shouldEscalate ? "escalated" : status;
  const nextAction = determineNextAction(finalStatus, category, priority);

  return {
    status: finalStatus,
    priority,
    category,
    sentiment,
    response,
    next_action: nextAction,
    confidence_score: confidence,
  };
}

function detectCategory(message: string): "billing" | "technical" | "account" | "general" {
  const billingKeywords = ["bill", "charge", "payment", "invoice", "refund", "subscription", "price", "cost", "fee"];
  const technicalKeywords = ["error", "bug", "crash", "not working", "broken", "issue", "problem", "login", "access"];
  const accountKeywords = ["account", "password", "username", "profile", "settings", "email", "phone"];

  const scores = {
    billing: billingKeywords.filter(kw => message.includes(kw)).length,
    technical: technicalKeywords.filter(kw => message.includes(kw)).length,
    account: accountKeywords.filter(kw => message.includes(kw)).length,
  };

  const maxScore = Math.max(scores.billing, scores.technical, scores.account);
  if (maxScore === 0) return "general";

  if (scores.billing === maxScore) return "billing";
  if (scores.technical === maxScore) return "technical";
  return "account";
}

function detectSentiment(message: string): "angry" | "neutral" | "positive" {
  const angryIndicators = ["angry", "furious", "unacceptable", "terrible", "worst", "horrible", "disgusting", "frustrated", "ridiculous", "pathetic", "!!!", "scam"];
  const positiveIndicators = ["thank", "great", "excellent", "appreciate", "love", "perfect", "wonderful", "amazing", "happy"];

  const angryCount = angryIndicators.filter(word => message.includes(word)).length;
  const positiveCount = positiveIndicators.filter(word => message.includes(word)).length;

  if (angryCount > positiveCount && angryCount >= 1) return "angry";
  if (positiveCount > angryCount && positiveCount >= 1) return "positive";
  return "neutral";
}

function assignPriority(
  message: string,
  sentiment: "angry" | "neutral" | "positive",
  category: string
): "low" | "medium" | "high" | "critical" {
  const criticalKeywords = ["security", "breach", "hack", "fraud", "unauthorized", "stolen", "emergency"];
  const highKeywords = ["urgent", "asap", "immediately", "critical", "important", "cannot access"];

  if (criticalKeywords.some(kw => message.includes(kw))) return "critical";
  if (sentiment === "angry" && (category === "billing" || category === "account")) return "high";
  if (highKeywords.some(kw => message.includes(kw))) return "high";
  if (category === "billing" || sentiment === "angry") return "medium";
  return "low";
}

function generateResponse(
  message: string,
  category: string,
  sentiment: string,
  priority: string
): { response: string; confidence: number; status: "resolved" | "pending" } {
  const greeting = sentiment === "angry"
    ? "We sincerely apologize for the inconvenience you've experienced."
    : sentiment === "positive"
    ? "Thank you for reaching out!"
    : "Thank you for contacting us.";

  const body = getResponseBody(message, category);
  const closing = sentiment === "angry"
    ? "We value your business and are committed to resolving this promptly."
    : "Please don't hesitate to reach out if you have any questions.";

  const response = `${greeting} ${body} ${closing}`;
  const confidence = calculateConfidence(message, category);
  const status = confidence > 0.7 && (priority === "low" || priority === "medium") ? "resolved" : "pending";

  return { response, confidence, status };
}

function getResponseBody(message: string, category: string): string {
  const messageLower = message.toLowerCase();

  if (category === "billing") {
    if (messageLower.includes("refund")) {
      return "I've reviewed your refund request. Our billing team will process this within 3-5 business days. You'll receive a confirmation email once completed.";
    }
    if (messageLower.includes("charge") || messageLower.includes("payment")) {
      return "I've located your billing information. Please verify the charge details in your account dashboard. If you notice any discrepancies, our billing team will investigate immediately.";
    }
    return "I've forwarded your billing inquiry to our finance team. They'll review your account and respond within 24 hours with a detailed explanation.";
  }

  if (category === "technical") {
    if (messageLower.includes("login") || messageLower.includes("access")) {
      return "I understand you're having trouble accessing your account. Please try clearing your browser cache and cookies, then attempt to log in again. If the issue persists, use the 'Forgot Password' option to reset your credentials.";
    }
    if (messageLower.includes("error") || messageLower.includes("bug")) {
      return "Thank you for reporting this technical issue. Our engineering team has been notified and is investigating. We'll update you within 24-48 hours with a resolution or workaround.";
    }
    return "I've documented your technical issue and escalated it to our support engineers. They'll analyze the problem and contact you with a solution shortly.";
  }

  if (category === "account") {
    if (messageLower.includes("password")) {
      return "To reset your password, click the 'Forgot Password' link on the login page. You'll receive a secure reset link via email within minutes. If you don't receive it, please check your spam folder.";
    }
    return "I've reviewed your account settings. To make the requested changes, please log into your account dashboard and navigate to Settings > Profile. If you need further assistance, our team is here to help.";
  }

  return "I've received your inquiry and our team is reviewing it carefully. We'll provide a detailed response within 24 hours. Your satisfaction is our priority.";
}

function calculateConfidence(message: string, category: string): number {
  if (message.split(" ").length < 5) return 0.4;
  if (category === "general") return 0.5;

  const specificKeywords = ["refund", "login", "password", "charge", "error", "bug"];
  if (specificKeywords.some(kw => message.toLowerCase().includes(kw))) return 0.85;

  return 0.65;
}

function determineNextAction(status: string, category: string, priority: string): string {
  if (status === "escalated") return "Forward to senior support team for immediate review";
  if (status === "pending") return `Await response from ${category} team within 24-48 hours`;
  return "Close ticket and send satisfaction survey";
}

// Google OAuth helper functions
async function getAccessToken(serviceAccount: any): Promise<string> {
  const jwtHeader = {
    alg: "RS256",
    typ: "JWT",
  };

  const now = Math.floor(Date.now() / 1000);
  const jwtClaim = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const jwtToken = await createJWT(jwtHeader, jwtClaim, serviceAccount.private_key);

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwtToken,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Failed to get access token: ${JSON.stringify(data)}`);
  }

  return data.access_token;
}

async function createJWT(header: any, payload: any, privateKey: string): Promise<string> {
  const encoder = new TextEncoder();

  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const message = `${headerB64}.${payloadB64}`;

  // Import the private key
  // Replace literal \n with actual newlines if needed
  const normalizedKey = privateKey.replace(/\\n/g, '\n');

  const pemHeader = "-----BEGIN PRIVATE KEY-----";
  const pemFooter = "-----END PRIVATE KEY-----";

  // Extract just the base64 content between header and footer
  const pemContents = normalizedKey
    .split('\n')
    .filter(line => line && !line.includes('BEGIN') && !line.includes('END'))
    .join('')
    .trim();

  const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryDer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    encoder.encode(message)
  );

  const signatureB64 = base64UrlEncode(signature);
  return `${message}.${signatureB64}`;
}

function base64UrlEncode(data: string | ArrayBuffer): string {
  let base64: string;

  if (typeof data === "string") {
    base64 = btoa(data);
  } else {
    const bytes = new Uint8Array(data);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    base64 = btoa(binary);
  }

  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function getGmailAccessToken(clientId: string, clientSecret: string, refreshToken: string): Promise<string> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Failed to get Gmail access token: ${JSON.stringify(data)}`);
  }

  return data.access_token;
}

async function sendEmail(
  accessToken: string,
  from: string,
  to: string,
  subject: string,
  body: string
): Promise<void> {
  const email = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "Content-Type: text/plain; charset=utf-8",
    "",
    body,
  ].join("\n");

  const encodedEmail = Buffer.from(email)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      raw: encodedEmail,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send email: ${error}`);
  }
}

function createEmailBody(name: string, response: string): string {
  return `Hi ${name},

${response}

Best regards,
Support Team`;
}

async function getSheetInfo(sheetId: string, accessToken: string): Promise<any> {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get sheet info: ${error}`);
  }

  return response.json();
}

async function appendToSheet(
  sheetId: string,
  accessToken: string,
  sheetName: string,
  values: any[]
): Promise<void> {
  const range = `${sheetName}!A1`;
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        values: [values],
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to append to sheet: ${error}`);
  }
}
