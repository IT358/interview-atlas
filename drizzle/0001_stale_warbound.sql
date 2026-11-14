CREATE TABLE `catalog` (
	`id` text PRIMARY KEY NOT NULL,
	`source` text NOT NULL,
	`data` text NOT NULL,
	`seen` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `feed_state` (
	`id` text PRIMARY KEY NOT NULL,
	`attempt` integer DEFAULT 0 NOT NULL,
	`success` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT '' NOT NULL,
	`meta` text DEFAULT '{}' NOT NULL
);
