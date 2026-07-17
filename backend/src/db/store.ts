import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { CREATE_CHAT_MESSAGES_TABLE, CREATE_ACTION_LOG_TABLE } from './schema.js';
import { ChatMessage, AuditLogEntry, ActionResponse } from '../types/index.js';

let db: Database.Database;

/**
 * Initializes the database, creating tables and directories if necessary.
 * 
 * @param dbPath Absolute or relative path to the SQLite database file
 */
export function initDb(dbPath: string): void {
  if (dbPath === ':memory:') {
    db = new Database(':memory:');
    db.prepare(CREATE_CHAT_MESSAGES_TABLE).run();
    db.prepare(CREATE_ACTION_LOG_TABLE).run();
    return;
  }

  const resolvedPath = path.resolve(dbPath);
  const dbDir = path.dirname(resolvedPath);

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = new Database(resolvedPath);
  db.pragma('journal_mode = WAL');

  // Create tables
  db.prepare(CREATE_CHAT_MESSAGES_TABLE).run();
  db.prepare(CREATE_ACTION_LOG_TABLE).run();
}

/**
 * Saves a chat message to the database.
 * 
 * @param sessionId Chat session ID
 * @param message Message to save
 */
export function saveChatMessage(sessionId: string, message: ChatMessage): void {
  if (!db) throw new Error('Database not initialized');

  const stmt = db.prepare(`
    INSERT INTO chat_messages (id, sessionId, role, content, language, accessibilityMode, timestamp, ragSources, isEmergency)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    message.id,
    sessionId,
    message.role,
    message.content,
    message.language,
    message.accessibilityMode,
    message.timestamp,
    message.metadata?.ragSources ? JSON.stringify(message.metadata.ragSources) : null,
    message.metadata?.isEmergency ? 1 : 0
  );
}

/**
 * Retrieves chat history for a session.
 * 
 * @param sessionId Chat session ID
 * @returns Array of chat messages
 */
export function getChatHistory(sessionId: string): ChatMessage[] {
  if (!db) throw new Error('Database not initialized');

  const stmt = db.prepare(`
    SELECT id, role, content, language, accessibilityMode, timestamp, ragSources, isEmergency
    FROM chat_messages
    WHERE sessionId = ?
    ORDER BY timestamp ASC
  `);

  const rows = stmt.all(sessionId) as any[];

  return rows.map(row => ({
    id: row.id,
    timestamp: row.timestamp,
    role: row.role as 'user' | 'assistant' | 'system',
    content: row.content,
    language: row.language as any,
    accessibilityMode: row.accessibilityMode as any,
    metadata: {
      ragSources: row.ragSources ? JSON.parse(row.ragSources) : undefined,
      isEmergency: row.isEmergency === 1
    }
  }));
}

/**
 * Logs a staff action card decision.
 * 
 * @param entry Audit log entry details
 */
export function saveActionResponse(entry: {
  id: string;
  actionCardId: string;
  staffRole: string;
  response: ActionResponse;
  notes?: string;
  timestamp: string;
}): void {
  if (!db) throw new Error('Database not initialized');

  const stmt = db.prepare(`
    INSERT INTO action_log (id, actionCardId, staffRole, response, notes, timestamp)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    entry.id,
    entry.actionCardId,
    entry.staffRole,
    entry.response,
    entry.notes || null,
    entry.timestamp
  );
}


/**
 * Retrieves the full operations audit log.
 * 
 * @returns Array of audit log entries
 */
export function getAuditLog(): AuditLogEntry[] {
  if (!db) throw new Error('Database not initialized');

  const stmt = db.prepare(`
    SELECT id, timestamp, actionCardId, staffRole, response, notes
    FROM action_log
    ORDER BY timestamp DESC
  `);

  const rows = stmt.all() as any[];

  return rows.map(row => ({
    id: row.id,
    timestamp: row.timestamp,
    actionCardId: row.actionCardId,
    staffRole: row.staffRole,
    response: row.response as ActionResponse,
    notes: row.notes || undefined
  }));
}
