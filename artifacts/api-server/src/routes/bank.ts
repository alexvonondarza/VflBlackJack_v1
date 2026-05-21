import { Router } from "express";
import { sql } from "drizzle-orm";
import { db, bankTable, playersTable } from "@workspace/db";

const router = Router();

async function ensureBank() {
  const rows = await db.select().from(bankTable).limit(1);

  if (rows.length === 0) {
    const [row] = await db
      .insert(bankTable)
      .values({ balance: "0.00" })
      .returning();

    return row;
  }

  return rows[0];
}

router.get("/bank", async (_req, res) => {
  try {
    const bank = await ensureBank();

    res.json({
      balance: Number(bank.balance),
      updatedAt: bank.updatedAt.toISOString(),
    });
  } catch (err) {
    console.error("Failed to get bank", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/stats", async (_req, res) => {
  try {
    const bank = await ensureBank();

    const playerCountResult = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(playersTable);

    const chipsResult = await db
      .select({
        total: sql<string>`coalesce(sum(${playersTable.chipBalance}), 0)`,
      })
      .from(playersTable);

    const fixumResult = await db
      .select({
        total: sql<string>`coalesce(sum(${playersTable.fixumPaid}), 0)`,
      })
      .from(playersTable);

    const bankBalance = Number(bank.balance);

    const playerCount = Number(
      playerCountResult[0]?.count ?? 0,
    );

    const totalChipsInPlay = Number(
      chipsResult[0]?.total ?? 0,
    );

    const totalFixumPaid = Number(
      fixumResult[0]?.total ?? 0,
    );

    // Gesamtvermögen im System:
    // Bank + alle Spielerbestände
    const totalInCirculation =
      bankBalance + totalChipsInPlay;

res.json({
  bankBalance,
  playerCount,
  totalChipsInPlay,
  totalInCirculation: bankBalance + totalChipsInPlay,
});
  } catch (err) {
    console.error("Failed to get stats", err);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

export default router;
