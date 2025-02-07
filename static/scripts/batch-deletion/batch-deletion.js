$(document).ready(() => {
  document.querySelectorAll(".details-toggle").forEach((button) => {
    button.addEventListener("click", function () {
      const title = this.getAttribute("data-title");

      document.querySelector(".modal-title").innerText = title;
    });
  });
});

