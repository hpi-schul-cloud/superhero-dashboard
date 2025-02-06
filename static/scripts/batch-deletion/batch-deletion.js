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

const toBase64 = (file) => new Promise((resolve, reject) => {
	const reader = new FileReader();
	reader.readAsDataURL(file);
	reader.onload = () => resolve(reader.result);
	reader.onerror = (error) => reject(error);
});

const loadFile = () => {
	const file = document.querySelector('#file').files[0];
	toBase64(file).then((base64file) => {
		const reader = new FileReader();
		reader.addEventListener('load', (evt) => {
			if (!file.type.match('.csv')) {
				$.showNotification('nur CSV Dateien werden unterstützt', 'danger', true);
				document.querySelector('#file').value = '';
				document.querySelector('#file-name').innerHTML = '';
        console.info(base64file);
				return;
			}
			
			document.querySelector('#file-name').innerHTML = `${file.name}`;
		}, false);
		if (file) {
			reader.readAsDataURL(file);
		}
	});
};

$(document).ready(() => {
	document.querySelector('#file').addEventListener('change', loadFile, false);
});
