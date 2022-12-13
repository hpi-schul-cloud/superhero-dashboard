$(document).ready(function () {
    const addModalId = 'add';
    const editModalId = 'edit';
    const $addModal = $('.add-modal');
    const $editModal = $('.edit-modal');
    const $reglinkmodal = $('.reglink-modal');
    const $deleteModal = $('.delete-modal');
    const $customParameterTemplate = $('#custom-parameter-template');
    let customParameterId = 0;

    $('.btn-create-ctl-tool').click(function () {
        customParameterId = 0;

        $addModal.find('.custom-parameter-list').children().remove();

        populateModalForm($addModal, {
            title: 'Neues Tool hinzufügen',
            closeLabel: 'Schließen',
            submitLabel: 'Speichern',
        });
        $addModal.modal('show');
    });

    $('.btn-edit').on('click', function (e) {
        customParameterId = 0;

        $editModal.find('.custom-parameter-list').children().remove();

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
            $editModal.find(`#${result.config.type}-tab-${editModalId}`).click();
        });
        $editModal.modal('show');
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

    $('.parameters-regex').on('input', function(e){
        var splitId = $(this).attr("id").split('-');
        var customIdIndex = splitId[splitId.length-1];
        var regexComment = $(`#parameters-regex-comment-${customIdIndex}`);
        if ($(this).val().length > 0 ) {
            regexComment.prop('required', true);
        } else {
            regexComment.removeAttr('required');
        }

    });

    function useTabHandler($modal, modalId) {
        $modal.find('.nav-link').on('click', function () {
            const type = $(this).attr('aria-controls');
            $modal.find('.nav-tool-type').attr('value', type);

            $('.required').each(function () {
                $(this).removeAttr('required');
            });

            $(`#${type}-${modalId}`).find('.required').prop('required', true);
        });
    }

    useTabHandler($addModal, addModalId);
    useTabHandler($editModal, editModalId);

    $addModal.find('.btn-add-custom-parameter').on('click', function() {
        addCustomParameter($addModal);
    });
    $editModal.find('.btn-add-custom-parameter').on('click', function() {
        addCustomParameter($editModal);
    });

    $('.btn-remove-custom-parameter').on('click', function() {
        $(this).parent('.custom-parameter-container').remove();
    });

    const $modalForms = $('.add-modal, .edit-modal').find('.modal-form');

    $modalForms.on('submit', function() {
        $('.tab-pane').not('.active').remove();

        $(this).find('.custom-parameter-container').each(function (index) {
            $(this).find('.parameters-is-optional').attr('name', `parameters[${index}][isOptional]`);
            $(this).find('.parameters-name').attr('name', `parameters[${index}][name]`);
            $(this).find('.parameters-type').attr('name', `parameters[${index}][type]`);
            $(this).find('.parameters-scope').attr('name', `parameters[${index}][scope]`);
            $(this).find('.parameters-location').attr('name', `parameters[${index}][location]`);
            $(this).find('.parameters-default').attr('name', `parameters[${index}][default]`);
            $(this).find('.parameters-regex').attr('name', `parameters[${index}][regex]`);
            $(this).find('.parameters-regex-comment').attr('name', `parameters[${index}][regexComment]`);
        });
    });

    function populateCustomParameter($modal, parameters) {
        parameters.forEach(param => {
            const customParameter = addCustomParameter($modal);

            customParameter.find('.parameters-is-optional').attr('value', param.isOptional);
            customParameter.find('.parameters-name').attr('value', param.name);
            customParameter.find('.parameters-default').attr('value', param.default);
            customParameter.find('.parameters-regex').attr('value', param.regex);
            customParameter.find('.parameters-regex-comment').attr('value', param.regexComment);

            customParameter.find('.parameters-type').find(`option[value=${param.type}]`).prop('selected', true);
            customParameter.find('.parameters-scope').find(`option[value=${param.scope}]`).prop('selected', true);
            customParameter.find('.parameters-location').find(`option[value=${param.location}]`).prop('selected', true);
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
        newCustomParamContainer.find('.parameters-is-optional-label').attr('for', `parameters-is-optional-${customParameterId}`);
        newCustomParamContainer.find('.parameters-is-optional').attr('for', `parameters-is-optional-${customParameterId}`);
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
        newCustomParamContainer.find('.parameters-regex-comment-label').attr('for', `parameters-regex-comment-${customParameterId}`);
        newCustomParamContainer.find('.parameters-regex-comment').attr('id', `parameters-regex-comment-${customParameterId}`);

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
        $(j).on('click', function () {

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
