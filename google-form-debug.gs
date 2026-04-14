function onFormSubmit(e) {
  var TRIGGER_SECRET_KEY = "tr_dev_FqeRJ2NtpBpe0eXoo704";
  var TRIGGER_ENDPOINT = "https://api.trigger.dev/api/v3/tasks/process-support-ticket/trigger";

  try {
    // Check if e and e.response exist
    if (!e || !e.response) {
      Logger.log("Error: No form response data received");
      return;
    }

    var responses = e.response.getItemResponses();

    // Check if we have enough responses
    if (responses.length < 3) {
      Logger.log("Error: Expected 3 responses, got " + responses.length);
      return;
    }

    // Match your form field order: Name, Description, Email
    var name = responses[0].getResponse();      // Name (first field)
    var message = responses[1].getResponse();   // Description (second field)
    var email = responses[2].getResponse();     // Email (third field)

    Logger.log("Processing: " + name + " / " + email);

    var payload = JSON.stringify({
      name: name,
      email: email,
      message: message
    });

    Logger.log("Payload: " + payload);

    var options = {
      method: "post",
      contentType: "application/json",
      headers: {
        Authorization: "Bearer " + TRIGGER_SECRET_KEY
      },
      payload: payload,
      muteHttpExceptions: true
    };

    var response = UrlFetchApp.fetch(TRIGGER_ENDPOINT, options);
    var responseCode = response.getResponseCode();
    var responseText = response.getContentText();

    Logger.log("Response code: " + responseCode);
    Logger.log("Response: " + responseText);

    if (responseCode === 200) {
      Logger.log("Success!");
    } else {
      Logger.log("Error: " + responseText);
    }

  } catch (error) {
    Logger.log("Error: " + error.toString());
  }
}
