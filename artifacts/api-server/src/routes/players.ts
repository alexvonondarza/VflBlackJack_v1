import { Router } from "express";
import { eq, sql } from "drizzle-orm";
import { db, playersTable, bankTable } from "@workspace/db";
import {
  CreatePlayerBody,
  DeletePlayerParams,
  BuyChipsParams,
  BuyChipsBody,
} from "@workspace/api-zod";

const router = Router();

router.get("/players", async (req, res) => {
  try {
    const players = await db.select().from(playersTable).orderBy(playersTable.createdAt);
    res.json(
      players.map((p) => ({
        id: p.id,
        name: p.name,
        chipBalance: Number(p.chipBalance),
        totalBought: Number(p.totalBought),
        createdAt: p.createdAt.toISOString(),
      }))
    );
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
    const FIXUM = 5;
    const [player] = await db
      .insert(playersTable)
      .values({
        name: parsed.data.name,
        chipBalance: String(FIXUM),
        totalBought: String(FIXUM),
      })
      .returning();

    const bankRows = await db.select().from(bankTable).limit(1);
    if (bankRows.length === 0) {
      await db.insert(bankTable).values({ balance: String(FIXUM) });
    } else {
      await db
        .update(bankTable)
        .set({ balance: sql`${bankTable.balance} + ${FIXUM}`, updatedAt: new Date() })
        .where(eq(bankTable.id, bankRows[0].id));
    }

    res.status(201).json({
      id: player.id,
      name: player.name,
      chipBalance: Number(player.chipBalance),
      totalBought: Number(player.totalBought),
      createdAt: player.createdAt.toISOString(),
    });
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

    const cashoutAmount = Number(player.chipBalance);

    const bankRows = await db.select().from(bankTable).limit(1);
    let newBankBalance = 0;
    if (bankRows.length > 0) {
      await db
        .update(bankTable)
        .set({
          balance: sql`${bankTable.balance} - ${cashoutAmount}`,
          updatedAt: new Date(),
        })
        .where(eq(bankTable.id, bankRows[0].id));
      newBankBalance = Number(bankRows[0].balance) - cashoutAmount;
    }

    await db.delete(playersTable).where(eq(playersTable.id, parsed.data.id));

    res.json({
      player: {
        id: player.id,
        name: player.name,
        chipBalance: cashoutAmount,
        totalBought: Number(player.totalBought),
        createdAt: player.createdAt.toISOString(),
      },
      cashoutAmount,
      newBankBalance,
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
      .set({
        chipBalance: sql`${playersTable.chipBalance} + ${amount}`,
        totalBought: sql`${playersTable.totalBought} + ${amount}`,
      })
      .where(eq(playersTable.id, paramsParsed.data.id))
      .returning();

    const bankRows = await db.select().from(bankTable).limit(1);
    if (bankRows.length === 0) {
      await db.insert(bankTable).values({ balance: String(amount) });
    } else {
      await db
        .update(bankTable)
        .set({ balance: sql`${bankTable.balance} + ${amount}`, updatedAt: new Date() })
        .where(eq(bankTable.id, bankRows[0].id));
    }

    res.json({
      id: updated.id,
      name: updated.name,
      chipBalance: Number(updated.chipBalance),
      totalBought: Number(updated.totalBought),
      createdAt: updated.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to buy chips");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
