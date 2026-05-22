import type { Request, Response } from "express";

export function getGroupId(req: Request, res: Response): number | null {
  const raw = req.headers["x-group-id"];
  if (!raw || typeof raw !== "string") {
    res.status(400).json({ error: "x-group-id header required" });
    return null;
  }
  const id = Number(raw);
  if (isNaN(id) || id <= 0) {
    res.status(400).json({ error: "Invalid x-group-id" });
    return null;
  }
  return id;
}
