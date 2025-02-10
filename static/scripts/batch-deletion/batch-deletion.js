$(document).ready(() => {
  function fetchDeletionBatchDetails(batchId) {
    console.log("hi	");
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

  function deleteBatch(batchId) {
    fetch(`/batch-deletion/${batchId}`, { method: "DELETE" })
      .then((res) => {
        if (res.ok) {
          location.reload();
        } else {
          console.error("Error:", res.statusText);
        }
      })
      .catch((error) => {
        console.error("error", error);
      });
  }

  function sendDeletionRequest(batchId) {
    fetch(`/batch-deletion/${batchId}/execute`, { method: "POST" })
      .then((res) => {
        if (res.ok) {
          location.reload();
        } else {
          console.error("Error:", res.statusText);
        }
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

      document.querySelector(".modal-title").innerText = title;

      fetchDeletionBatchDetails(batchId);
    });
  });

  document.querySelectorAll(".delete-batch-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const batchId = this.getAttribute("data-batch-id");

      deleteBatch(batchId);
    });
  });

  document.querySelectorAll(".start-deletion-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const batchId = this.getAttribute("data-batch-id");
      this.setAttribute("disabled", true);

      sendDeletionRequest(batchId);
    });
  });

  document.querySelectorAll(".copy-btn").forEach((button) => {
    button.addEventListener("click", copyToClipboard);
  });
});
