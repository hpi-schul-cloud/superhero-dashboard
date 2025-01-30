$(document).ready(() => {
  console.log("batch-deletion.js geladen");

  document
    .querySelector("#batchDeletionFileInput")
    .addEventListener("change", addFile);
});

const addFile = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const content = e.target.result;
    document.getElementById("csvContent").textContent = content;
  };
  reader.readAsText(file);
};
