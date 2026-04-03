import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const sessionsTable = pgTable("user_sessions", {
  sid: text("sid").primaryKey(),
  sess: text("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

export type Session = typeof sessionsTable.$inferSelect;

// Made with Bob
