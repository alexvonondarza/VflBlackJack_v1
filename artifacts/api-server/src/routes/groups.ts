import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, groupsTable, playersTable, bankTable, gameSessionsTable, gameSessionPlayersTable, balanceSnapshotsTable, adminSettingsTable, chipInventoryTable } from "@workspace/db";

const router = Router();

const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD || "superadmin";

function requireSuperAdmin(req: any, res: any): boolean {
  const password = req.headers["x-superadmin-password"] || req.body?.superadminPassword;
  if (!password || password !== SUPERADMIN_PASSWORD) {
    res.status(401).json({ error: "Superadmin password required or invalid" });
    return false;
  }
  return true;
}

router.post("/groups/find-or-create", async (req, res) => {
  const { name } = req.body;

  if (!name || typeof name !== "string" || !name.trim()) {
    res.status(400).json({ error: "Group name is required" });
    return;
  }

  const normalized = name.trim();

  try {
    const existing = await db
      .select()
      .from(groupsTable)
      .where(eq(groupsTable.name, normalized))
      .limit(1);

    if (existing.length > 0) {
      res.json({ id: existing[0].id, name: existing[0].name, created: false });
      return;
    }

    const [group] = await db
      .insert(groupsTable)
      .values({ name: normalized })
      .returning();

    res.status(201).json({ id: group.id, name: group.name, created: true });
  } catch (err) {
    console.error("Failed to find or create group", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/superadmin/groups", async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;

  try {
    const groups = await db.select().from(groupsTable).orderBy(groupsTable.createdAt);

    const result = await Promise.all(
      groups.map(async (g) => {
        const playerCount = await db
          .select()
          .from(playersTable)
          .where(eq(playersTable.groupId, g.id));

        const bank = await db
          .select()
          .from(bankTable)
          .where(eq(bankTable.groupId, g.id))
          .limit(1);

        return {
          id: g.id,
          name: g.name,
          createdAt: g.createdAt.toISOString(),
          playerCount: playerCount.length,
          bankBalance: bank[0] ? Number(bank[0].balance) : 0,
        };
      }),
    );

    res.json(result);
  } catch (err) {
    console.error("Failed to list groups", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/superadmin/groups/:id", async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;

  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid group id" });
    return;
  }

  try {
    const [group] = await db
      .select()
      .from(groupsTable)
      .where(eq(groupsTable.id, id))
      .limit(1);

    if (!group) {
      res.status(404).json({ error: "Group not found" });
      return;
    }

    await db.delete(groupsTable).where(eq(groupsTable.id, id));

    res.json({ success: true });
  } catch (err) {
    console.error("Failed to delete group", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
