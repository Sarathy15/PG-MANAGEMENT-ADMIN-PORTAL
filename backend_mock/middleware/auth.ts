import { Request, Response, NextFunction } from "express";
import { loadDB } from "../config/db";

export interface AuthenticatedRequest extends Request {
  user?: any;
}

export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const token = authHeader.split(" ")[1];
  const db = loadDB();
  
  if (token === "MOCK-JWT-TOKEN-ADMIN") {
    req.user = db.users.find(u => u.email === "admin@pgms.com");
    return next();
  } else if (token === "MOCK-JWT-TOKEN-STAFF") {
    req.user = db.users.find(u => u.email === "staff@pgms.com");
    return next();
  }

  return res.status(401).json({ message: "Invalid or expired token" });
};
