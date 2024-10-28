CREATE TABLE IF NOT EXISTS "sitemap" (
	"user_id" text PRIMARY KEY NOT NULL,
	"tracked_websites" text[] NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
