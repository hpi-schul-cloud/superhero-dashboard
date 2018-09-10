"use strict";

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