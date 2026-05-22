import { Router } from "express";
import { eq, and, sql } from "drizzle-orm";

import {
  db,
  playersTable,
  bankTable,
  gameSessionsTable,
  gameSessionPlayersTable,
  balanceSnapshotsTable,
} from "@workspace/db";

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

function mapSessionPlayer(p: {
  sessionPlayerId: number;
  joinedAt: Date;
  playerId: number;
  name: string;
  chipBalance: string;
  fixumPaid: string;
}) {
  return {
    sessionPlayerId: p.sessionPlayerId,
    playerId: p.playerId,
    name: p.name,
    chipBalance: Number(p.chipBalance),
    fixumPaid: Number(p.fixumPaid),
    joinedAt: p.joinedAt.toISOString(),
  };
}

router.get("/game-sessions", async (req, res) => {
  const groupId = getGroupId(req, res);
  if (groupId === null) return;

  try {
    const sessions = await db
      .select()
      .from(gameSessionsTable)
      .where(eq(gameSessionsTable.groupId, groupId))
      .orderBy(gameSessionsTable.createdAt);

    const result = await Promise.all(
      sessions.map(async (s) => {
        const players = await db
          .select()
          .from(gameSessionPlayersTable)
          .where(eq(gameSessionPlayersTable.sessionId, s.id));

        return {
          id: s.id,
          name: s.name,
          status: s.status,
          createdAt: s.createdAt.toISOString(),
          endedAt: s.endedAt ? s.endedAt.toISOString() : null,
          playerCount: players.length,
        };
      }),
    );

    res.json(result);
  } catch (err) {
    console.error("Failed to list game sessions", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/game-sessions", async (req, res) => {
  const groupId = getGroupId(req, res);
  if (groupId === null) return;

  const { name } = req.body;

  if (!name || typeof name !== "string" || !name.trim()) {
    res.status(400).json({ error: "Name is required" });
    return;
  }

  try {
    const bank = await ensureBank(groupId);
    const bankBalanceBefore = Number(bank.balance);

    const [session] = await db
      .insert(gameSessionsTable)
      .values({
        name: name.trim(),
        status: "active",
        bankBalanceBefore: String(bankBalanceBefore),
        groupId,
      })
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
    console.error("Failed to create game session", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/game-sessions/active", async (req, res) => {
  const groupId = getGroupId(req, res);
  if (groupId === null) return;

  try {
    const [session] = await db
      .select()
      .from(gameSessionsTable)
      .where(and(eq(gameSessionsTable.groupId, groupId), eq(gameSessionsTable.status, "active")))
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
        fixumPaid: playersTable.fixumPaid,
      })
      .from(gameSessionPlayersTable)
      .innerJoin(
        playersTable,
        eq(gameSessionPlayersTable.playerId, playersTable.id),
      )
      .where(eq(gameSessionPlayersTable.sessionId, session.id));

    res.json({
      id: session.id,
      name: session.name,
      status: session.status,
      createdAt: session.createdAt.toISOString(),
      endedAt: session.endedAt ? session.endedAt.toISOString() : null,
      players: sessionPlayers.map(mapSessionPlayer),
    });
  } catch (err) {
    console.error("Failed to get active session", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/game-sessions/:id", async (req, res) => {
  const groupId = getGroupId(req, res);
  if (groupId === null) return;

  const id = Number(req.params.id);

  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  try {
    const [session] = await db
      .select()
      .from(gameSessionsTable)
      .where(and(eq(gameSessionsTable.id, id), eq(gameSessionsTable.groupId, groupId)))
      .limit(1);

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
        fixumPaid: playersTable.fixumPaid,
      })
      .from(gameSessionPlayersTable)
      .innerJoin(
        playersTable,
        eq(gameSessionPlayersTable.playerId, playersTable.id),
      )
      .where(eq(gameSessionPlayersTable.sessionId, id));

    res.json({
      id: session.id,
      name: session.name,
      status: session.status,
      createdAt: session.createdAt.toISOString(),
      endedAt: session.endedAt ? session.endedAt.toISOString() : null,
      players: sessionPlayers.map(mapSessionPlayer),
    });
  } catch (err) {
    console.error("Failed to get game session", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/game-sessions/:id/history", async (req, res) => {
  const groupId = getGroupId(req, res);
  if (groupId === null) return;

  const id = Number(req.params.id);

  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  try {
    const [session] = await db
      .select()
      .from(gameSessionsTable)
      .where(and(eq(gameSessionsTable.id, id), eq(gameSessionsTable.groupId, groupId)))
      .limit(1);

    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    const snapshots = await db
      .select()
      .from(balanceSnapshotsTable)
      .where(eq(balanceSnapshotsTable.sessionId, id));

    const bankBefore = session.bankBalanceBefore
      ? Number(session.bankBalanceBefore)
      : null;

    const bankAfter = session.bankBalanceAfter
      ? Number(session.bankBalanceAfter)
      : null;

    res.json({
      id: session.id,
      name: session.name,
      status: session.status,
      createdAt: session.createdAt.toISOString(),
      endedAt: session.endedAt ? session.endedAt.toISOString() : null,
      bankBalanceBefore: bankBefore,
      bankBalanceAfter: bankAfter,
      bankDiff:
        bankBefore !== null && bankAfter !== null
          ? bankAfter - bankBefore
          : null,
      players: snapshots.map((s) => ({
        playerId: s.playerId,
        playerName: s.playerName,
        balanceBefore: Number(s.balanceBefore),
        balanceAfter: Number(s.balanceAfter),
        diff: Number(s.balanceAfter) - Number(s.balanceBefore),
      })),
    });
  } catch (err) {
    console.error("Failed to get session history", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/game-sessions/:id/finalize", async (req, res) => {
  const groupId = getGroupId(req, res);
  if (groupId === null) return;

  const sessionId = Number(req.params.id);

  if (isNaN(sessionId)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const { balances } = req.body;

  if (!Array.isArray(balances)) {
    res.status(400).json({ error: "balances must be an array" });
    return;
  }

  try {
    const [session] = await db
      .select()
      .from(gameSessionsTable)
      .where(and(eq(gameSessionsTable.id, sessionId), eq(gameSessionsTable.groupId, groupId)))
      .limit(1);

    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    let totalPlayerDiff = 0;

    for (const entry of balances) {
      const { playerId, finalBalance } = entry;

      if (typeof playerId !== "number" || typeof finalBalance !== "number") {
        continue;
      }

      const [player] = await db
        .select()
        .from(playersTable)
        .where(and(eq(playersTable.id, playerId), eq(playersTable.groupId, groupId)))
        .limit(1);

      if (!player) continue;

      const balanceBefore = Number(player.chipBalance);
      const balanceAfter = finalBalance;
      const playerDiff = balanceAfter - balanceBefore;

      totalPlayerDiff += playerDiff;

      await db
        .update(playersTable)
        .set({
          chipBalance: String(balanceAfter),
        })
        .where(and(eq(playersTable.id, playerId), eq(playersTable.groupId, groupId)));

      await db.insert(balanceSnapshotsTable).values({
        playerId,
        playerName: player.name,
        sessionId,
        sessionName: session.name,
        balanceBefore: String(balanceBefore),
        balanceAfter: String(balanceAfter),
      });
    }

    const bank = await ensureBank(groupId);
    const bankAdjustment = -totalPlayerDiff;

    await db
      .update(bankTable)
      .set({
        balance: sql`${bankTable.balance} + ${bankAdjustment}`,
        updatedAt: new Date(),
      })
      .where(and(eq(bankTable.id, bank.id), eq(bankTable.groupId, groupId)));

    const [updatedBank] = await db
      .select()
      .from(bankTable)
      .where(and(eq(bankTable.id, bank.id), eq(bankTable.groupId, groupId)))
      .limit(1);

    const bankBalanceAfter = Number(updatedBank.balance);

    const sessionPlayers = await db
      .select()
      .from(gameSessionPlayersTable)
      .where(eq(gameSessionPlayersTable.sessionId, sessionId));

    const [updated] = await db
      .update(gameSessionsTable)
      .set({
        status: "ended",
        endedAt: new Date(),
        bankBalanceAfter: String(bankBalanceAfter),
      })
      .where(and(eq(gameSessionsTable.id, sessionId), eq(gameSessionsTable.groupId, groupId)))
      .returning();

    res.json({
      id: updated.id,
      name: updated.name,
      status: updated.status,
      createdAt: updated.createdAt.toISOString(),
      endedAt: updated.endedAt ? updated.endedAt.toISOString() : null,
      playerCount: sessionPlayers.length,
      bankAdjustment,
      bankBalanceAfter,
    });
  } catch (err) {
    console.error("Failed to finalize game session", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/game-sessions/:id/players", async (req, res) => {
  const groupId = getGroupId(req, res);
  if (groupId === null) return;

  const sessionId = Number(req.params.id);
  const { playerId } = req.body;

  if (isNaN(sessionId) || !playerId || isNaN(Number(playerId))) {
    res.status(400).json({ error: "Invalid session or player id" });
    return;
  }

  try {
    const [session] = await db
      .select()
      .from(gameSessionsTable)
      .where(and(eq(gameSessionsTable.id, sessionId), eq(gameSessionsTable.groupId, groupId)))
      .limit(1);

    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    const [player] = await db
      .select()
      .from(playersTable)
      .where(and(eq(playersTable.id, Number(playerId)), eq(playersTable.groupId, groupId)))
      .limit(1);

    if (!player) {
      res.status(404).json({ error: "Player not found" });
      return;
    }

    const existing = await db
      .select()
      .from(gameSessionPlayersTable)
      .where(
        and(
          eq(gameSessionPlayersTable.sessionId, sessionId),
          eq(gameSessionPlayersTable.playerId, Number(playerId)),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      res.status(409).json({ error: "Player already in session" });
      return;
    }

    const [sp] = await db
      .insert(gameSessionPlayersTable)
      .values({
        sessionId,
        playerId: Number(playerId),
      })
      .returning();

    res.status(201).json(
      mapSessionPlayer({
        sessionPlayerId: sp.id,
        joinedAt: sp.joinedAt,
        playerId: player.id,
        name: player.name,
        chipBalance: player.chipBalance,
        fixumPaid: player.fixumPaid,
      }),
    );
  } catch (err) {
    console.error("Failed to add player to session", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/game-sessions/:id/players/:playerId", async (req, res) => {
  const groupId = getGroupId(req, res);
  if (groupId === null) return;

  const sessionId = Number(req.params.id);
  const playerId = Number(req.params.playerId);

  if (isNaN(sessionId) || isNaN(playerId)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  try {
    const [session] = await db
      .select()
      .from(gameSessionsTable)
      .where(and(eq(gameSessionsTable.id, sessionId), eq(gameSessionsTable.groupId, groupId)))
      .limit(1);

    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    const [player] = await db
      .select()
      .from(playersTable)
      .where(and(eq(playersTable.id, playerId), eq(playersTable.groupId, groupId)))
      .limit(1);

    if (!player) {
      res.status(404).json({ error: "Player not found" });
      return;
    }

    await db
      .delete(gameSessionPlayersTable)
      .where(
        and(
          eq(gameSessionPlayersTable.sessionId, sessionId),
          eq(gameSessionPlayersTable.playerId, playerId),
        ),
      );

    res.json({ success: true });
  } catch (err) {
    console.error("Failed to remove player from session", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
