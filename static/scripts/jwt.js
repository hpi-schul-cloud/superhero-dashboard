// jwt.js
// Nur für die JWT-Ansicht zuständig (CSP-konform, kein Inline-Handler)

document.addEventListener('DOMContentLoaded', function () {
    var btn = document.querySelector('.btn-copy-jwt');
    if (btn) {
        btn.addEventListener('click', function () {
            var el = document.querySelector('#jwt');
            if (!el) return;
            var value = el.value || el.textContent;
            var tempInput = document.createElement('input');
            tempInput.style.position = 'absolute';
            tempInput.style.left = '-9999px';
            tempInput.value = value;
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);
        });
    }
});
