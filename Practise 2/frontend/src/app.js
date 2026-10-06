const form = document.querySelector("#note-form");
const notesElement = document.querySelector("#notes");
const healthElement = document.querySelector("#health");
const messageElement = document.querySelector("#form-message");
const refreshButton = document.querySelector("#refresh");

function setHealth(text, state) {
  healthElement.textContent = text;
  healthElement.className = `status status-${state}`;
}

function renderNotes(notes) {
  if (notes.length === 0) {
    notesElement.innerHTML = '<p class="empty">No notes yet. Add the first one.</p>';
    return;
  }

  notesElement.innerHTML = notes.map((note) => `
    <article class="note-card">
      <div class="note-index">${String(note.id).padStart(2, "0")}</div>
      <div>
        <h3>${escapeHTML(note.title)}</h3>
        <p>${escapeHTML(note.body || "No body")}</p>
      </div>
    </article>
  `).join("");
}

function escapeHTML(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
  }[character]));
}

async function checkHealth() {
  try {
    const response = await fetch("/health");
    const payload = await response.json();
    setHealth(payload.db ? "Backend online" : "Backend degraded", payload.db ? "ok" : "warning");
  } catch {
    setHealth("Backend unavailable", "error");
  }
}

async function loadNotes() {
  notesElement.innerHTML = '<p class="empty">Loading notes...</p>';
  try {
    const response = await fetch("/api/notes");
    if (!response.ok) throw new Error("Unable to load notes");
    renderNotes(await response.json());
  } catch {
    notesElement.innerHTML = '<p class="empty error-text">Could not load notes. Check the backend.</p>';
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const submitButton = form.querySelector("button[type=submit]");
  submitButton.disabled = true;
  messageElement.textContent = "Saving...";

  try {
    const response = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: data.get("title"), body: data.get("body") })
    });
    if (!response.ok) throw new Error("Unable to save note");
    form.reset();
    messageElement.textContent = "Note saved.";
    await loadNotes();
  } catch {
    messageElement.textContent = "Could not save note.";
  } finally {
    submitButton.disabled = false;
  }
});

refreshButton.addEventListener("click", loadNotes);
await Promise.all([checkHealth(), loadNotes()]);
