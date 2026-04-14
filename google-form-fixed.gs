function onFormSubmit(e) {
  var TRIGGER_SECRET_KEY = "tr_dev_FqeRJ2NtpBpe0eXoo704";
  var TRIGGER_ENDPOINT = "https://api.trigger.dev/api/v1/tasks/process-support-ticket/trigger";

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

    var name = responses[0].getResponse();
    var email = responses[1].getResponse();
    var message = responses[2].getResponse();

    Logger.log("Processing: " + name + " / " + email);

    var payload = JSON.stringify({
      name: name,
      email: email,
      message: message
    });

    var options = {
      method: "post",
      contentType: "application/json",
      headers: {
        Authorization: "Bearer " + TRIGGER_SECRET_KEY
      },
      payload: payload
    };

    var response = UrlFetchApp.fetch(TRIGGER_ENDPOINT, options);
    Logger.log("Success: " + response.getContentText());

  } catch (error) {
    Logger.log("Error: " + error.toString());
  }
}
