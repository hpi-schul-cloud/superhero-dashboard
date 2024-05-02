"use strict";

$(document).ready(function () {
    const $rollbackModal = $('.migration-rollback-modal');

    $('.btn-migration-rollback').on('click', function (rollbackBtnClickEvent) {
        rollbackBtnClickEvent.preventDefault();

        const url = $(this).attr('href');
        $.getJSON(url, function (user) {
            populateModalForm($rollbackModal, {
                action: url + '/rollback-migration',
                title: 'Migration rückgängig machen',
                closeLabel: 'Schließen',
                submitLabel: 'Zurücksetzen',
                fields: user
            });

            const $btnSubmit = $rollbackModal.find('.btn-submit');
            $btnSubmit.prop('disabled', !user.lastLoginSystemChange);
            $btnSubmit.on('click', function (submitBtnClickEvent) {
                submitBtnClickEvent.preventDefault();

                $.ajax({
                    url: url + '/rollback-migration',
                    type: 'POST',
                    error: function (req, textStatus, errorThrown) {
                        $.showNotification(`Das Zurücksetzten der Migration ist fehlgeschlagen (${errorThrown})`, "danger");
                    },
                    success: function() {
                        $.showNotification(`Die Migration für den Nutzer "${user.firstName} ${user.lastName}" wurde erfolgreich zurückgesetzt`, "success", 30000);

                        $rollbackModal.modal('hide');
                    },
                });
            });

            $rollbackModal.modal('show');
        });
    });
});

function toggleSilentArea(status){
    const area = document.querySelector('.silent-area');
    const inputs = area.querySelectorAll('input, select');
    if(status){
        area.classList.remove("hidden");
        inputs.forEach((input) => {
            input.removeAttribute("disabled");
        });
    }else{
        area.classList.add("hidden");
        inputs.forEach((input) => {
            input.setAttribute("disabled","true");
        });
    }
}
window.addEventListener('DOMContentLoaded', ()=>{
    toggleSilentArea(false);
    const silentToggle = document.querySelector('#create-silent');
    if(silentToggle){
        silentToggle.addEventListener("input", (event) => {
            toggleSilentArea(silentToggle.checked);
        });
    }
});