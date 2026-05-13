import { Router } from "express";
import { db, bankTable, playersTable } from "@workspace/db";
import { sql } from "drizzle-orm";

const router = Router();

router.get("/bank", async (req, res) => {
  try {
    const bankRows = await db.select().from(bankTable).limit(1);
    if (bankRows.length === 0) {
      await db.insert(bankTable).values({ balance: "0.00" });
      res.json({ balance: 0 });
      return;
    }
    res.json({ balance: Number(bankRows[0].balance) });
  } catch (err) {
    req.log.error({ err }, "Failed to get bank");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/stats", async (req, res) => {
  try {
    const bankRows = await db.select().from(bankTable).limit(1);
    const bankBalance = bankRows.length > 0 ? Number(bankRows[0].balance) : 0;

    const players = await db.select().from(playersTable);
    const playerCount = players.length;
    const totalChipsInPlay = players.reduce((sum, p) => sum + Number(p.chipBalance), 0);

    res.json({ bankBalance, playerCount, totalChipsInPlay });
  } catch (err) {
    req.log.error({ err }, "Failed to get stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
