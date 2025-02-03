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

const toggleDetails = (sectionId) => {
    var section = document.getElementById(sectionId);
    if (section.classList.contains('hidden')) {
        section.classList.remove('hidden');
    } else {
        section.classList.add('hidden');
    }
};

const copyToClipboard = (elementId) => {
    var text = document.getElementById(elementId).innerText;
    navigator.clipboard.writeText(text).then(() => {
        alert("IDs copied to clipboard!");
    }).catch(err => {
        console.error("Failed to copy text: ", err);
    });
};