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
        $addModal.find('#hasMedium').prop('checked', false);
        resetMediumForms($addModal);

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
        const entry = $(this).attr('href');
        $.getJSON(entry, function (result) {
            populateModalForm($editModal, {
                action: entry,
                title: 'Bearbeiten',
                closeLabel: 'Schließen',
                submitLabel: 'Speichern',
                fields: result
            });
            if (result.hasMedium) {
                hasMedium($editModal);
            }
            setMediumMetadataFormat($editModal);
            populateCustomParameter($editModal, result.parameters);
            $editModal.find(`#${result.config.type}-tab-${editModalId}`).click();
        });
        $editModal.modal('show');
    });

    $('.btn-reglink').on('click', function (e) {
        e.preventDefault();
        const entry = $(this).attr('href');
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
        const entry = $(this).parent().attr('action');
        $.getJSON(entry, function (result) {
            if (!result.contextExternalToolCountPerContext.mediaBoard) {
                $('#media-board-label').hide();
            } else {
                $('#media-board-label').show();
            }

            populateModalForm($deleteModal, {
                action: entry,
                title: 'Tool wirklich löschen?',
                closeLabel: 'Schließen',
                submitLabel: 'Löschen',
                fields: result
            });

            $deleteModal.modal('show');
        });
    });

    $('.parameters-regex').on('input', function (e) {
        const splitId = $(this).attr('id').split('-');
        const customIdIndex = splitId[splitId.length - 1];
        const regexComment = $(`#parameters-regex-comment-${customIdIndex}`);
        if ($(this).val().length > 0) {
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

    $addModal.find('.btn-add-custom-parameter').on('click', function () {
        addCustomParameter($addModal);
    });
    $editModal.find('.btn-add-custom-parameter').on('click', function () {
        addCustomParameter($editModal);
    });

    $('.btn-remove-custom-parameter').on('click', function () {
        $(this).parent('.custom-parameter-container').remove();
    });

    const $modalForms = $('.add-modal, .edit-modal').find('.modal-form');

    $modalForms.on('submit', function () {
        $('.tab-pane').not('.active').remove();

        $(this).find('.custom-parameter-container').each(function (index) {
            $(this).find('.parameters-is-optional').attr('name', `parameters[${index}][isOptional]`);
            $(this).find('.parameters-is-protected').attr('name', `parameters[${index}][isProtected]`);
            $(this).find('.parameters-name').attr('name', `parameters[${index}][name]`);
            $(this).find('.parameters-displayName').attr('name', `parameters[${index}][displayName]`);
            $(this).find('.parameters-description').attr('name', `parameters[${index}][description]`);
            $(this).find('.parameters-type').attr('name', `parameters[${index}][type]`);
            $(this).find('.parameters-scope').attr('name', `parameters[${index}][scope]`);
            $(this).find('.parameters-location').attr('name', `parameters[${index}][location]`);
            $(this).find('.parameters-default').attr('name', `parameters[${index}][defaultValue]`);
            $(this).find('.parameters-regex').attr('name', `parameters[${index}][regex]`);
            $(this).find('.parameters-regex-comment').attr('name', `parameters[${index}][regexComment]`);
        });
    });

    function populateCustomParameter($modal, parameters) {
        parameters.forEach(param => {
            const customParameter = addCustomParameter($modal);

            customParameter.find('.parameters-is-optional').attr('checked', param.isOptional);
            customParameter.find('.parameters-is-protected').attr('checked', param.isProtected);
            customParameter.find('.parameters-name').attr('value', param.name);
            customParameter.find('.parameters-displayName').attr('value', param.displayName);
            customParameter.find('.parameters-description').attr('value', param.description);
            customParameter.find('.parameters-default').attr('value', param.defaultValue);
            customParameter.find('.parameters-regex').attr('value', param.regex);
            customParameter.find('.parameters-regex-comment').attr('value', param.regexComment);
            customParameter.find('.parameters-type').find(`option[value=${param.type}]`).prop('selected', true);
            if (param.type === 'boolean') {
                customParameter.find('.parameters-type').trigger('change');
            }
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

        newCustomParamContainer.find('.parameters-type').on('change', function () {
            const selectedType = $(this).val();
            const booleanTypeText = newCustomParamContainer.find('.boolean-type-text');

            if (selectedType === 'boolean') {
                $(booleanTypeText).show();
            } else {
                $(booleanTypeText).hide();
            }
        });

        // Bind labels to input fields
        newCustomParamContainer.find('.parameters-is-optional-label').attr('for', `parameters-is-optional-${customParameterId}`);
        newCustomParamContainer.find('.parameters-is-optional').attr('for', `parameters-is-optional-${customParameterId}`);
        newCustomParamContainer.find('.parameters-is-protected-label').attr('for', `parameters-is-protected-${customParameterId}`);
        newCustomParamContainer.find('.parameters-is-protected').attr('for', `parameters-is-protected-${customParameterId}`);
        newCustomParamContainer.find('.parameters-name-label').attr('for', `parameters-name-${customParameterId}`);
        newCustomParamContainer.find('.parameters-name').attr('id', `parameters-name-${customParameterId}`);
        newCustomParamContainer.find('.parameters-displayName-label').attr('for', `parameters-displayName-${customParameterId}`);
        newCustomParamContainer.find('.parameters-displayName').attr('id', `parameters-displayName-${customParameterId}`);
        newCustomParamContainer.find('.parameters-description-label').attr('for', `parameters-description-${customParameterId}`);
        newCustomParamContainer.find('.parameters-description').attr('id', `parameters-description-${customParameterId}`);
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

    $('tr th').each(function (i, j) {
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

    function setMediumMetadataFormat($modal) {
        const format = $modal.find('#mediaSource option:selected').data('media-format');
        $modal.find('#load-media-metadata-error').text('');

        if (format === 'BILDUNGSLOGIN' || format === 'VIDIS') {
            $modal.find('#btn-load-media-metadata').prop('disabled', false);
        } else {
            $modal.find('#btn-load-media-metadata').prop('disabled', true);
        }
    }

    function loadMediumMetadata($modal) {
        const format = $modal.find('#mediaSource option:selected').data('media-format');
        const $errorMessage = $modal.find('#load-media-metadata-error');
        const sourceId = $modal.find('#mediaSource').val();
        const mediumId = $modal.find('#mediumId').val();
        $errorMessage.text('');

        if (!mediumId) {
            $errorMessage.text('Bitte geben Sie eine Medium-Id ein!');
            return;
        }

        const encodedSourceId = encodeURIComponent(sourceId);
        const encodedMediumId = encodeURIComponent(mediumId);

        const route = `/ctltools/medium/metadata?mediumId=${encodedMediumId}&sourceId=${encodedSourceId}`;

        $.getJSON(route)
            .done(function (response) {
                $modal.find('#name').val(response.name);
                $modal.find('#description').val(response.description);
                $modal.find('#logoUrl').val(response.logoUrl);

                if (format === 'BILDUNGSLOGIN') {
                    $modal.find('#publisher').val(response.publisher);
                    $modal.find('#thumbnailUrl').val(response.previewLogoUrl);
                    $modal.find('#modifiedAt').val(response.modifiedAt);
                }
            })
            .fail(function (response) {
                if (response.responseJSON && response.responseJSON.error) {
                    const err = response.responseJSON.error;

                    if (err.type === 'MEDIUM_METADATA_NOT_FOUND') {
                        $errorMessage.text('Für das Medium wurden keine Metadaten geliefert.');
                    } else if (err.type === 'MEDIUM_NOT_FOUND') {
                        $errorMessage.text('Das Medium konnte nicht gefunden werden.');
                    } else {
                        $errorMessage.text(`Metadaten konnten nicht geladen werden - Error ${err.code} - ${err.type}`);
                    }

                } else {
                    $errorMessage.text('Es ist ein Fehler aufgetreten.');
                }
            });
    }

    function resetMediumForms($modal) {
        $modal.find('#mediumId').prop('disabled', true).prop('required', false).val('');
        $modal.find('#publisher').prop('disabled', true).val('');
        $modal.find('#modifiedAt').val('');
        $modal.find('#mediaSource').val('').prop('disabled', true).prop('required', false).trigger('chosen:updated');
        $modal.find('#mediumStatus').val('').prop('disabled', true).prop('required', false).trigger('chosen:updated');
        $modal.find('#btn-load-media-metadata').prop('disabled', true);
        $modal.find('#load-media-metadata-error').text('');
    }

    function hasMedium($modal) {
        const isChecked = $modal.find('#hasMedium').is(':checked');

        if (isChecked) {
            $modal.find('#mediaSource').prop('disabled', false).prop('required', true).trigger('chosen:updated');
            $modal.find('#mediumStatus').prop('disabled', false).prop('required', true).trigger('chosen:updated');
            $modal.find('#load-media-metadata-error').text('');
        } else {
            resetMediumForms($modal);
        }
    }

    function setMediumStatus($modal) {
        const status = $modal.find('#mediumStatus option:selected').data('medium-status');

        if (status === 'template') {
            $modal.find('#mediumId').prop('required', false).prop('disabled', true).val('');
            $modal.find('#publisher').prop('required', false).prop('disabled', true).val('');
        } else {
            $modal.find('#mediumId').prop('required', true).prop('disabled', false);
            $modal.find('#publisher').prop('disabled', false);
        }
    }

    $addModal.find('#mediumStatus').on('change', function () {
        setMediumStatus($addModal);
    });

    $editModal.find('#mediumStatus').on('change', function () {
        setMediumStatus($editModal);
    });

    $addModal.find('#mediaSource').on('change', function () {
        setMediumMetadataFormat($addModal);
    });

    $editModal.find('#mediaSource').on('change', function () {
        setMediumMetadataFormat($editModal);
    });

    $addModal.find('#btn-load-media-metadata').on('click', function () {
        loadMediumMetadata($addModal);
    });

    $editModal.find('#btn-load-media-metadata').on('click', function () {
        loadMediumMetadata($editModal);
    });

    $addModal.find('#hasMedium').on('change', function () {
        hasMedium($addModal);
    });

    $editModal.find('#hasMedium').on('change', function () {
        hasMedium($editModal);
    });
});
