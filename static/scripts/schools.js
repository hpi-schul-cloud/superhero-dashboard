$(document).ready(function () {
    var $editModal = $('.edit-modal');
    var $reglinkmodal = $('.reglink-modal');
    var $deleteModal = $('.delete-modal');
    const $deleteFilesModal = $('.delete-files-modal');

    $('.btn-delete-files').on('click', function (e) {
        e.preventDefault();
        const entry = $(this).parent().attr('action');
        $.getJSON(entry, function (result) {
          populateModalForm($deleteFilesModal, {
            action: `${entry}/delete-files`,
            title: 'Alle Dateien der Schule löschen',
            closeLabel: 'Schließen',
            submitLabel: 'Löschen',
            fields: result,
          });
    
          $deleteFilesModal.modal('show');
        });
      });
    
      const submitButton = $('.delete-files-modal').find('.btn-submit');
      const schoolIdInput = $('.delete-files-modal').find('#schoolId');
      const repeatSchoolIdInput = $('.delete-files-modal').find('#repeatSchoolId');
    
      repeatSchoolIdInput.on('input change', function (e) {
        if ($(this).val() !== $(schoolIdInput).val()) {
          $(submitButton).prop('disabled', true);
        } else {
          $(submitButton).prop('disabled', false);
        }
      });

    $('.btn-create-school').click(function () {
        let $createSchoolModal = $('.add-modal');
        populateModalForm($createSchoolModal, {
            title: 'Neues Element hinzufügen',
            closeLabel: 'Schließen',
            submitLabel: 'Speichern',
      fields: {
                silent: false
            }
    });
        $createSchoolModal.modal('show');
  });

    $('.btn-edit').on('click', function (e) {
    e.preventDefault();
        var entry = $(this).attr('href');
    $.getJSON(entry, function (result) {
            if(result.roles){
                result.roles = result.roles.map(role => {
          return role.name;
        });
      }
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

    $editModal.find('.enableLdapSyncDuringMigration').on('click', function(e) {
    e.preventDefault();
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
        'Migration gestartet': 'userLoginMigration.startedAt',
        'Migration verpflichtend': 'userLoginMigration.mandatorySince',
        'Migration abgeschlossen': 'userLoginMigration.closedAt',
        'Migration final beendet': 'userLoginMigration.finishedAt',
        'Login-System': 'systems',
        'External Id': 'ldapId',

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
        'email': 'E-Mail-Adresse',
        'userLoginMigration.startedAt': 'Migration gestartet',
        'userLoginMigration.mandatorySince': 'Migration verpflichtend',
        'userLoginMigration.closedAt': 'Migration abgeschlossen',
        'userLoginMigration.finishedAt': 'Migration final beendet',
        'systems': 'Login-System',
        'ldapId': 'External Id'
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
