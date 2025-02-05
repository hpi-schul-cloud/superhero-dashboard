$(document).ready(() => {
  document
    .querySelector("#batchDeletionFileUploadForm")
    .addEventListener("submit", function (e) {
      const fileInput = document.getElementById("file");
      if (!fileInput.files.length) {
        e.preventDefault();
      }
    const reader = new FileReader();
    reader.onload = function(event) {
      const fileContent = event.target.result;
      sendFileContent(fileContent);
    };
    reader.readAsText(fileInput.files[0]);
    });

  document.querySelectorAll(".details-toggle").forEach((button) => {
    button.addEventListener("click", function () {
      const title = this.getAttribute("data-title");

      document.querySelector(".modal-title").innerText = title;
    });
  });
});

const sendFileContent = (fileContent) => {
  fetch("/batch-deletion/create-batch-deletion-file", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fileContent }),
  });
};

// const toggleDetails = (sectionId) => {
//     var section = document.getElementById(sectionId);
//     if (section.classList.contains('hidden')) {
//         section.classList.remove('hidden');
//     } else {
//         section.classList.add('hidden');
//     }
// };

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
