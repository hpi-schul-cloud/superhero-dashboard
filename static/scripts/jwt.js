document.addEventListener('DOMContentLoaded', () => {
    const btn = document.querySelector('.btn-copy-jwt');
    const el = document.querySelector('#jwt');
    if (!btn || !el) {
        return;
    }
    btn.addEventListener('click', () => {
        const value = el.value ? el.value.trim() : el.textContent.trim();
        navigator.clipboard.writeText(value);
    });
});
