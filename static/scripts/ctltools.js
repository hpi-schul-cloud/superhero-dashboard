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

    $('.btn-delete').on('click', function(e) {
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

    const requiredFieldsInConfig = {
        basic: [],
        oauth2: ['#oauth-client-id', '#oauth-client-secret', '#redirect-url', '#token_endpoint_auth_method'],
        lti11: ['#key', '#secret', '#lti_message_type', '#privacy_permission']
    };

    $('.nav-link').on('click', function() {
        var type = $(this).attr('aria-controls');
        $navToolType.attr('value', type);

        $('.tab-content').find('input').each(function() {
            $(this).removeAttr('required');
        });

        requiredFieldsInConfig[type].forEach((field) => {
            $(field).prop('required', true);
        });
    });

    $('.btn-add-custom-parameter').on('click', function(e) {
        const newCustomParamContainer = $customParameterTemplate.clone(true);
        newCustomParamContainer.appendTo('#custom-parameter-list');
        newCustomParamContainer.attr('class', 'custom-parameter-container');
        newCustomParamContainer.attr('id', `custom-parameter-${customParameterId}`);
        newCustomParamContainer.attr('style', null);

        newCustomParamContainer.find('select').each(function (e) {
            $(this).attr('style', null);
            $(this).siblings('div').remove();
        });

        // Bind labels to input fields
        newCustomParamContainer.find('.parameters-name-label').attr('for', `parameters-name-${customParameterId}`);
        newCustomParamContainer.find('.parameters-name').attr('id', `parameters-name-${customParameterId}`);
        newCustomParamContainer.find('.parameters-type-label').attr('for', `parameters-type-${customParameterId}`);
        newCustomParamContainer.find('.parameters-type').attr('id', `parameters-type-${customParameterId}`);
        newCustomParamContainer.find('.parameters-scope-label').attr('for', `parameters-scope-${customParameterId}`);
        newCustomParamContainer.find('.parameters-scope').attr('id', `parameters-scope-${customParameterId}`);
        newCustomParamContainer.find('.parameters-location-label').attr('for', `parameters-location-${customParameterId}`);
        newCustomParamContainer.find('.parameters-location').attr('id', `parameters-location-${customParameterId}`);
        newCustomParamContainer.find('.parameters-default-label').attr('for', `parameters-default-${customParameterId}`);
        newCustomParamContainer.find('.parameters-default').attr('id', `parameters-default-${customParameterId}`);
        newCustomParamContainer.find('.parameters-regex-label').attr('for', `parameters-regex-${customParameterId}`);
        newCustomParamContainer.find('.parameters-regex').attr('id', `parameters-regex-${customParameterId}`);

        customParameterId++;
    });

    $('.btn-remove-custom-parameter').on('click', function(e) {
        $(this).parent('.custom-parameter-container').remove();
    });

    const modal = $('.add-modal, .edit-modal').find('.modal-form');

    modal.find('.btn-close').on('click', function(e) {
        modal.find('#custom-parameter-list').children().remove();
    });

    modal.on('submit', function(e) {
        $('.tab-pane').not('.active').remove();

        $(this).find('.custom-parameter-container').each(function (index) {
            $(this).find('.parameters-name').attr('name', `parameters[${index}][name]`);
            $(this).find('.parameters-type').attr('name', `parameters[${index}][type]`);
            $(this).find('.parameters-scope').attr('name', `parameters[${index}][scope]`);
            $(this).find('.parameters-location').attr('name', `parameters[${index}][location]`);
            $(this).find('.parameters-default').attr('name', `parameters[${index}][default]`);
            $(this).find('.parameters-regex').attr('name', `parameters[${index}][regex]`);
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
