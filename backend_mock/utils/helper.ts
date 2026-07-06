import { loadDB, saveDB } from "../config/db";
import { AuditLog } from "../models/types";

// Function to generate unique IDs
export const generateId = () => Math.random().toString(36).substring(2, 11).toUpperCase();

// Log action helper
export const logAction = (action: string, details: string, userName = "Admin") => {
  const db = loadDB();
  const log: AuditLog = {
    id: "AUD-" + generateId(),
    userId: "USER-1",
    userName,
    action,
    details,
    date: new Date().toISOString().replace('T', ' ').substring(0, 16)
  };
  db.auditLogs.unshift(log);
  if (db.auditLogs.length > 100) {
    db.auditLogs.pop();
  }
  saveDB(db);
};
