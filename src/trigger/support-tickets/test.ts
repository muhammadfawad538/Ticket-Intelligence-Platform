import { processTicket } from "./process-ticket.js";

// Test the ticket processor with sample data
async function testTicket() {
  console.log("Testing support ticket automation...\n");

  const testPayload = {
    name: "John Doe",
    email: "test@example.com",
    message: "I was charged twice for my subscription this month! This is unacceptable!!!",
  };

  try {
    const result = await processTicket.trigger(testPayload);
    console.log("✅ Ticket triggered successfully!");
    console.log("Run ID:", result.id);
    console.log("\nCheck the Trigger.dev dashboard to see the run details.");
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

testTicket();
