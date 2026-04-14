function onFormSubmit(e) {
  var TRIGGER_SECRET_KEY = "tr_dev_FqeRJ2NtpBpe0eXoo704";

  try {
    if (!e || !e.response) {
      Logger.log("Error: No form response data received");
      return;
    }

    var responses = e.response.getItemResponses();

    if (responses.length < 3) {
      Logger.log("Error: Expected 3 responses, got " + responses.length);
      return;
    }

    var name = responses[0].getResponse();
    var message = responses[1].getResponse();
    var email = responses[2].getResponse();

    Logger.log("Processing: " + name + " / " + email);

    // Use the SDK trigger method - this is the correct way for production
    var payload = {
      name: name,
      email: email,
      message: message
    };

    // Trigger via the production API
    var url = "https://api.trigger.dev/api/v1/tasks/trigger";

    var options = {
      method: "post",
      contentType: "application/json",
      headers: {
        Authorization: "Bearer " + TRIGGER_SECRET_KEY
      },
      payload: JSON.stringify({
        taskIdentifier: "process-support-ticket",
        payload: payload
      }),
      muteHttpExceptions: true
    };

    var response = UrlFetchApp.fetch(url, options);
    var responseCode = response.getResponseCode();
    var responseText = response.getContentText();

    Logger.log("Response code: " + responseCode);
    Logger.log("Response: " + responseText);

    if (responseCode >= 200 && responseCode < 300) {
      Logger.log("Success!");
    } else {
      Logger.log("Error: " + responseText);
    }

  } catch (error) {
    Logger.log("Error: " + error.toString());
  }
}
