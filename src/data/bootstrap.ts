import { db } from "./db";
import { seedSnapshot } from "../domain/seed";

export async function ensureSeedData() {
  const count = await db.locations.count();
  if (count > 0) {
    return;
  }

  await db.locations.bulkPut(seedSnapshot.locations);
  await db.slots.bulkPut(seedSnapshot.slots);
  await db.unitTypes.bulkPut(seedSnapshot.unitTypes);
  await db.items.bulkPut(seedSnapshot.items);
  await db.batches.bulkPut(seedSnapshot.batches);
  await db.movements.bulkPut(seedSnapshot.movements);
  await db.settings.put(seedSnapshot.settings);
}

export async function resetSeedData() {
  await db.locations.clear();
  await db.slots.clear();
  await db.unitTypes.clear();
  await db.items.clear();
  await db.batches.clear();
  await db.movements.clear();
  await db.settings.clear();

  await ensureSeedData();
}
