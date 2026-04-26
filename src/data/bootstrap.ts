import { db } from "./db";
import { seedSnapshot } from "../domain/seed";

export async function ensureSeedData() {
  const count = await db.locations.count();
  if (count > 0) {
    return;
  }

  const tables = [db.locations, db.slots, db.unitTypes, db.items, db.batches, db.movements, db.settings];
  await db.transaction("rw", tables, async () => {
    await db.locations.bulkAdd(seedSnapshot.locations);
    await db.slots.bulkAdd(seedSnapshot.slots);
    await db.unitTypes.bulkAdd(seedSnapshot.unitTypes);
    await db.items.bulkAdd(seedSnapshot.items);
    await db.batches.bulkAdd(seedSnapshot.batches);
    await db.movements.bulkAdd(seedSnapshot.movements);
    await db.settings.put(seedSnapshot.settings);
  });
}

export async function resetSeedData() {
  const tables = [db.locations, db.slots, db.unitTypes, db.items, db.batches, db.movements, db.settings];
  await db.transaction("rw", tables, async () => {
    await db.locations.clear();
    await db.slots.clear();
    await db.unitTypes.clear();
    await db.items.clear();
    await db.batches.clear();
    await db.movements.clear();
    await db.settings.clear();
  });

  await ensureSeedData();
}
