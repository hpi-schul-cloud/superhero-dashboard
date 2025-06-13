const MAX_FILE_SIZE_MB = 3;

function formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function isProbablyText(file, callback) {
    const reader = new FileReader();
    const blob = file.slice(0, 512);
	reader.addEventListener('load', (e) => {
        const arr = new Uint8Array(e.target.result);
        let nonPrintable = 0;
        for (let i = 0; i < arr.length; i++) {
            if (
                arr[i] !== 9 && arr[i] !== 10 && arr[i] !== 13 &&
                (arr[i] < 32 || arr[i] > 126)
            ) {
                nonPrintable++;
            }
        }
        callback(nonPrintable / arr.length < 0.1);
    });
    reader.readAsArrayBuffer(blob);
}

function resetFormFields() {
    document.querySelector('#batch-title').value = '';
    document.querySelector('#batch-file-name').innerHTML = '';
    document.querySelector('#batch-file-data').value = '';
    document.querySelector('#batch-file-input').value = '';
}

function loadCsvFile() {
    const file = document.querySelector('#batch-file-input').files[0];
    if (!file) return;

    // File size check
	const filesize = ((file.size / 1024) / 1024).toFixed(4); // MB
    if (filesize > MAX_FILE_SIZE_MB) {
        $.showNotification(
            `CSV Datei ist zu groß. Maximal ${MAX_FILE_SIZE_MB}MB`, 'danger', true,
        );
        resetFormFields();
        return;
    }

    // Check file extension and type
    if (!file.name.endsWith('.csv') || (file.type && file.type !== 'text/csv')) {
        $.showNotification('nur CSV Dateien werden unterstützt', 'danger', true);
        resetFormFields();
        return;
    }

    // Heuristic check
    isProbablyText(file, function(isText) {
        if (!isText) {
            $.showNotification('CSV Datei sieht nicht wie eine Textdatei aus', 'danger', true);
            resetFormFields();
            return;
        }

        // Read as text and set hidden input
        const reader = new FileReader();
		reader.addEventListener('load', (e) => {
            const formattedFileSize = formatFileSize(file.size);
            document.querySelector('#batch-file-name').innerHTML = `${file.name} (${formattedFileSize})`;
			document.querySelector('#batch-file-data').value = e.target.result;
        });
        reader.readAsText(file);
    });

    resetFormFields();
}

$(document).ready(() => {
	const $addDeletionModal = $('.add-modal--upload');

	$('.btn-add-modal--upload').on('click', (e) => {
		e.preventDefault();
		populateModalForm($addDeletionModal, {
			title: "Sammellöschung hinzufügen",
			closeLabel: "Abbrechen",
			submitLabel: "Hinzufügen",
		});
		$addDeletionModal.appendTo('body').modal('show');
	})

    document.querySelector('#batch-file-input').addEventListener('change', loadCsvFile);
})

