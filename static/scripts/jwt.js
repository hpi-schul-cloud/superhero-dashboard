
const copyToClipboard = async (text) => {
	try {
		await navigator.clipboard.writeText(text);
	} catch (error) {
		// in case browser doesn't support navigator.clipboard
		const tempInput = document.createElement('input');
		tempInput.value = text;
		tempInput.style.position = 'absolute';
		tempInput.style.left = '-9999px';
		document.body.appendChild(tempInput);
		tempInput.select();
		document.execCommand('copy');
		document.body.removeChild(tempInput);
	}
};

document.addEventListener('DOMContentLoaded', () => {
    const btn = document.querySelector('.btn-copy-jwt');
    const el = document.querySelector('#jwt');
    if (!btn || !el) {
        return;
    }
    btn.addEventListener('click', async () => {
        const value = el.value ? el.value.trim() : el.textContent.trim();
        await copyToClipboard(value);
    });
});
