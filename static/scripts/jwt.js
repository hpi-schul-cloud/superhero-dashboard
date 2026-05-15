document.addEventListener('DOMContentLoaded', () => {
    const btn = document.querySelector('.btn-copy-jwt');
    const el = document.querySelector('#jwt');
    if (!btn || !el) {
        return;
    }
    btn.addEventListener('click', async () => {
        const value = el.value ? el.value.trim() : el.textContent.trim();
        await navigator.clipboard.writeText(value);
    });
});
