function onFormSubmit(e) {
  // IMPORTANT: You need to use a PRODUCTION API key, not the dev key
  // Get this from: https://cloud.trigger.dev/projects/v3/proj_gnbfkqigjkhajdkocsxd/apikeys
  var TRIGGER_API_KEY = "tr_dev_FqeRJ2NtpBpe0eXoo704";  // Replace with production key!

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

    // Correct production endpoint format
    var url = "https://api.trigger.dev/api/v1/tasks/process-support-ticket/trigger";

    var options = {
      method: "post",
      contentType: "application/json",
      headers: {
        Authorization: "Bearer " + TRIGGER_API_KEY,
        "Content-Type": "application/json"
      },
      payload: JSON.stringify({
        payload: {
          name: name,
          email: email,
          message: message
        }
      }),
      muteHttpExceptions: true
    };

    var response = UrlFetchApp.fetch(url, options);
    var responseCode = response.getResponseCode();
    var responseText = response.getContentText();

    Logger.log("Response code: " + responseCode);

    if (responseCode >= 200 && responseCode < 300) {
      Logger.log("Success! " + responseText);
    } else {
      Logger.log("Error response: " + responseText);
    }

  } catch (error) {
    Logger.log("Error: " + error.toString());
  }
}
