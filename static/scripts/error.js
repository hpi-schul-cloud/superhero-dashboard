const navigateBackOrHome = () => {
	if (globalThis.history.length > 1) {
		globalThis.history.back();
		return;
	}

	globalThis.location.assign('/');
};

document.addEventListener('DOMContentLoaded', () => {

    const backButtons = document.querySelectorAll('.js-back-button');

    backButtons.forEach((button) => {
        button.addEventListener('click', (event) => {
            event.preventDefault();
            navigateBackOrHome();
        });
    });
});