$(document).ready(function () {
    var $editModal = $('.edit-modal');
    var $deleteModal = $('.delete-modal');

    $('.btn-create-school').click(function () {
        let $createSchoolModal = $('.add-modal');
        populateModalForm($createSchoolModal, {
            title: 'Neues Element hinzufügen',
            closeLabel: 'Schließen',
            submitLabel: 'Speichern',
            fields: {}
        });
        $createSchoolModal.modal('show');
    });

    $('.btn-edit').on('click', function (e) {
        e.preventDefault();
        var entry = $(this).attr('href');
        $.getJSON(entry, function (result) {
            populateModalForm($editModal, {
                action: entry,
                title: 'Bearbeiten',
                closeLabel: 'Schließen',
                submitLabel: 'Speichern',
                fields: result
            });

            $editModal.modal('show');
        });
    });

    $('.btn-delete').on('click', function (e) {
        e.preventDefault();
        var entry = $(this).parent().attr('action');
        $.getJSON(entry, function (result) {
            populateModalForm($deleteModal, {
                action: entry,
                title: 'Löschen',
                closeLabel: 'Schließen',
                submitLabel: 'Löschen',
                fields: result
            });

            $deleteModal.modal('show');
        });
    });
});