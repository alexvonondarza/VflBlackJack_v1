import { Router } from "express";
import { db, chipInventoryTable } from "@workspace/db";

const router = Router();

router.get("/chip-inventory", async (_req, res) => {
  try {
    const chips = await db
      .select()
      .from(chipInventoryTable)
      .orderBy(chipInventoryTable.value);

    res.json(
      chips.map((c) => ({
        id: c.id,
        value: c.value,
        quantity: c.quantity,
      })),
    );
  } catch (err) {
    console.error("Failed to load chip inventory", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
