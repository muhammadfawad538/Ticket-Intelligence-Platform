// Alternative approach: Check for new form responses every minute

var TRIGGER_SECRET_KEY = "tr_dev_FqeRJ2NtpBpe0eXoo704";
var TRIGGER_ENDPOINT = "https://api.trigger.dev/api/v3/tasks/process-support-ticket/trigger";
var PROCESSED_RESPONSES_KEY = "processedResponses";

function checkNewResponses() {
  try {
    var form = FormApp.getActiveForm();
    var responses = form.getResponses();

    // Get list of already processed response IDs
    var processedIds = getProcessedIds();

    Logger.log("Total responses: " + responses.length);
    Logger.log("Already processed: " + processedIds.length);

    // Process only new responses
    for (var i = 0; i < responses.length; i++) {
      var response = responses[i];
      var responseId = response.getId();

      if (processedIds.indexOf(responseId) === -1) {
        // New response - process it
        processResponse(response);
        // Mark as processed
        processedIds.push(responseId);
      }
    }

    // Save updated list
    saveProcessedIds(processedIds);

  } catch (error) {
    Logger.log("Error: " + error.toString());
  }
}

function processResponse(response) {
  try {
    var itemResponses = response.getItemResponses();

    if (itemResponses.length < 3) {
      Logger.log("Not enough responses");
      return;
    }

    var name = itemResponses[0].getResponse();
    var message = itemResponses[1].getResponse();
    var email = itemResponses[2].getResponse();

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
      payload: payload,
      muteHttpExceptions: true
    };

    var apiResponse = UrlFetchApp.fetch(TRIGGER_ENDPOINT, options);
    Logger.log("Response: " + apiResponse.getContentText());

  } catch (error) {
    Logger.log("Error processing response: " + error.toString());
  }
}

function getProcessedIds() {
  var props = PropertiesService.getScriptProperties();
  var stored = props.getProperty(PROCESSED_RESPONSES_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveProcessedIds(ids) {
  var props = PropertiesService.getScriptProperties();
  props.setProperty(PROCESSED_RESPONSES_KEY, JSON.stringify(ids));
}
