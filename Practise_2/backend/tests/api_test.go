package tests

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"notes/app"
)

func TestHealthEndpointExistsWithoutDatabase(t *testing.T) {
	oldPool := app.Pool
	app.Pool = nil
	t.Cleanup(func() { app.Pool = oldPool })

	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	recorder := httptest.NewRecorder()
	app.NewHandler().ServeHTTP(recorder, req)

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusOK)
	}
	if !strings.Contains(recorder.Body.String(), `"status"`) {
		t.Fatalf("body %q missing status field", recorder.Body.String())
	}
}
