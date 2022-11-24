$(document).ready(function () {
    const $addModal = $('.add-modal');
    const $editModal = $('.edit-modal');
    const $reglinkmodal = $('.reglink-modal');
    const $deleteModal = $('.delete-modal');
    const $navToolType = $('.nav-tool-type');
    const $customParameterTemplate = $('#custom-parameter-template');
    let customParameterId = 0;


    $('.btn-create-ctl-tool').click(function () {
        customParameterId = 0;

        populateModalForm($addModal, {
            title: 'Neues Tool hinzufügen',
            closeLabel: 'Schließen',
            submitLabel: 'Speichern',
            fields: {
                silent: false,
            }
        });
        $navToolType.attr('value', 'basic');
        $addModal.modal('show');
    });

    $('.btn-edit').on('click', function (e) {
        customParameterId = 0;

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

            populateCustomParameter($editModal, result.parameters);
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

    $('.nav-link').on('click', function() {
        var type = $(this).attr('aria-controls');
        $navToolType.attr('value', type);

        $('.required').each(function() {
            $(this).removeAttr('required');
        });

        $(`#${type}`).find('.required').prop('required', true);
    });

    $addModal.find('.btn-add-custom-parameter').on('click', function(e) {
        addCustomParameter($addModal);
    });
    $editModal.find('.btn-add-custom-parameter').on('click', function(e) {
        addCustomParameter($editModal);
    });


    $('.btn-remove-custom-parameter').on('click', function(e) {
        $(this).parent('.custom-parameter-container').remove();
    });

    const $modalForms = $('.add-modal, .edit-modal').find('.modal-form');

    $modalForms.find('.btn-close').on('click', function(e) {
        $modalForms.find('.custom-parameter-list').children().remove();
        $navToolType.attr('value', 'basic');
    });

    $modalForms.on('submit', function(e) {
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

    function populateCustomParameter($modal, parameters) {
        parameters.forEach(param => {
            const customParameter = addCustomParameter($modal);

            customParameter.find('.parameters-name').attr('value', param.name);
            customParameter.find('.parameters-type').attr('value', param.type);
            customParameter.find('.parameters-scope').attr('value', param.scope);
            customParameter.find('.parameters-location').attr('value', param.location);
            customParameter.find('.parameters-default').attr('value', param.default);
            customParameter.find('.parameters-regex').attr('value', param.regex);
        });
    }

    function addCustomParameter($modal) {
        const newCustomParamContainer = $customParameterTemplate.clone(true);
        newCustomParamContainer.appendTo($modal.find('.custom-parameter-list'));
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

        return newCustomParamContainer;
    }

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
