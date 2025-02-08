$(document).ready(() => {
  document.querySelectorAll(".details-toggle").forEach((button) => {
    button.addEventListener("click", function () {
      const title = this.getAttribute("data-title");
      const batchId = this.getAttribute("data-batch-id");

      fetch(`/batch-deletion/${batchId}`)
        .then((res) => {
          if (!res.ok) {
            throw new Error(`${res.status} - ${res.statusText}`);
          }
          return res.json();
        })
        .then((data) => {
          document.querySelector("#pending-ids").innerText =
            data.pendingDeletions.join(",");
          document.querySelector("#deleted-ids").innerText =
            data.successfulDeletions.join(",");
          document.querySelector("#failed-ids").innerText =
            data.failedDeletions.join(",");
          document.querySelector("#invalid-ids").innerText =
            data.invalidIds.join(",");

          document.querySelector("#skipped-ids").innerText =
            data.skippedDeletions.flatMap((item) => item.ids).join(",");
        })
        .catch((error) => {
          console.error("error", error);
        });

      document.querySelector(".modal-title").innerText = title;
    });
  });
});
