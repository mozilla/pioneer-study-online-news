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

port.on("PioneerOnlineNews::update", update);

function load() {
  document = content.document; // eslint-disable-line no-native-reassign
  setupButtons();
}

function update() {
  // Clears any text selected in the doorhanger (bug 1416204)
  content.getSelection().removeAllRanges();
}

function setupButtons() {
  const showSurveyButton = document.getElementById("show-survey-button");

  showSurveyButton.addEventListener("click", () => {
    port.emit("PioneerOnlineNews::show-survey");
  });
}
