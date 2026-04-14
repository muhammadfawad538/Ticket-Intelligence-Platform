# Google Form Setup Instructions

Since I cannot directly create a Google Form for you, here's the quickest way to set it up:

## Quick Setup (5 minutes)

### Step 1: Create Form
1. Go to: https://docs.google.com/forms/create
2. Title: "Support Ticket Form"

### Step 2: Add Questions
Click "+ Add question" and create these 3 questions:

**Question 1:**
- Type: Short answer
- Question: "Name"
- Required: Yes

**Question 2:**
- Type: Short answer
- Question: "Email"
- Required: Yes

**Question 3:**
- Type: Paragraph
- Question: "Describe your issue"
- Required: Yes

### Step 3: Set Up Webhook
1. Click the 3 dots menu (⋮) → "Script editor"
2. Delete any existing code
3. Paste this code:

```javascript
const TRIGGER_SECRET_KEY = "tr_dev_FqeRJ2NtpBpe0eXoo704";
const TRIGGER_ENDPOINT = "https://api.trigger.dev/api/v1/tasks/process-support-ticket/trigger";

function onFormSubmit(e) {
  try {
    var responses = e.response.getItemResponses();
    var name = responses[0].getResponse();
    var email = responses[1].getResponse();
    var message = responses[2].getResponse();

    var payload = {
      name: name,
      email: email,
      message: message
    };

    var options = {
      method: "post",
      contentType: "application/json",
      headers: {
        "Authorization": "Bearer " + TRIGGER_SECRET_KEY
      },
      payload: JSON.stringify(payload)
    };

    var response = UrlFetchApp.fetch(TRIGGER_ENDPOINT, options);
    Logger.log("Ticket triggered: " + response.getContentText());

  } catch (error) {
    Logger.log("Error: " + error.toString());
  }
}
```

4. Click "Save" (💾)
5. Name it: "FormWebhook"

### Step 4: Add Trigger
1. Click the clock icon (⏰) "Triggers"
2. Click "+ Add Trigger"
3. Settings:
   - Function: `onFormSubmit`
   - Event source: `From form`
   - Event type: `On form submit`
4. Click "Save"
5. Authorize when prompted

### Step 5: Test
1. Click "Send" in your form
2. Copy the form URL
3. Fill it out and submit
4. Check your Google Sheet for the new ticket!

---

**Once you've created the form, type "done" and I'll help you deploy to production!**
