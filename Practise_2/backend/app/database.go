package app

import (
	"context"
	"log"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
)

var Pool *pgxpool.Pool

func InitDB(ctx context.Context) {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "postgres://notes:notes@db:5432/notes"
	}

	cfg, err := pgxpool.ParseConfig(dsn)
	if err != nil {
		log.Fatalf("parse database DSN: %v", err)
	}

	Pool, err = pgxpool.NewWithConfig(ctx, cfg)
	if err != nil {
		log.Fatalf("create database pool: %v", err)
	}
	if err := Pool.Ping(ctx); err != nil {
		log.Printf("database is not reachable at startup: %v", err)
	}
}

func EnsureSchema(ctx context.Context) error {
	if Pool == nil {
		return nil
	}
	_, err := Pool.Exec(ctx, `
CREATE TABLE IF NOT EXISTS notes (
	id SERIAL PRIMARY KEY,
	title TEXT NOT NULL,
	body TEXT NOT NULL DEFAULT ''
);`)
	return err
}
