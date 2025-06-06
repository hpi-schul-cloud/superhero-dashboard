function getQueryParameterByName(name, url) {
    if (!url) {
        url = window.location.href;
    }
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function updateQueryStringParameter(uri, key, value) {
    var re = new RegExp("([?&])" + key + "=[^&#]*", "i");
    if (re.test(uri)) {
        return uri.replace(re, '$1' + key + "=" + value);
    } else {
        var matchData = uri.match(/^([^#]*)(#.*)?$/);
        var separator = /\?/.test(uri) ? "&" : "?";
        return matchData[0] + separator + key + "=" + value + (matchData[1] || '');
    }
}

function populateModalForm(modal, data) {
    var $title = modal.find('.modal-title');
    var $btnSubmit = modal.find('.btn-submit');
    var $btnClose = modal.find('.btn-close');
    var $form = modal.find('.modal-form');

    $title.html(data.title);
    $btnSubmit.html(data.submitLabel);
    if(data.submitLabel === false){
        $btnSubmit.addClass("hidden");
    }else{
        $btnSubmit.removeClass("hidden");
    }
    $btnClose.html(data.closeLabel);

    if (data.action) {
        $form.attr('action', data.action);
    }

    // fields
    if(data.fields) {
        $('[name]', $form).not('[data-force-value]').each(function () {
            const propSelectors = $(this).prop('name').replace('[]', '').replace(']', '').split('[');

            const value = propSelectors.reduce((accumulator, currentValue) => {
                return accumulator ? accumulator[currentValue] : undefined;
            }, data.fields) || '';

            switch ($(this).prop("type")) {
                case "radio":
                case "checkbox":
                    $(this).each(function () {
                        $(this).prop("checked", value);
                
                        if (data.fields[$(this).attr('name') + "_disabled"] ){
                            $(this).attr("disabled", true);
                        }
                    });
                    break;
                case "datetime-local":
                    $(this).val(value.slice(0, 16)).trigger("chosen:updated");
                    break;
                case "date":
                    $(this).val(value.slice(0, 10)).trigger("chosen:updated");
                    break;
                case "color":
                    $(this).attr("value", value);
                    $(this).attr("placeholder", value);
                    break;
                default:
                    if ($(this).prop('nodeName') == "TEXTAREA" && $(this).hasClass("customckeditor")) {
                        if (CKEDITOR.instances.description) {
                            CKEDITOR.instances.description.setData(value);
                        }
                    } else {
                        $(this).val(value).trigger("chosen:updated");
                    }
            }
            $(this).change().trigger("input");
        });
    }
}

$(document).ready(function () {
    // Bootstrap Tooltips
    $('[data-toggle="tooltip"]').tooltip();

    // notification stuff
    var $notification = $('.notification');
    var $notificationContent = $notification.find('.notification-content');

    window.$.showNotification = function (content, type, timeout) {
        $notificationContent.html(content);

        // remove old classes in case type was set before
        $notification.removeClass();
        $notification.addClass('notification alert alert-fixed alert-' + (type || 'info'));

        $notification.fadeIn();

        if (timeout) {
            setTimeout(function () {
                $notification.fadeOut();
            }, 5000);
        }
    };

    window.$.hideNotification = function () {
        $notification.fadeOut();
    };

    $notification.find('.close').click(window.$.hideNotification);


    // Initialize bootstrap-select
    $('select').not('.no-bootstrap').chosen({
        width: "100%",
        "disable_search": false
    });

    // collapse toggle
    $('.collapse-toggle').click(function (e) {
        var $collapseToggle = $(this);
        var isCollapsed = $($collapseToggle.attr("href")).attr("aria-expanded");
        if (!isCollapsed || isCollapsed === 'false') {
            $collapseToggle.find('.collapse-icon').removeClass("fa-chevron-right");
            $collapseToggle.find('.collapse-icon').addClass("fa-chevron-down");
        } else {
            $collapseToggle.find('.collapse-icon').removeClass("fa-chevron-down");
            $collapseToggle.find('.collapse-icon').addClass("fa-chevron-right");
        }
    });


    // Init mobile nav
    $('.mobile-nav-toggle').click(function (e) {
        $('aside.nav-sidebar nav:first-child').toggleClass('active');
    });

    $('.mobile-search-toggle').click(function (e) {
        $('.search-wrapper .input-group').toggleClass('active');
        $('.search-wrapper .mobile-search-toggle .fa').toggleClass('fa-search').toggleClass('fa-times');
    });


    (function (a, b, c) {
        if (c in b && b[c]) {
            var d, e = a.location, f = /^(a|html)$/i;
            a.addEventListener("click", function (a) {
                d = a.target;
                while (!f.test(d.nodeName))d = d.parentNode;
                "href" in d && (d.href.indexOf("http") || ~d.href.indexOf(e.host)) && (a.preventDefault(), e.href = d.href);
            }, !1);
        }
    })(document, window.navigator, "standalone");
    
    
    // delete modals
    var $modals = $('.modal');
    var $deleteModal = $('.delete-modal');

    const nextPage = function(href) {
        if(href){
            window.location.href = href;
        }else{
            window.location.reload();
        }
    };

    function showAJAXError(req, textStatus, errorThrown) {
        $deleteModal.modal('hide');
        if(textStatus==="timeout") {
            $.showNotification("Zeitüberschreitung der Anfrage", "warn", 30000);
        } else {
            $.showNotification(errorThrown, "danger");
        }
    }

    $('a[data-method="delete-material"]').on('click', function(e) {
        e.stopPropagation();
        e.preventDefault();
        var $buttonContext = $(this);

        $deleteModal.modal('show');
        $deleteModal.find('.modal-title').text("Bist du dir sicher, dass du '" + $buttonContext.data('name') + "' löschen möchtest?");
        $deleteModal.find('.btn-submit').unbind('click').on('click', function() {
            $.ajax({
                url: $buttonContext.attr('href'),
                type: 'DELETE',
                error: showAJAXError,
                success: function(result) {
                    nextPage($buttonContext.attr('redirect'));
                },
            });
        });
    });

    $deleteModal.find('.close, .btn-close').on('click', function() {
        $deleteModal.modal('hide');
    });

    $modals.find('.close, .btn-close').on('click', function() {
        $modals.modal('hide');
    });

    // Print Button
    $('.print .btn-print').click(function () {
        $(this).html("");
        w = window.open();
        w.document.write($(this).parent(".print").html());
        w.print();
        w.close();
        $(this).html("<i class='fa fa-print'></i> Drucken");
    });
    
    $(".chosen-container-multi").off( "touchstart");
    $(".chosen-container-multi").off( "touchend");
});
