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
  console.log(data);
  updateRating(data.rating);
}

function updateRating(rating) {
  const biasRatingBar = document.getElementById("online-news-bias-rating");
  const normalizedRating = Math.abs(Math.round(rating * 10));

  for (let i = 1; i <= normalizedRating; i++) {
    const idx = rating > 0 ? 10 + i : 10 - i;
    biasRatingBar.children[idx].setAttribute("class", "fill");
  }
}
