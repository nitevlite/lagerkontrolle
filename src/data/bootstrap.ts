import { db } from "./db";
import { seedSnapshot } from "../domain/seed";
import { ensureSyncMetadataSeed } from "./sync";

function isMissingObjectStoreError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.toLocaleLowerCase().includes("object store") && message.toLocaleLowerCase().includes("not found");
}

async function writeInitialData() {
  await db.unitTypes.bulkPut(seedSnapshot.unitTypes);
  await db.settings.put({
    ...seedSnapshot.settings,
    sync: {
      ...seedSnapshot.settings.sync,
      deviceId: crypto.randomUUID()
    }
  });
  await ensureSyncMetadataSeed();
}

export async function repairLocalDatabase() {
  await db.close();
  await db.delete();
  await writeInitialData();
}

export async function ensureSeedData() {
  try {
    const count = await db.unitTypes.count();
    if (count > 0) {
      return;
    }

    await writeInitialData();
  } catch (error) {
    if (!isMissingObjectStoreError(error)) {
      throw error;
    }

    await repairLocalDatabase();
  }
}

export async function resetSeedData() {
  await db.locations.clear();
  await db.slots.clear();
  await db.unitTypes.clear();
  await db.items.clear();
  await db.batches.clear();
  await db.movements.clear();
  await db.settings.clear();
  await db.syncMeta.clear();

  await ensureSeedData();
}
