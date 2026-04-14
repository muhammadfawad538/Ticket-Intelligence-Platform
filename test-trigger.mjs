import { tasks } from "@trigger.dev/sdk/v3";
import { readFileSync } from "fs";

// Load .env file manually
const envFile = readFileSync(".env", "utf-8");
envFile.split("\n").forEach(line => {
  const match = line.match(/^([^=:#]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim();
    if (key && value) {
      process.env[key] = value;
    }
  }
});

async function testTicket() {
  console.log("🎫 Triggering test support ticket...\n");

  const payload = {
    name: "John Doe",
    email: "test@example.com",
    message: "I was charged twice for my subscription this month! This is unacceptable!!!",
  };

  try {
    const handle = await tasks.trigger("process-support-ticket", payload);

    console.log("✅ Ticket triggered successfully!");
    console.log("📋 Run ID:", handle.id);
    console.log("\n🔗 View in dashboard:");
    console.log(`   https://cloud.trigger.dev/projects/proj_gnbfkqigjkhajdkocsxd/runs/${handle.id}`);
    console.log("\n⏳ The task will:");
    console.log("   1. Analyze the ticket (category, sentiment, priority)");
    console.log("   2. Generate an AI response");
    console.log("   3. Send email to test@example.com");
    console.log("   4. Log to Google Sheet");
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

testTicket();
