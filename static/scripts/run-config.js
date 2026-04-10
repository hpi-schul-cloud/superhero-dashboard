$(document).ready(function () {
    $('.btn.btn-sm.save').on('click', function (e) {
        e.preventDefault();
        const $row = $(this).closest('tr');
        const key = $row.data('key');

        const url = new URL(window.location.href);
        url.pathname = `${url.pathname}${key}`;

        const isCheckbox = $row.find('input[type="checkbox"]').length > 0;
        const checkboxValue =  $row.find('input[type="checkbox"]').is(':checked') ? 'checked' : 'unchecked';
        const textValue = $row.find('input[type="number"], input[type="text"]').val();
        const value = isCheckbox ? checkboxValue : textValue;
    
        $.ajax({
            url: url.toString(),
            type: 'PATCH',
            contentType: 'application/json',
            data: JSON.stringify({
                value: value
            }),
            success: function () {
                $.showNotification('Konfiguration erfolgreich aktualisiert', 'success', 3000);
            },
            error: function () {
                $.showNotification('Fehler beim Aktualisieren der Konfiguration.', 'danger', 5000);
            }
        });
    });

});
