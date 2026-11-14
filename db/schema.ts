import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const records = sqliteTable('records', { id:text('id').primaryKey(), owner:text('owner').notNull(), kind:text('kind').notNull(), data:text('data').notNull(), created:integer('created').notNull() });
export const catalog = sqliteTable('catalog',{id:text('id').primaryKey(),source:text('source').notNull(),data:text('data').notNull(),seen:integer('seen').notNull()});
export const feedState=sqliteTable('feed_state',{id:text('id').primaryKey(),attempt:integer('attempt').notNull().default(0),success:integer('success').notNull().default(0),status:text('status').notNull().default(''),meta:text('meta').notNull().default('{}')});

export const tavilyTestConfirmations=sqliteTable('tavily_test_confirmations',{owner:text('owner').primaryKey(),token:text('token').notNull(),keyUpdated:integer('key_updated').notNull(),expires:integer('expires').notNull(),used:integer('used').notNull().default(0),lastRun:integer('last_run').notNull().default(0)});
export const keyVault=sqliteTable('key_vault',{owner:text('owner').primaryKey(),payload:text('payload').notNull(),updatedAt:integer('updated_at').notNull()});
