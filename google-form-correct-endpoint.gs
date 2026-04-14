function onFormSubmit(e) {
  // Use the tasks.trigger API from your backend
  var TRIGGER_SECRET_KEY = "tr_dev_FqeRJ2NtpBpe0eXoo704";

  // For production, you'll need to deploy first and use the production endpoint
  // For now, this will trigger via the dev server
  var PROJECT_ID = "proj_gnbfkqigjkhajdkocsxd";
  var TASK_ID = "process-support-ticket";

  // Correct API endpoint format
  var TRIGGER_ENDPOINT = "https://api.trigger.dev/api/v1/projects/" + PROJECT_ID + "/tasks/" + TASK_ID + "/trigger";

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

    if (responseCode >= 200 && responseCode < 300) {
      Logger.log("Success!");
    } else {
      Logger.log("Error: " + responseText);
    }

  } catch (error) {
    Logger.log("Error: " + error.toString());
  }
}
