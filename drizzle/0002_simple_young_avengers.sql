CREATE TABLE IF NOT EXISTS `tavily_test_confirmations` (
	`owner` text PRIMARY KEY NOT NULL,
	`token` text NOT NULL,
	`key_updated` integer NOT NULL,
	`expires` integer NOT NULL,
	`used` integer DEFAULT 0 NOT NULL,
	`last_run` integer DEFAULT 0 NOT NULL
);
