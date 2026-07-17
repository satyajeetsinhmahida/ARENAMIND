/**
 * ArenaMind — Database Schema definitions
 *
 * Defines the SQL schema statements for SQLite.
 */

export const CREATE_CHAT_MESSAGES_TABLE = `
  CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    sessionId TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    language TEXT NOT NULL,
    accessibilityMode TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    ragSources TEXT,
    isEmergency INTEGER DEFAULT 0
  )
`;

export const CREATE_ACTION_LOG_TABLE = `
  CREATE TABLE IF NOT EXISTS action_log (
    id TEXT PRIMARY KEY,
    actionCardId TEXT NOT NULL,
    staffRole TEXT NOT NULL,
    response TEXT NOT NULL,
    notes TEXT,
    timestamp TEXT NOT NULL
  )
`;
