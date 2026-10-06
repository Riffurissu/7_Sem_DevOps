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
    notesElement.innerHTML = '<p class="empty">Заметок ещё нет. Добавьте первую.</p>';
    return;
  }

  notesElement.innerHTML = notes.map((note) => `
    <article class="note-card">
      <div class="note-index">${String(note.id).padStart(2, "0")}</div>
      <div>
        <h3>${escapeHTML(note.title)}</h3>
        <p>${escapeHTML(note.body || "Без описания")}</p>
      </div>
      <button class="delete-note" type="button" data-note-id="${note.id}" aria-label="Удалить заметку ${escapeHTML(note.title)}" title="Удалить заметку">×</button>
    </article>
  `).join("");

  notesElement.querySelectorAll(".delete-note").forEach((button) => {
    button.addEventListener("click", () => deleteNote(button.dataset.noteId));
  });
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
    setHealth(payload.db ? "Бэкенд запущен" : "Бэкенд нестабилен", payload.db ? "ok" : "warning");
  } catch {
    setHealth("Бэкенд недоступен", "error");
  }
}

async function loadNotes() {
  notesElement.innerHTML = '<p class="empty">Загрузка заметок...</p>';
  try {
    const response = await fetch("/api/notes");
    if (!response.ok) throw new Error("Невозмоно загрузить новые заметки");
    renderNotes(await response.json());
  } catch {
    notesElement.innerHTML = '<p class="empty error-text">Не получилось загрузить заметки. Проверьте бэкенд.</p>';
  }
}

async function deleteNote(id) {
  if (!window.confirm("Удалить эту заметку?")) return;

  try {
    const response = await fetch(`/api/notes/${id}`, { method: "DELETE" });
    if (!response.ok) throw new Error("Не получилось удалить заметку");
    await loadNotes();
  } catch {
    messageElement.textContent = "Не получилось удалить заметку.";
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const submitButton = form.querySelector("button[type=submit]");
  submitButton.disabled = true;
  messageElement.textContent = "Сохранение...";

  try {
    const response = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: data.get("title"), body: data.get("body") })
    });
    if (!response.ok) throw new Error("Невозможно сохранить заметку");
    form.reset();
    messageElement.textContent = "Заметка сохранена.";
    await loadNotes();
  } catch {
    messageElement.textContent = "Не получилось сохранить заметку.";
  } finally {
    submitButton.disabled = false;
  }
});

refreshButton.addEventListener("click", loadNotes);
await Promise.all([checkHealth(), loadNotes()]);
