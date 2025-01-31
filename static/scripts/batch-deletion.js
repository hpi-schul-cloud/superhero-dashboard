$(document).ready(() => {
  document.querySelector('#batchDeletionFileUploadForm').addEventListener('submit', function(e) {
    const fileInput = document.getElementById('file');
    if (!fileInput.files.length) {
      e.preventDefault();
    }
    sendFile(fileInput.files);
  });
});

const sendFile = (files) => {
    const formData = new FormData();
    formData.append('file', files[0]);
    fetch('/batch-deletion/create-batch-deletion-file', {
      method: 'POST',
      body: formData,
    });
};