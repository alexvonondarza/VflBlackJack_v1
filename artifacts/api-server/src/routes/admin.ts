import { Router, type Request, type Response } from "express";
import { eq, and } from "drizzle-orm";

import {
  db,
  playersTable,
  bankTable,
  gameSessionsTable,
  gameSessionPlayersTable,
  balanceSnapshotsTable,
  adminSettingsTable,
  chipInventoryTable,
} from "@workspace/db";

import { getGroupId } from "../lib/groupId.js";

const router = Router();

async function ensureAdminSettings(groupId: number) {
  const rows = await db.select().from(adminSettingsTable).where(eq(adminSettingsTable.groupId, groupId)).limit(1);

  if (rows.length > 0) {
    return rows[0];
  }

  const [settings] = await db
    .insert(adminSettingsTable)
    .values({
      passwordHash: "",
      passwordSalt: "",
      groupId,
    })
    .returning();

  return settings;
}

router.get("/admin/players", async (req: Request, res: Response) => {
  const groupId = getGroupId(req, res);
  if (groupId === null) return;

  try {
    const players = await db
      .select()
      .from(playersTable)
      .where(eq(playersTable.groupId, groupId))
      .orderBy(playersTable.createdAt);

    res.json(
      players.map((p) => ({
        id: p.id,
        name: p.name,
        chipBalance: Number(p.chipBalance),
        fixumPaid: Number(p.fixumPaid),
        createdAt: p.createdAt.toISOString(),
      })),
    );
  } catch (err) {
    console.error("Failed to load admin players", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/admin/players/:id", async (req: Request, res: Response) => {
  const groupId = getGroupId(req, res);
  if (groupId === null) return;

  try {
    const id = Number(req.params.id);
    const { name, chipBalance } = req.body;

    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid player id" });
      return;
    }

    const updateValues: { name?: string; chipBalance?: string } = {};

    if (typeof name === "string" && name.trim()) {
      updateValues.name = name.trim();
    }

    if (chipBalance !== undefined) {
      const parsedBalance = Number(chipBalance);
      if (Number.isNaN(parsedBalance) || parsedBalance < 0) {
        res.status(400).json({ error: "Invalid chip balance" });
        return;
      }
      updateValues.chipBalance = String(parsedBalance);
    }

    if (Object.keys(updateValues).length === 0) {
      res.status(400).json({ error: "Nothing to update" });
      return;
    }

    const [updated] = await db
      .update(playersTable)
      .set(updateValues)
      .where(and(eq(playersTable.id, id), eq(playersTable.groupId, groupId)))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Player not found" });
      return;
    }

    res.json({
      id: updated.id,
      name: updated.name,
      chipBalance: Number(updated.chipBalance),
      fixumPaid: Number(updated.fixumPaid),
      createdAt: updated.createdAt.toISOString(),
    });
  } catch (err) {
    console.error("Failed to update player admin", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/admin/initial-balances", async (req: Request, res: Response) => {
  const groupId = getGroupId(req, res);
  if (groupId === null) return;

  try {
    const { balances } = req.body;

    if (!Array.isArray(balances)) {
      res.status(400).json({ error: "balances must be an array" });
      return;
    }

    for (const entry of balances) {
      const playerId = Number(entry.playerId);
      const chipBalance = Number(entry.chipBalance);

      if (Number.isNaN(playerId) || Number.isNaN(chipBalance) || chipBalance < 0) {
        continue;
      }

      await db
        .update(playersTable)
        .set({ chipBalance: String(chipBalance) })
        .where(and(eq(playersTable.id, playerId), eq(playersTable.groupId, groupId)));
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Failed to update initial balances", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/admin/chip-inventory", async (req: Request, res: Response) => {
  const groupId = getGroupId(req, res);
  if (groupId === null) return;

  try {
    const { chips } = req.body;

    if (!Array.isArray(chips)) {
      res.status(400).json({ error: "chips must be an array" });
      return;
    }

    await db.delete(chipInventoryTable).where(eq(chipInventoryTable.groupId, groupId));

    for (const chip of chips) {
      const value = Number(chip.value);
      const quantity = Number(chip.quantity);

      if (Number.isNaN(value) || Number.isNaN(quantity) || value <= 0 || quantity < 0) {
        continue;
      }

      await db.insert(chipInventoryTable).values({ value, quantity, groupId });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Failed to save chip inventory", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/settings", async (req: Request, res: Response) => {
  const groupId = getGroupId(req, res);
  if (groupId === null) return;

  try {
    const settings = await ensureAdminSettings(groupId);
    res.json({ bankChipPercentage: settings.bankChipPercentage ?? 10 });
  } catch (err) {
    console.error("Failed to load settings", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/admin/settings", async (req: Request, res: Response) => {
  const groupId = getGroupId(req, res);
  if (groupId === null) return;

  try {
    const { bankChipPercentage } = req.body;
    const pct = Number(bankChipPercentage);

    if (Number.isNaN(pct) || pct < 0 || pct > 100) {
      res.status(400).json({ error: "bankChipPercentage must be between 0 and 100" });
      return;
    }

    const settings = await ensureAdminSettings(groupId);

    await db
      .update(adminSettingsTable)
      .set({ bankChipPercentage: Math.round(pct), updatedAt: new Date() })
      .where(and(eq(adminSettingsTable.id, settings.id), eq(adminSettingsTable.groupId, groupId)));

    res.json({ success: true, bankChipPercentage: Math.round(pct) });
  } catch (err) {
    console.error("Failed to save settings", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/admin/reset", async (req: Request, res: Response) => {
  const groupId = getGroupId(req, res);
  if (groupId === null) return;

  try {
    const sessions = await db
      .select()
      .from(gameSessionsTable)
      .where(eq(gameSessionsTable.groupId, groupId));

    for (const session of sessions) {
      await db.delete(balanceSnapshotsTable).where(eq(balanceSnapshotsTable.sessionId, session.id));
      await db.delete(gameSessionPlayersTable).where(eq(gameSessionPlayersTable.sessionId, session.id));
    }

    await db.delete(gameSessionsTable).where(eq(gameSessionsTable.groupId, groupId));

    const players = await db.select().from(playersTable).where(eq(playersTable.groupId, groupId));
    for (const player of players) {
      await db.delete(balanceSnapshotsTable).where(eq(balanceSnapshotsTable.playerId, player.id));
    }

    await db.delete(playersTable).where(eq(playersTable.groupId, groupId));
    await db.delete(bankTable).where(eq(bankTable.groupId, groupId));
    await db.insert(bankTable).values({ balance: "0.00", groupId });

    res.json({ success: true });
  } catch (err) {
    console.error("Failed to reset database", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
