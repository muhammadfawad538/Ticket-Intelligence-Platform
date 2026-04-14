import { readFileSync } from "fs";

async function testSheetAccess() {
  console.log("Testing Google Sheet access...\n");

  const serviceAccount = JSON.parse(readFileSync("./service-account.json", "utf-8"));
  const sheetId = "1-lKLQkPxIgorVpD51tBMfU4XEVb69ryaVMJYhFrFlno";

  // Get access token
  const accessToken = await getAccessToken(serviceAccount);
  console.log("✅ Got access token");

  // Get sheet info
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const data = await response.json();
  console.log("\n📊 Sheet info:");
  console.log("Title:", data.properties.title);
  console.log("Sheets:");
  data.sheets.forEach(sheet => {
    console.log(`  - ${sheet.properties.title} (${sheet.properties.gridProperties.rowCount} rows)`);
  });

  // Try to read data
  const firstSheet = data.sheets[0].properties.title;
  const readResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(firstSheet)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const readData = await readResponse.json();
  console.log(`\n📖 Data in ${firstSheet}:`);
  console.log(`Rows: ${readData.values ? readData.values.length : 0}`);
  if (readData.values && readData.values.length > 0) {
    console.log("Last 3 rows:");
    readData.values.slice(-3).forEach(row => console.log(row));
  }
}

// Helper functions (same as in process-ticket.ts)
async function getAccessToken(serviceAccount) {
  const jwtHeader = { alg: "RS256", typ: "JWT" };
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
  return data.access_token;
}

async function createJWT(header, payload, privateKey) {
  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const message = `${headerB64}.${payloadB64}`;

  const pemHeader = "-----BEGIN PRIVATE KEY-----";
  const pemFooter = "-----END PRIVATE KEY-----";
  const pemContents = privateKey.substring(
    pemHeader.length,
    privateKey.length - pemFooter.length - 1
  ).replace(/\s/g, "");

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
    new TextEncoder().encode(message)
  );

  const signatureB64 = base64UrlEncode(signature);
  return `${message}.${signatureB64}`;
}

function base64UrlEncode(data) {
  let base64;
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

testSheetAccess();
