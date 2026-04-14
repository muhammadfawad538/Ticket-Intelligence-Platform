import { readFileSync } from "fs";

const credentials = JSON.parse(readFileSync("./credentials.json", "utf-8")).installed;
const CLIENT_ID = credentials.client_id;
const CLIENT_SECRET = credentials.client_secret;

console.log("🔐 Gmail OAuth Token Generator (Manual Method)\n");
console.log("Step 1: Copy this URL and paste it in your browser:\n");

const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=urn:ietf:wg:oauth:2.0:oob&response_type=code&scope=https://www.googleapis.com/auth/gmail.send&access_type=offline&prompt=consent`;

console.log(authUrl);
console.log("\nStep 2: Sign in and authorize the app");
console.log("Step 3: Copy the authorization code from the browser");
console.log("Step 4: Paste it below and press Enter\n");

process.stdout.write("Enter authorization code: ");

process.stdin.once("data", async (data) => {
  const code = data.toString().trim();

  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: "urn:ietf:wg:oauth:2.0:oob",
        grant_type: "authorization_code",
      }),
    });

    const result = await response.json();

    if (result.refresh_token) {
      console.log("\n✅ Success! Your refresh token:\n");
      console.log(result.refresh_token);
      console.log("\n📝 Update your .env file:");
      console.log(`GMAIL_REFRESH_TOKEN=${result.refresh_token}\n`);
    } else {
      console.error("\n❌ Error:", result);
    }
  } catch (error) {
    console.error("\n❌ Error:", error);
  }

  process.exit(0);
});
