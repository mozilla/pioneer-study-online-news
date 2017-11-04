"use strict";

let document;

const self = {
  port: {
    on(header, handle) {
      addMessageListener(header, {
        receiveMessage(message) {
          if (message.name === header)
            handle(message.data);
        },
      });
    },
    emit(header, data) {
      sendAsyncMessage(header, data);
    },
  },
};

self.port.on("PioneerOnlineNews::load", (data) => {
  content.addEventListener("load", () => load(data));
});

function load(data) {
  document = content.document;
  updateRating(data.rating);
}

function updateRating(rating) {
  const biasRating = document.getElementById("bias-rating");
  const normalizedRating = Math.abs(Math.round(rating * 10));

  for (let i = 0; i < biasRating.children.length; i++) {
    biasRating.children[i].setAttribute("class", "");
  }

  for (let i = 1; i <= normalizedRating; i++) {
    const idx = rating > 0 ? 10 + i : 10 - i;
    biasRating.children[idx].setAttribute("class", "fill");
  }
}

function setupButtons() {
  const agreeButton = document.getElementById("agree-button");
  const disagreeButton = document.getElementById("disagree-button");

  agreeButton.addEventListener("click", () => {
    self.emit("PioneerOnlineNews::agree");
  });

  disagreeButton.addEventListener("click", () => {
    self.emit("PioneerOnlineNews::disagree");
  });
}
