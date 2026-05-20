const navigateBackOrHome = () => {
	if (window.history.length > 1) {
		window.history.back();
		return;
	}

	window.location.assign('/');
};

document.addEventListener('DOMContentLoaded', function() {

    const backButtons = document.querySelectorAll('.js-back-button');

    backButtons.forEach(function(button) {
        button.addEventListener('click', function(event) {
            event.preventDefault();
            navigateBackOrHome();
        });
    });
});