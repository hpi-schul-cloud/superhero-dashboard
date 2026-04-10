$(document).ready(function () {

    $('.btn.btn-sm.save').on('click', function (e) {
        e.preventDefault();
        const $row = $(this).closest('tr');
        const key = $row.data('key');

        const url = new URL(window.location.href);
        url.pathname = `${url.pathname}${key}`;
    
        $.ajax({
            url: url.toString(),
            type: 'PATCH',
            contentType: 'application/json',
            data: JSON.stringify({
                value: $row.find('input, select').val()
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
