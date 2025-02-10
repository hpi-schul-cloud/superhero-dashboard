$(document).ready(() => {
  const setHTMLForIds = (ids, idType) => {
    const section = document.querySelector(`#${idType}-ids-section`);

    if (ids.length === 0) {
      section.innerHTML = `<span class='no-ids-text'>Nothing ${idType}</span>`;
      return;
    }
    const idsString = ids.join("\n");
    const textAreaString = `<textarea id="${idType}-ids" class="id-list" rows="3" readonly>${idsString}</textarea>`;

    section.innerHTML = textAreaString;
  };

  function copyToClipboard(event) {
    const id = this.getAttribute("data-text-id");
    const text = document.getElementById(id).innerHTML;

    navigator.clipboard
      .writeText(text)
      .then(() => {
        alert("IDs copied to clipboard!");
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
      });
  }

  function fetchDeletionBatchDetails(batchId) {
    fetch(`/batch-deletion/${batchId}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`${res.status} - ${res.statusText}`);
        }
        return res.json();
      })
      .then((data) => {
        setHTMLForIds(data.pendingDeletions, "pending");
        setHTMLForIds(data.successfulDeletions, "deleted");
        setHTMLForIds(data.failedDeletions, "failed");
        setHTMLForIds(data.invalidIds, "invalid");

        const mappedSkippedIds = data.skippedDeletions
          .map((listItem) => {
            return [listItem.roleName, ...listItem.ids];
          })
          .flat();
        setHTMLForIds(mappedSkippedIds.flat(), "skipped");

        document.querySelectorAll(".copy-btn").forEach((button) => {
          button.addEventListener("click", copyToClipboard);
        });
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
});
