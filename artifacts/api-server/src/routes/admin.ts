import { Router, type Request, type Response } from "express";
import crypto from "node:crypto";
import { eq } from "drizzle-orm";

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

const router = Router();

const DEFAULT_ADMIN_PASSWORD =
  process.env.ADMIN_INITIAL_PASSWORD || "admin";

function createPasswordHash(password: string, salt?: string) {
  const passwordSalt = salt || crypto.randomBytes(16).toString("hex");

  const passwordHash = crypto
    .pbkdf2Sync(password, passwordSalt, 100_000, 64, "sha512")
    .toString("hex");

  return {
    passwordHash,
    passwordSalt,
  };
}

async function ensureAdminSettings() {
  const rows = await db.select().from(adminSettingsTable).limit(1);

  if (rows.length > 0) {
    return rows[0];
  }

  const { passwordHash, passwordSalt } =
    createPasswordHash(DEFAULT_ADMIN_PASSWORD);

  const [settings] = await db
    .insert(adminSettingsTable)
    .values({
      passwordHash,
      passwordSalt,
    })
    .returning();

  return settings;
}

async function checkPassword(password: string) {
  const settings = await ensureAdminSettings();

  const { passwordHash } = createPasswordHash(
    password,
    settings.passwordSalt,
  );

  return passwordHash === settings.passwordHash;
}

async function requireAdmin(req: Request, res: Response) {
  const password =
    req.headers["x-admin-password"] ||
    req.body?.password ||
    req.query?.password;

  if (!password || typeof password !== "string") {
    res.status(401).json({ error: "Admin password required" });
    return false;
  }

  const ok = await checkPassword(password);

  if (!ok) {
    res.status(401).json({ error: "Invalid admin password" });
    return false;
  }

  return true;
}

router.post("/admin/login", async (req, res) => {
  try {
    const { password } = req.body;

    if (!password || typeof password !== "string") {
      res.status(400).json({ error: "Password required" });
      return;
    }

    const ok = await checkPassword(password);

    if (!ok) {
      res.status(401).json({ error: "Invalid password" });
      return;
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Admin login failed", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/admin/password", async (req, res) => {
  try {
    const { password, newPassword } = req.body;

    if (!password || !newPassword) {
      res.status(400).json({ error: "Password and newPassword required" });
      return;
    }

    const ok = await checkPassword(password);

    if (!ok) {
      res.status(401).json({ error: "Invalid password" });
      return;
    }

    if (typeof newPassword !== "string" || newPassword.length < 4) {
      res.status(400).json({
        error: "New password must have at least 4 characters",
      });
      return;
    }

    const settings = await ensureAdminSettings();
    const { passwordHash, passwordSalt } = createPasswordHash(newPassword);

    await db
      .update(adminSettingsTable)
      .set({
        passwordHash,
        passwordSalt,
        updatedAt: new Date(),
      })
      .where(eq(adminSettingsTable.id, settings.id));

    res.json({ success: true });
  } catch (err) {
    console.error("Failed to change admin password", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/admin/players", async (req, res) => {
  try {
    if (!(await requireAdmin(req, res))) return;

    const players = await db
      .select()
      .from(playersTable)
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

router.put("/admin/players/:id", async (req, res) => {
  try {
    if (!(await requireAdmin(req, res))) return;

    const id = Number(req.params.id);
    const { name, chipBalance } = req.body;

    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid player id" });
      return;
    }

    const updateValues: {
      name?: string;
      chipBalance?: string;
    } = {};

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
      .where(eq(playersTable.id, id))
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

router.post("/admin/initial-balances", async (req, res) => {
  try {
    if (!(await requireAdmin(req, res))) return;

    const { balances } = req.body;

    if (!Array.isArray(balances)) {
      res.status(400).json({ error: "balances must be an array" });
      return;
    }

    for (const entry of balances) {
      const playerId = Number(entry.playerId);
      const chipBalance = Number(entry.chipBalance);

      if (
        Number.isNaN(playerId) ||
        Number.isNaN(chipBalance) ||
        chipBalance < 0
      ) {
        continue;
      }

      await db
        .update(playersTable)
        .set({
          chipBalance: String(chipBalance),
        })
        .where(eq(playersTable.id, playerId));
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Failed to update initial balances", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/admin/chip-inventory", async (req, res) => {
  try {
    if (!(await requireAdmin(req, res))) return;

    const { chips } = req.body;

    if (!Array.isArray(chips)) {
      res.status(400).json({ error: "chips must be an array" });
      return;
    }

    await db.delete(chipInventoryTable);

    for (const chip of chips) {
      const value = Number(chip.value);
      const quantity = Number(chip.quantity);

      if (
        Number.isNaN(value) ||
        Number.isNaN(quantity) ||
        value <= 0 ||
        quantity < 0
      ) {
        continue;
      }

      await db.insert(chipInventoryTable).values({
        value,
        quantity,
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Failed to save chip inventory", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/settings", async (_req, res) => {
  try {
    const settings = await ensureAdminSettings();
    res.json({ bankChipPercentage: settings.bankChipPercentage ?? 10 });
  } catch (err) {
    console.error("Failed to load settings", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/admin/settings", async (req, res) => {
  try {
    if (!(await requireAdmin(req, res))) return;

    const { bankChipPercentage } = req.body;
    const pct = Number(bankChipPercentage);

    if (Number.isNaN(pct) || pct < 0 || pct > 100) {
      res.status(400).json({ error: "bankChipPercentage must be between 0 and 100" });
      return;
    }

    const settings = await ensureAdminSettings();

    await db
      .update(adminSettingsTable)
      .set({ bankChipPercentage: Math.round(pct), updatedAt: new Date() })
      .where(eq(adminSettingsTable.id, settings.id));

    res.json({ success: true, bankChipPercentage: Math.round(pct) });
  } catch (err) {
    console.error("Failed to save settings", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/admin/reset", async (req, res) => {
  try {
    if (!(await requireAdmin(req, res))) return;

    await db.delete(balanceSnapshotsTable);
    await db.delete(gameSessionPlayersTable);
    await db.delete(gameSessionsTable);
    await db.delete(playersTable);
    await db.delete(bankTable);

    await db.insert(bankTable).values({
      balance: "0.00",
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Failed to reset database", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
