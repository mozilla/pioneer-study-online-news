"use strict";

let document;

const port = {
  on(header, handle) {
    addMessageListener(header, {
      receiveMessage(message) {
        if (message.name === header) {
          handle(message.data);
        }
      },
    });
  },
  emit(header, data) {
    sendAsyncMessage(header, data);
  },
};

port.on("PioneerOnlineNews::load", data => {
  content.addEventListener("load", () => load(data));
});

function load() {
  document = content.document;
  setupButtons();
}

function setupButtons() {
  const showSurveyButton = document.getElementById("show-survey-button");

  showSurveyButton.addEventListener("click", () => {
    port.emit("PioneerOnlineNews::show-survey");
  });
}
