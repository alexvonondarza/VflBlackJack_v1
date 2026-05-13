import { Router } from "express";
import { eq, sql } from "drizzle-orm";
import { db, playersTable, bankTable, balanceSnapshotsTable } from "@workspace/db";
import {
  CreatePlayerBody,
  DeletePlayerParams,
  BuyChipsParams,
  BuyChipsBody,
} from "@workspace/api-zod";

const router = Router();

const REGISTRATION_FIXUM = 5;

async function ensureBank() {
  const rows = await db.select().from(bankTable).limit(1);
  if (rows.length === 0) {
    const [row] = await db.insert(bankTable).values({ balance: "0.00" }).returning();
    return row;
  }
  return rows[0];
}

function mapPlayer(p: typeof playersTable.$inferSelect) {
  return {
    id: p.id,
    name: p.name,
    chipBalance: Number(p.chipBalance),
    fixumPaid: Number(p.fixumPaid),
    createdAt: p.createdAt.toISOString(),
  };
}

router.get("/players", async (req, res) => {
  try {
    const players = await db.select().from(playersTable).orderBy(playersTable.createdAt);
    res.json(players.map(mapPlayer));
  } catch (err) {
    req.log.error({ err }, "Failed to list players");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/players", async (req, res) => {
  const parsed = CreatePlayerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    const [player] = await db
      .insert(playersTable)
      .values({
        name: parsed.data.name,
        chipBalance: "0.00",
        fixumPaid: String(REGISTRATION_FIXUM),
      })
      .returning();

    const bank = await ensureBank();
    await db
      .update(bankTable)
      .set({ balance: sql`${bankTable.balance} + ${REGISTRATION_FIXUM}`, updatedAt: new Date() })
      .where(eq(bankTable.id, bank.id));

    res.status(201).json(mapPlayer(player));
  } catch (err) {
    req.log.error({ err }, "Failed to create player");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/players/:id", async (req, res) => {
  const parsed = DeletePlayerParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid player id" });
    return;
  }

  try {
    const [player] = await db
      .select()
      .from(playersTable)
      .where(eq(playersTable.id, parsed.data.id))
      .limit(1);

    if (!player) {
      res.status(404).json({ error: "Player not found" });
      return;
    }

    // Cashout = fixumPaid (entry fees) + chipBalance (chip value)
    const cashoutAmount = Number(player.fixumPaid) + Number(player.chipBalance);

    const bank = await ensureBank();
    await db
      .update(bankTable)
      .set({
        balance: sql`${bankTable.balance} - ${cashoutAmount}`,
        updatedAt: new Date(),
      })
      .where(eq(bankTable.id, bank.id));

    await db.delete(playersTable).where(eq(playersTable.id, parsed.data.id));

    const [updatedBank] = await db.select().from(bankTable).where(eq(bankTable.id, bank.id)).limit(1);

    res.json({
      player: mapPlayer(player),
      cashoutAmount,
      newBankBalance: Number(updatedBank.balance),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to delete player");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/players/:id/buy-chips", async (req, res) => {
  const paramsParsed = BuyChipsParams.safeParse({ id: Number(req.params.id) });
  if (!paramsParsed.success) {
    res.status(400).json({ error: "Invalid player id" });
    return;
  }

  const bodyParsed = BuyChipsBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: bodyParsed.error.message });
    return;
  }

  try {
    const [player] = await db
      .select()
      .from(playersTable)
      .where(eq(playersTable.id, paramsParsed.data.id))
      .limit(1);

    if (!player) {
      res.status(404).json({ error: "Player not found" });
      return;
    }

    const amount = bodyParsed.data.amount;

    const [updated] = await db
      .update(playersTable)
      .set({ chipBalance: sql`${playersTable.chipBalance} + ${amount}` })
      .where(eq(playersTable.id, paramsParsed.data.id))
      .returning();

    const bank = await ensureBank();
    await db
      .update(bankTable)
      .set({ balance: sql`${bankTable.balance} + ${amount}`, updatedAt: new Date() })
      .where(eq(bankTable.id, bank.id));

    res.json(mapPlayer(updated));
  } catch (err) {
    req.log.error({ err }, "Failed to buy chips");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/players/:id/history", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid player id" });
    return;
  }

  try {
    const [player] = await db.select().from(playersTable).where(eq(playersTable.id, id)).limit(1);
    if (!player) {
      res.status(404).json({ error: "Player not found" });
      return;
    }

    const snapshots = await db
      .select()
      .from(balanceSnapshotsTable)
      .where(eq(balanceSnapshotsTable.playerId, id))
      .orderBy(balanceSnapshotsTable.capturedAt);

    res.json(
      snapshots.map((s) => ({
        id: s.id,
        sessionId: s.sessionId,
        sessionName: s.sessionName,
        balanceBefore: Number(s.balanceBefore),
        balanceAfter: Number(s.balanceAfter),
        difference: Number(s.balanceAfter) - Number(s.balanceBefore),
        capturedAt: s.capturedAt.toISOString(),
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Failed to get player history");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
