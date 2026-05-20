const navigateBackOrHome = () => {
	if (globalThis.history.length > 1) {
		globalThis.history.back();
		return;
	}

	globalThis.location.assign('/');
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