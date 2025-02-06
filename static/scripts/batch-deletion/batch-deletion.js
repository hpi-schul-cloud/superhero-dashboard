import { fileInput } from './send-file.js';

$(document).ready(() => {
  fileInput();
  document.querySelectorAll(".details-toggle").forEach((button) => {
    button.addEventListener("click", function () {
      const title = this.getAttribute("data-title");

      document.querySelector(".modal-title").innerText = title;
    });
  });
});



const copyToClipboard = (elementId) => {
  var text = document.getElementById(elementId).innerText;
  navigator.clipboard
    .writeText(text)
    .then(() => {
      alert("IDs copied to clipboard!");
    })
    .catch((err) => {
      console.error("Failed to copy text: ", err);
    });
};
