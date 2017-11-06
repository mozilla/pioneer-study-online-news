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

port.on("PioneerOnlineNews::update", data => updateUpdate(data));

function load() {
  document = content.document;
  setupButtons();
}

function updateRating(data) {
  const rating = data.rating;
  const biasRating = document.getElementById("bias-rating");

  /**
   * The rating is -2.0 to 2.0 so we multiple by 10 and divide by 2
   * and then round to get an integer value from -10 to 10.
   */
  const normalizedRating = Math.round(rating * 10 / 2);

  for (const child of biasRating.children) {
    child.setAttribute("class", "");
  }

  for (let i = 1; i <= Math.abs(normalizedRating); i++) {
    const idx = rating > 0 ? 10 + i : 10 - i;
    biasRating.children[idx].setAttribute("class", "fill");
  }
}

function setupButtons() {
  const agreeButton = document.getElementById("agree-button");
  const disagreeButton = document.getElementById("disagree-button");
  const learnMoreLink = document.getElementById("learn-more-link");

  agreeButton.addEventListener("click", () => {
    port.emit("PioneerOnlineNews::agree");
  });

  disagreeButton.addEventListener("click", () => {
    port.emit("PioneerOnlineNews::disagree");
  });

  learnMoreLink.addEventListener("click", ev => {
    ev.preventDefault();
    port.emit("PioneerOnlineNews::learn-more");
  });
}