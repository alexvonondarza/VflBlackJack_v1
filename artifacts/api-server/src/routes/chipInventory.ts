import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, chipInventoryTable } from "@workspace/db";
import { getGroupId } from "../lib/groupId.js";

const router = Router();

router.get("/chip-inventory", async (req, res) => {
  const groupId = getGroupId(req, res);
  if (groupId === null) return;

  try {
    const chips = await db
      .select()
      .from(chipInventoryTable)
      .where(eq(chipInventoryTable.groupId, groupId))
      .orderBy(chipInventoryTable.value);

    res.json(
      chips.map((chip) => ({
        id: chip.id,
        value: chip.value,
        quantity: chip.quantity,
      })),
    );
  } catch (err) {
    console.error("Failed to load chip inventory", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
