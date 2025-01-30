const MAX_FILE_SIZE_MB = 4;

const toBase64 = (file) => new Promise((resolve, reject) => {
	const reader = new FileReader();
	reader.readAsDataURL(file);
	reader.onload = () => resolve(reader.result);
	reader.onerror = (error) => reject(error);
});

const loadPolicyFile = () => {
	const file = document.querySelector('#policy-input').files[0];
	toBase64(file).then((base64file) => {
		const reader = new FileReader();
		reader.addEventListener('load', (evt) => {
			if (!file.type.match('application/pdf')) {
				$.showNotification('nur PDF Dateien werden unterstützt', 'danger', true);
				document.querySelector('#policy-input').value = '';
				document.querySelector('#policy-file-name').innerHTML = '';
				document.querySelector('#policy-file-data').value = '';
				document.querySelector('#policy-file-logo').style.display = 'none';
				return;
			}
			const filesize = ((file.size / 1024) / 1024).toFixed(4); // MB

			if (filesize > MAX_FILE_SIZE_MB) {
				$.showNotification(
					`PDF Datei ist zu groß. Maximal ${{MAX_FILE_SIZE_MB}}MB`, 'danger', true,
				);
				return;
			}
			document.querySelector('#policy-file-name').innerHTML = `${file.name} (${filesize}MB)`;
			document.querySelector('#policy-file-logo').style.display = 'inline';
			document.querySelector('#policy-file-data').value = base64file;
		}, false);
		if (file) {
			reader.readAsDataURL(file);
		}
	});
};

$(document).ready(() => {
	console.log("Management.js geladen");
	const $addConsentModal = $('.add-modal--policy');

	$('.btn-add-modal--policy').on('click', (e) => {
		e.preventDefault();
		populateModalForm($addConsentModal, {
			title: "Rechtliches Dokument hinzufügen",
			closeLabel: "Abbrechen",
			submitLabel: "Hinzufügen",
		});
		$addConsentModal.appendTo('body').modal('show');
	});

	document.querySelector('#policy-input').addEventListener('change', loadPolicyFile, false);
});



