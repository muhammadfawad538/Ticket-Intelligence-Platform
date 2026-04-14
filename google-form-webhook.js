// Google Apps Script - Paste this in the Script Editor
// Setup: Click "Triggers" (clock icon) → Add Trigger → onFormSubmit → On form submit

const TRIGGER_SECRET_KEY = "tr_dev_FqeRJ2NtpBpe0eXoo704";
const TRIGGER_ENDPOINT = "https://api.trigger.dev/api/v1/tasks/process-support-ticket/trigger";

function onFormSubmit(e) {
  try {
    const responses = e.response.getItemResponses();

    // Extract form values
    const name = responses[0].getResponse();
    const email = responses[1].getResponse();
    const message = responses[2].getResponse();

    // Prepare payload
    const payload = {
      name: name,
      email: email,
      message: message
    };

    // Send to Trigger.dev
    const options = {
      method: "post",
      contentType: "application/json",
      headers: {
        "Authorization": `Bearer ${TRIGGER_SECRET_KEY}`
      },
      payload: JSON.stringify(payload)
    };

    const response = UrlFetchApp.fetch(TRIGGER_ENDPOINT, options);
    Logger.log("✅ Ticket triggered: " + response.getContentText());

  } catch (error) {
    Logger.log("❌ Error: " + error.toString());
  }
}
