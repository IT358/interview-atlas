CREATE TABLE IF NOT EXISTS `key_vault` (
	`owner` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL,
	`updated_at` integer NOT NULL
);
