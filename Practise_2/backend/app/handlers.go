package app

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"strconv"
	"time"

	"github.com/jackc/pgx/v5"
)

type Note struct {
	ID    int64  `json:"id"`
	Title string `json:"title"`
	Body  string `json:"body"`
}

func NewHandler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", health)
	mux.HandleFunc("GET /api/notes", listNotes)
	mux.HandleFunc("POST /api/notes", addNote)
	mux.HandleFunc("GET /api/notes/{id}", getNote)
	mux.HandleFunc("DELETE /api/notes/{id}", deleteNote)
	return mux
}

func health(w http.ResponseWriter, r *http.Request) {
	dbOK := false
	if Pool != nil {
		ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
		defer cancel()
		dbOK = Pool.Ping(ctx) == nil
	}
	status := "degraded"
	if dbOK {
		status = "ok"
	}
	writeJSON(w, http.StatusOK, map[string]any{"status": status, "db": dbOK})
}

func listNotes(w http.ResponseWriter, r *http.Request) {
	if Pool == nil {
		writeJSON(w, http.StatusServiceUnavailable, map[string]string{"error": "database unavailable"})
		return
	}
	rows, err := Pool.Query(r.Context(), "SELECT id, title, body FROM notes ORDER BY id")
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "db error"})
		return
	}
	defer rows.Close()
	notes := make([]Note, 0)
	for rows.Next() {
		var note Note
		if err := rows.Scan(&note.ID, &note.Title, &note.Body); err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "scan error"})
			return
		}
		notes = append(notes, note)
	}
	if err := rows.Err(); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "db error"})
		return
	}
	writeJSON(w, http.StatusOK, notes)
}

func addNote(w http.ResponseWriter, r *http.Request) {
	if Pool == nil {
		writeJSON(w, http.StatusServiceUnavailable, map[string]string{"error": "database unavailable"})
		return
	}
	var note Note
	if err := json.NewDecoder(io.LimitReader(r.Body, 1<<20)).Decode(&note); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid json"})
		return
	}
	if note.Title == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "title is required"})
		return
	}
	err := Pool.QueryRow(r.Context(), "INSERT INTO notes (title, body) VALUES ($1, $2) RETURNING id", note.Title, note.Body).Scan(&note.ID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "db error"})
		return
	}
	writeJSON(w, http.StatusCreated, map[string]int64{"id": note.ID})
}

func getNote(w http.ResponseWriter, r *http.Request) {
	if Pool == nil {
		writeJSON(w, http.StatusServiceUnavailable, map[string]string{"error": "database unavailable"})
		return
	}
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid id"})
		return
	}
	var note Note
	err = Pool.QueryRow(r.Context(), "SELECT id, title, body FROM notes WHERE id = $1", id).Scan(&note.ID, &note.Title, &note.Body)
	if err == pgx.ErrNoRows {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "not found"})
		return
	}
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "db error"})
		return
	}
	writeJSON(w, http.StatusOK, note)
}

func deleteNote(w http.ResponseWriter, r *http.Request) {
	if Pool == nil {
		writeJSON(w, http.StatusServiceUnavailable, map[string]string{"error": "database unavailable"})
		return
	}

	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid id"})
		return
	}

	result, err := Pool.Exec(r.Context(), "DELETE FROM notes WHERE id = $1", id)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "db error"})
		return
	}
	if result.RowsAffected() == 0 {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "not found"})
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func writeJSON(w http.ResponseWriter, code int, value any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(value)
}
