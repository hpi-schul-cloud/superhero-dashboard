$(document).ready(function () {
    var $editModal = $('.edit-modal');
    var $reglinkmodal = $('.reglink-modal');
    var $deleteModal = $('.delete-modal');
    var $navToolType = $('.nav-tool-type');
    var $customParameterTemplate = $('#custom-parameter-template');
    var $customParameters = $('#custom-parameters');
    var customParameterId = 0;

    $('.btn-create-ctl-tool').click(function () {
        let $createToolModal = $('.add-modal');
        customParameterId = 0;
        populateModalForm($createToolModal, {
            title: 'Neues Tool hinzufügen',
            closeLabel: 'Schließen',
            submitLabel: 'Speichern',
            fields: {
                silent: false
            }
        });
        $createToolModal.modal('show');
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

    $('.btn-reglink').on('click', function (e) {
        e.preventDefault();
        var entry = $(this).attr('href');
        $.getJSON(entry, function (result) {
            populateModalForm($reglinkmodal, {
                action: entry,
                title: 'Registrierungslink',
                closeLabel: 'Schließen',
                submitLabel: false,
                fields: result
            });

            $reglinkmodal.modal('show');
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

    $('.nav-link').on('click', function () {
        $navToolType.attr('value',$(this).attr('aria-controls'));
    });

    $('.btn-add-custom-parameter').on('click', (e) => {
        // e.preventDefault();
        var newCustomParam = $customParameterTemplate.clone().appendTo('#custom-parameter-list');
        newCustomParam.attr('class', 'custom-parameter');
        newCustomParam.attr('id', `custom-parameter-${customParameterId}`);
        newCustomParam.attr('style',null);
        newCustomParam.find('.parameters-name').attr('name', `parameters[${customParameterId}][name]`);
        newCustomParam.find('.parameters-type').attr('name', `parameters[${customParameterId}][type]`);
        newCustomParam.find('.parameters-scope').attr('name', `parameters[${customParameterId}][scope]`);
        newCustomParam.find('.parameters-location').attr('name', `parameters[${customParameterId}][location]`);
        newCustomParam.find('.parameters-default').attr('name', `parameters[${customParameterId}][default]`);
        newCustomParam.find('.parameters-regex').attr('name', `parameters[${customParameterId}][regex]`);
        customParameterId++;
    });

    $('.btn-remove-custom-parameter').on('click', (e) => {
        e.preventDefault();
        var curr = $(this).parent();
        console.log(curr);
        $(this).parent().parent().removeChild($(this).parent());
    });

    $('.modal-form').on('submit', function(e){
        e.preventDefault();
        $(this).find('.custom-parameter').each(function(index) {
            $(this).find('.parameters-name').attr('name', `parameters[${index}][name]`);
            $(this).find('.parameters-type').attr('name', `parameters[${index}][type]`);
            $(this).find('.parameters-scope').attr('name', `parameters[${index}][scope]`);
            $(this).find('.parameters-location').attr('name', `parameters[${index}][location]`);
            $(this).find('.parameters-default').attr('name', `parameters[${index}][default]`);
            $(this).find('.parameters-regex').attr('name', `parameters[${index}][regex]`);
        });
        console.log($('.modal-form').serializeArray());
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
        'Geerbt von': 'roles',
        'Titel': 'subject',
        'Kategorie': 'category',
        'Ist-Zustand': 'currentState',
        'Soll-Zustand': 'targetState',
        'Status': 'state',
        'Erstellungsdatum': 'createdAt',
        'Anmerkungen': 'notes',
        'Abkürzung': 'abbreviation',
        'Logo': 'logoUrl',
        'E-Mail-Adresse': 'email',
        'Klassen': 'classIds',
        'Lehrer': 'teacherIds',
        'Klasse(n)': 'classIds',
        'Bezeichnung': 'name',
        'Typ': 'type',
        'Url': 'url',
        'Alias': 'alias',

        'subject': 'Titel',
        'firstName': 'Vorname',
        'lastName': 'Nachname',
        'roles': 'Rollen',
        'schoolId': 'Schule',
        'name': 'Name',
        '_id': 'ID',
        'federalState': 'Bundesland',
        'category': 'Kategorie',
        'currentState': 'Ist-Zustand',
        'targetState': 'Soll-Zustand',
        'state': 'Status',
        'createdAt': 'Erstellungsdatum',
        'notes': 'Anmerkungen',
        'logoUrl': 'Logo',
        'abbreviation': 'Abkürzung',
        'type': 'Typ',
        'url': 'Url',
        'alias': 'Alias',
        'permissions': 'Permissions',
        'teacherIds': 'Lehrer',
        'classIds': 'Klasse(n)',
        'email': 'E-Mail-Adresse'
    };

    $('tr th').each(function(i,j) {
        $(j).on('click', function (e) {

            let location = window.location.search.split('&');
            let contained = false;

            location = location.map(entity => {
                if (entity.includes('sort')) {
                    if (entity === 'sort=' + dictionary[$(j).text()]) {
                        entity = 'sort=-' + dictionary[$(j).text()];
                    } else {
                        entity = 'sort=' + dictionary[$(j).text()];
                    }
                    contained = true;
                }
                return entity;
            });
            if (!contained)
                location.push('sort=' + dictionary[$(j).text()]);
            window.location.search = location.join('&');
        });
    });

    $('#limit').change(function changeLimit() {

        let location = window.location.search.split('&');
        let contained = false;

        location = location.map(entity => {
            if (entity.includes('limit')) {
                entity = 'limit=' + $('#limit').val();
                contained = true;
            }
            return entity;
        });
        if (!contained)
            location.push('limit=' + $('#limit').val());
        window.location.search = location.join('&');
    });

    let location = window.location.search.split('&');
    location.map(entity => {
        if (entity.includes('sort')) {
            let queryParam = entity.split('=');
            queryParam = queryParam[1].toString();

            let asc = true;

            if (queryParam.charAt(0) === '-') {
                asc = false;
                queryParam = queryParam.slice(1);
            }

            if (asc) {
                $('th:contains(' + dictionary[queryParam] + ')').append('<i class="fa fa-arrow-down" aria-hidden="true"></i>');
            } else {
                $('th:contains(' + dictionary[queryParam] + ')').append('<i class="fa fa-arrow-up" aria-hidden="true"></i>');
            }
        }
    });

});
