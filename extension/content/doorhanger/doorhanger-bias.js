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

function update(data) {
  const rating = data.rating;
  const biasRating = document.getElementById("bias-rating");

  // Clears any text selected in the doorhanger (bug 1416204)
  content.getSelection().removeAllRanges();

  /**
   * The rating is -2.0 to 2.0 so we multiple by 10 and divide by 2
   * and then round to get an integer value from -10 to 10.
   */
  const normalizedRating = Math.round(rating * 10 / 2);

  for (const child of biasRating.children) {
    child.setAttribute("class", "");
  }

  if (normalizedRating === 0) {
    // Highlight the two boxes on either side of the center line
    biasRating.children[10 - 1].setAttribute("class", "fill");
    biasRating.children[10 + 1].setAttribute("class", "fill");
  } else {
    for (let i = 1; i <= Math.abs(normalizedRating); i++) {
      const idx = rating > 0 ? 10 + i : 10 - i;
      biasRating.children[idx].setAttribute("class", "fill");
    }
  }
}

function setupButtons() {
  const agreeButton = document.getElementById("agree-button");
  const disagreeButton = document.getElementById("disagree-button");
  const closeButton = document.getElementById("close-button");
  const learnMoreLink = document.getElementById("learn-more-link");

  agreeButton.addEventListener("click", () => {
    port.emit("PioneerOnlineNews::agree");
  });

  disagreeButton.addEventListener("click", () => {
    port.emit("PioneerOnlineNews::disagree");
  });

  closeButton.addEventListener("click", () => {
    port.emit("PioneerOnlineNews::dismiss");
  });

  learnMoreLink.addEventListener("click", ev => {
    ev.preventDefault();
    port.emit("PioneerOnlineNews::learn-more");
  });
}
