$(document).ready(() => {
  let selectedBatchId = null;
  const resetFailedButton = document.querySelector(".reset-failed-btn");

  const setHTMLForIds = (ids, idType) => {
    const section = document.querySelector(`#${idType}-ids-section`);

    if (ids.length === 0) {
      section.innerHTML = `<span class='no-ids-text'>leer</span>`;
      return;
    }
    const idsString = ids.join("\n");
    const textAreaString = `<textarea id="${idType}-ids" class="id-list" rows="3" readonly>${idsString}</textarea>`;

    section.innerHTML = textAreaString;
  };

  function copyToClipboard() {
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
        setHTMLForIds(data.invalidUsers, "invalid");
        setHTMLForIds(data.skippedUsers, "skipped");

        if (resetFailedButton) {
          resetFailedButton.hidden = data.failedDeletions.length === 0;
        }

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

  function executeBatch(batchId) {
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

  function getFailedIdsFromTextarea() {
    const failedIdsField = document.getElementById("failed-ids");

    if (!failedIdsField?.value) {
      return [];
    }

    const parsedIds = failedIdsField.value
      .split("\n")
      .map((id) => id.trim())
      .filter(Boolean);

    return parsedIds;
  }

  function resetFailedIds(batchId, targetRefIds) {
    fetch(`/batch-deletion/${batchId}/reset-failed`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        batchId,
        targetRefIds,
      }),
    })
      .then((res) => {
        if (res.ok) {
          fetchDeletionBatchDetails(batchId);
          return;
        }
        console.error("Error:", res.statusText);
      })
      .catch((error) => {
        console.error("error", error);
      });
  }

  document.querySelectorAll(".show-batch-details-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const title = this.getAttribute("data-title");
      const batchId = this.getAttribute("data-batch-id");
      selectedBatchId = batchId;

      document.querySelector(".details-modal .modal-title").innerText = title;

      fetchDeletionBatchDetails(batchId);
    });
  });

  if (resetFailedButton) {
    resetFailedButton.addEventListener("click", () => {
      if (!selectedBatchId) {
        console.error("No batch selected for reset-failed action.");
        return;
      }

      const targetRefIds = getFailedIdsFromTextarea();
      if (targetRefIds.length === 0) {
        alert("Keine fehlgeschlagenen IDs vorhanden.");
        return;
      }

      resetFailedIds(selectedBatchId, targetRefIds);
    });
  }

  document.querySelectorAll(".delete-batch-btn").forEach((button) => {
    button.addEventListener("click", function () {
      if (!confirm("Soll der Batch wirklich gelöscht werden?")) {
        this.blur(); // Remove focus from the button
        return;
      }

      const batchId = this.getAttribute("data-batch-id");

      deleteBatch(batchId);
    });
  });

  document.querySelectorAll(".execute-batch-btn").forEach((button) => {
    button.addEventListener("click", function () {
      if (!confirm("Soll der Batch wirklich gestartet werden?")) {
        this.blur(); // Remove focus from the button
        return;
      }

      const batchId = this.getAttribute("data-batch-id");
      this.setAttribute("disabled", true);

      executeBatch(batchId);
    });
  });
});