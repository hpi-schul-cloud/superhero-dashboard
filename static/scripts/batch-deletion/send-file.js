$(document).ready(() => {
  document
  .querySelector("#batchDeletionFileUploadForm")
  .addEventListener("submit", fileHandler);
});

const fileHandler = (
    event, 
    sendFile = sendFileContent, 
    reader = new FileReader(),
    fileInput = document.getElementById("file"),
    batchTitle = document.getElementById("batchTitle")
  ) => {
    event.preventDefault();
    reader.onload = function (event) {
        const fileContent = event.target.result;
        sendFile(fileContent, batchTitle.value);
    };
    reader.readAsText(fileInput.files[0]);
};

const sendFileContent = (fileContent, batchTitle) => {
    const configOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileContent, batchTitle }),
    };
    fetch("/batch-deletion/create-batch-deletion-file", configOptions)
    .then((res) => {
        if (res.ok) {
            location.reload();
        } else {
            console.error('Error:', res.statusText);
        }
    });
  };