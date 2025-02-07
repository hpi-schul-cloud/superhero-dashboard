$(document).ready(() => {
    fileInput();
});

function fileInput() {
    document
    .querySelector("#batchDeletionFileUploadForm")
    .addEventListener("submit", function (event) {
      event.preventDefault();
    const fileInput = document.getElementById("file");
    const batchTitle = document.getElementById("batchTitle").value;
    const reader = new FileReader();
    reader.onload = function (event) {
        const fileContent = event.target.result;
        sendFileContent(fileContent, batchTitle);
    };
    reader.readAsText(fileInput.files[0]);
    });
}

const sendFileContent = (fileContent, batchTitle) => {
    fetch("/batch-deletion/create-batch-deletion-file", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fileContent, batchTitle }),
    }).then((res) => {
        if (res.ok) {
            console.log("File sent successfully");
            location.reload();
        } else {
            console.error('Error:', res.statusText);
        }
    });
  };