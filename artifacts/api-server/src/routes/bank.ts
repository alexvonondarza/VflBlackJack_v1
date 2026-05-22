import { Router } from "express";
import { eq, sql, and } from "drizzle-orm";
import { db, bankTable, playersTable } from "@workspace/db";
import { getGroupId } from "../lib/groupId.js";

const router = Router();

async function ensureBank(groupId: number) {
  const rows = await db.select().from(bankTable).where(eq(bankTable.groupId, groupId)).limit(1);

  if (rows.length === 0) {
    const [row] = await db
      .insert(bankTable)
      .values({ balance: "0.00", groupId })
      .returning();

    return row;
  }

  return rows[0];
}

router.get("/bank", async (req, res) => {
  const groupId = getGroupId(req, res);
  if (groupId === null) return;

  try {
    const bank = await ensureBank(groupId);

    res.json({
      balance: Number(bank.balance),
      updatedAt: bank.updatedAt.toISOString(),
    });
  } catch (err) {
    console.error("Failed to get bank", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/stats", async (req, res) => {
  const groupId = getGroupId(req, res);
  if (groupId === null) return;

  try {
    const bank = await ensureBank(groupId);

    const playerCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(playersTable)
      .where(eq(playersTable.groupId, groupId));

    const chipsResult = await db
      .select({
        total: sql<string>`coalesce(sum(${playersTable.chipBalance}), 0)`,
      })
      .from(playersTable)
      .where(eq(playersTable.groupId, groupId));

    const bankBalance = Number(bank.balance);
    const playerCount = Number(playerCountResult[0]?.count ?? 0);
    const totalChipsInPlay = Number(chipsResult[0]?.total ?? 0);
    const totalInCirculation = bankBalance + totalChipsInPlay;

    res.json({
      bankBalance,
      playerCount,
      totalChipsInPlay,
      totalInCirculation,
    });
  } catch (err) {
    console.error("Failed to get stats", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
