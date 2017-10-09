$(document).ready(function () {
    $('.btn-create-event').click(function () {
        let $createEventModal = $('.add-modal');
        populateModalForm($createEventModal, {
            title: 'Neues Event hinzufügen',
            closeLabel: 'Schließen',
            submitLabel: 'Speichern',
            fields: {}
        });
        $createEventModal.modal('show');
    });

    $('.btn-add-participant').click(function () {
        let $participantModal = $('.add-participant-modal');
        populateModalForm($participantModal, {
            title: 'Neue Einladung erstellen',
            closeLabel: 'Schließen',
            submitLabel: 'Einladung senden',
            fields: {}
        });
        $participantModal.modal('show');
    });
});