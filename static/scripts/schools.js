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

    const dictionary = {
        'Vorname': 'firstName',
        'Nachname': 'lastName',
        'E-Mail': 'email',
        'Rollen': 'roles',
        'Rolen': 'roles',
        'Schule': 'schoolId',
        'Name': 'name',
        'ID': '_id',
        'Bundesland': 'federalState',
        'Permissions': 'permissions',
        'Geerbt von': 'roles'
    };

    $('tr th').each(function(i,j) {
        $(j).on('click', function (e) {
            let location = window.location.search.split('&');
            let contained = false;

            location = location.map(entity => {
                if (entity.includes('sort')) {
                    entity = 'sort=' + dictionary[$(j).text()];
                    contained = true;
                }
                return entity;
            });
            if (!contained)
                location.push('sort=' + dictionary[$(j).text()]);
            window.location.search = location.join('&');
        });    });

});