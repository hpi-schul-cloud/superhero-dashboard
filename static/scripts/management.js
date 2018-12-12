$(document).ready(function () {

  document.querySelectorAll(".ajax-link").forEach((link) => {
    link.addEventListener("click", (event) => {
        event.preventDefault();
        $.ajax({
            url: link.getAttribute('href'),
            error: $.showAJAXError,
            success: function(result) {
                $.showNotification(link.dataset.successMessage || "Success", "success", 10000);
            },
        });
    });
  });


  var $editModal = $('.edit-modal');

  $('.btn-edit').on('click', function (e) {
      e.preventDefault();
      var dataSrc = $(this).attr('href');
      $.getJSON(dataSrc, function (result) {
          populateModalForm($editModal, {
              action: dataSrc,
              title: 'Bearbeiten',
              closeLabel: 'Schließen',
              submitLabel: 'Speichern',
              fields: result
          });

          $editModal.modal('show');
      });
  });

});