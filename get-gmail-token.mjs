import http from "http";
import { exec } from "child_process";
import { readFileSync } from "fs";

const credentials = JSON.parse(readFileSync("./credentials.json", "utf-8")).installed;
const CLIENT_ID = credentials.client_id;
const CLIENT_SECRET = credentials.client_secret;
const REDIRECT_URI = "http://localhost";
const SCOPE = "https://www.googleapis.com/auth/gmail.send";

console.log("🔐 Gmail OAuth Token Generator\n");
console.log("This will open your browser to authorize Gmail access.\n");

// Step 1: Generate authorization URL
const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
  `client_id=${CLIENT_ID}&` +
  `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
  `response_type=code&` +
  `scope=${encodeURIComponent(SCOPE)}&` +
  `access_type=offline&` +
  `prompt=consent`;

console.log("Opening browser for authorization...\n");

// Step 2: Start local server to receive callback
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost`);
  const code = url.searchParams.get("code");

  if (code) {
    try {
      // Step 3: Exchange code for tokens
      const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code: code,
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          redirect_uri: REDIRECT_URI,
          grant_type: "authorization_code",
        }),
      });

      const data = await response.json();

      if (data.refresh_token) {
        console.log("\n✅ Success! Your refresh token:\n");
        console.log(data.refresh_token);
        console.log("\n📝 Add this to your .env file:");
        console.log(`GMAIL_REFRESH_TOKEN=${data.refresh_token}\n`);

        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(`
          <html>
            <body style="font-family: Arial; padding: 50px; text-align: center;">
              <h1>✅ Authorization Successful!</h1>
              <p>You can close this window and return to the terminal.</p>
              <p>Your refresh token has been displayed in the terminal.</p>
            </body>
          </html>
        `);

        setTimeout(() => {
          server.close();
          process.exit(0);
        }, 1000);
      } else {
        throw new Error(JSON.stringify(data));
      }
    } catch (error) {
      console.error("❌ Error:", error);
      res.writeHead(500, { "Content-Type": "text/html" });
      res.end(`<html><body><h1>Error</h1><pre>${error}</pre></body></html>`);
      server.close();
      process.exit(1);
    }
  } else {
    res.writeHead(400, { "Content-Type": "text/html" });
    res.end("<html><body><h1>No authorization code received</h1></body></html>");
  }
});

server.listen(80, () => {
  console.log("Local server started on http://localhost\n");

  // Open browser
  const start = process.platform === "darwin" ? "open" :
                process.platform === "win32" ? "start" : "xdg-open";
  exec(`${start} "${authUrl}"`);
});
