import { Router } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, playersTable, bankTable, gameSessionsTable, gameSessionPlayersTable } from "@workspace/db";

const router = Router();

const FIXUM = 5;

async function ensureBank() {
  const rows = await db.select().from(bankTable).limit(1);
  if (rows.length === 0) {
    const [row] = await db.insert(bankTable).values({ balance: "0.00" }).returning();
    return row;
  }
  return rows[0];
}

router.get("/game-sessions", async (req, res) => {
  try {
    const sessions = await db.select().from(gameSessionsTable).orderBy(gameSessionsTable.createdAt);
    const result = await Promise.all(
      sessions.map(async (s) => {
        const players = await db.select().from(gameSessionPlayersTable).where(eq(gameSessionPlayersTable.sessionId, s.id));
        return {
          id: s.id,
          name: s.name,
          status: s.status,
          createdAt: s.createdAt.toISOString(),
          endedAt: s.endedAt ? s.endedAt.toISOString() : null,
          playerCount: players.length,
        };
      })
    );
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to list game sessions");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/game-sessions", async (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== "string" || !name.trim()) {
    res.status(400).json({ error: "Name is required" });
    return;
  }
  try {
    const [session] = await db
      .insert(gameSessionsTable)
      .values({ name: name.trim(), status: "active" })
      .returning();
    res.status(201).json({
      id: session.id,
      name: session.name,
      status: session.status,
      createdAt: session.createdAt.toISOString(),
      endedAt: null,
      playerCount: 0,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create game session");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/game-sessions/active", async (req, res) => {
  try {
    const [session] = await db
      .select()
      .from(gameSessionsTable)
      .where(eq(gameSessionsTable.status, "active"))
      .orderBy(gameSessionsTable.createdAt)
      .limit(1);

    if (!session) {
      res.json(null);
      return;
    }

    const sessionPlayers = await db
      .select({
        sessionPlayerId: gameSessionPlayersTable.id,
        joinedAt: gameSessionPlayersTable.joinedAt,
        playerId: playersTable.id,
        name: playersTable.name,
        chipBalance: playersTable.chipBalance,
        totalBought: playersTable.totalBought,
      })
      .from(gameSessionPlayersTable)
      .innerJoin(playersTable, eq(gameSessionPlayersTable.playerId, playersTable.id))
      .where(eq(gameSessionPlayersTable.sessionId, session.id));

    res.json({
      id: session.id,
      name: session.name,
      status: session.status,
      createdAt: session.createdAt.toISOString(),
      endedAt: session.endedAt ? session.endedAt.toISOString() : null,
      players: sessionPlayers.map((p) => ({
        sessionPlayerId: p.sessionPlayerId,
        playerId: p.playerId,
        name: p.name,
        chipBalance: Number(p.chipBalance),
        totalBought: Number(p.totalBought),
        joinedAt: p.joinedAt.toISOString(),
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get active session");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/game-sessions/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  try {
    const [session] = await db.select().from(gameSessionsTable).where(eq(gameSessionsTable.id, id)).limit(1);
    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    const sessionPlayers = await db
      .select({
        sessionPlayerId: gameSessionPlayersTable.id,
        joinedAt: gameSessionPlayersTable.joinedAt,
        playerId: playersTable.id,
        name: playersTable.name,
        chipBalance: playersTable.chipBalance,
        totalBought: playersTable.totalBought,
      })
      .from(gameSessionPlayersTable)
      .innerJoin(playersTable, eq(gameSessionPlayersTable.playerId, playersTable.id))
      .where(eq(gameSessionPlayersTable.sessionId, id));

    res.json({
      id: session.id,
      name: session.name,
      status: session.status,
      createdAt: session.createdAt.toISOString(),
      endedAt: session.endedAt ? session.endedAt.toISOString() : null,
      players: sessionPlayers.map((p) => ({
        sessionPlayerId: p.sessionPlayerId,
        playerId: p.playerId,
        name: p.name,
        chipBalance: Number(p.chipBalance),
        totalBought: Number(p.totalBought),
        joinedAt: p.joinedAt.toISOString(),
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get game session");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/game-sessions/:id/end", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  try {
    const [session] = await db.select().from(gameSessionsTable).where(eq(gameSessionsTable.id, id)).limit(1);
    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    const players = await db.select().from(gameSessionPlayersTable).where(eq(gameSessionPlayersTable.sessionId, id));

    const [updated] = await db
      .update(gameSessionsTable)
      .set({ status: "ended", endedAt: new Date() })
      .where(eq(gameSessionsTable.id, id))
      .returning();

    res.json({
      id: updated.id,
      name: updated.name,
      status: updated.status,
      createdAt: updated.createdAt.toISOString(),
      endedAt: updated.endedAt ? updated.endedAt.toISOString() : null,
      playerCount: players.length,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to end game session");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/game-sessions/:id/players", async (req, res) => {
  const sessionId = Number(req.params.id);
  const { playerId } = req.body;

  if (isNaN(sessionId) || !playerId || isNaN(Number(playerId))) {
    res.status(400).json({ error: "Invalid session or player id" });
    return;
  }

  try {
    const [session] = await db.select().from(gameSessionsTable).where(eq(gameSessionsTable.id, sessionId)).limit(1);
    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    const [player] = await db.select().from(playersTable).where(eq(playersTable.id, Number(playerId))).limit(1);
    if (!player) {
      res.status(404).json({ error: "Player not found" });
      return;
    }

    const existing = await db
      .select()
      .from(gameSessionPlayersTable)
      .where(and(eq(gameSessionPlayersTable.sessionId, sessionId), eq(gameSessionPlayersTable.playerId, Number(playerId))))
      .limit(1);

    if (existing.length > 0) {
      res.status(409).json({ error: "Player already in session" });
      return;
    }

    const [sp] = await db
      .insert(gameSessionPlayersTable)
      .values({ sessionId, playerId: Number(playerId) })
      .returning();

    // Apply 5€ Fixum
    const [updatedPlayer] = await db
      .update(playersTable)
      .set({
        chipBalance: sql`${playersTable.chipBalance} + ${FIXUM}`,
        totalBought: sql`${playersTable.totalBought} + ${FIXUM}`,
      })
      .where(eq(playersTable.id, Number(playerId)))
      .returning();

    const bank = await ensureBank();
    await db
      .update(bankTable)
      .set({ balance: sql`${bankTable.balance} + ${FIXUM}`, updatedAt: new Date() })
      .where(eq(bankTable.id, bank.id));

    res.status(201).json({
      sessionPlayerId: sp.id,
      playerId: updatedPlayer.id,
      name: updatedPlayer.name,
      chipBalance: Number(updatedPlayer.chipBalance),
      totalBought: Number(updatedPlayer.totalBought),
      joinedAt: sp.joinedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to add player to session");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/game-sessions/:id/players/:playerId", async (req, res) => {
  const sessionId = Number(req.params.id);
  const playerId = Number(req.params.playerId);

  if (isNaN(sessionId) || isNaN(playerId)) {
    res.status(400).json({ error: "Invalid ids" });
    return;
  }

  try {
    const [sp] = await db
      .select()
      .from(gameSessionPlayersTable)
      .where(and(eq(gameSessionPlayersTable.sessionId, sessionId), eq(gameSessionPlayersTable.playerId, playerId)))
      .limit(1);

    if (!sp) {
      res.status(404).json({ error: "Player not in session" });
      return;
    }

    await db.delete(gameSessionPlayersTable).where(eq(gameSessionPlayersTable.id, sp.id));

    // Revert 5€ Fixum
    await db
      .update(playersTable)
      .set({
        chipBalance: sql`GREATEST(${playersTable.chipBalance} - ${FIXUM}, 0)`,
        totalBought: sql`GREATEST(${playersTable.totalBought} - ${FIXUM}, 0)`,
      })
      .where(eq(playersTable.id, playerId));

    const bank = await ensureBank();
    await db
      .update(bankTable)
      .set({ balance: sql`GREATEST(${bankTable.balance} - ${FIXUM}, 0)`, updatedAt: new Date() })
      .where(eq(bankTable.id, bank.id));

    res.json({ success: true, revertedAmount: FIXUM });
  } catch (err) {
    req.log.error({ err }, "Failed to remove player from session");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
