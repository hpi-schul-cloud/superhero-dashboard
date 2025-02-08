$(document).ready(() => {
  function fetchDeletionBatchDetails(batchId) {
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

        document.querySelector("#skipped-ids").innerText = data.skippedDeletions
          .flatMap((item) => item.ids)
          .join(",");
      })
      .catch((error) => {
        console.error("error", error);
      });
  }

  function copyToClipboard(event) {
    const id = this.getAttribute("data-text-id");
    var text = document.getElementById(id).innerText;

    navigator.clipboard
      .writeText(text)
      .then(() => {
        alert("IDs copied to clipboard!");
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
      });
  }

  document.querySelectorAll(".details-toggle").forEach((button) => {
    button.addEventListener("click", function () {
      const title = this.getAttribute("data-title");
      const batchId = this.getAttribute("data-batch-id");

      fetchDeletionBatchDetails(batchId);

      document.querySelector(".modal-title").innerText = title;
    });
  });

  document.querySelectorAll(".copy-btn").forEach((button) => {
    button.addEventListener("click", copyToClipboard);
  });
});
