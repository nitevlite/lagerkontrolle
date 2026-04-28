import { db } from "./db";
import type {
  AppSettings,
  Batch,
  Item,
  Location,
  Movement,
  StorageSlot,
  SyncConfig,
  SyncEntityType,
  SyncMetadata,
  UnitType
} from "../domain/model";

type SyncState = "idle" | "syncing" | "success" | "error";

export type SyncStatus = {
  state: SyncState;
  message: string;
  lastSyncedAt?: string;
  pushed?: number;
  pulled?: number;
};

type RemoteEntityDoc = {
  _id: string;
  _rev?: string;
  entityType: SyncEntityType;
  entityId: string;
  updatedAt: string;
  deletedAt?: string;
  deviceId: string;
  payload?: Record<string, unknown>;
};

function safeDeviceId() {
  return globalThis.crypto?.randomUUID?.() ?? `device-${Date.now()}`;
}

export function createDefaultSyncConfig(): SyncConfig {
  return {
    enabled: false,
    couchUrl: "",
    databaseName: "lagerkontrolle",
    deviceId: safeDeviceId(),
    deviceLabel: "Gerät"
  };
}

function buildSyncKey(entityType: SyncEntityType, entityId: string) {
  return `${entityType}:${entityId}`;
}

function buildRemoteDocId(entityType: SyncEntityType, entityId: string) {
  return buildSyncKey(entityType, entityId);
}

function isMissingObjectStoreError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLocaleLowerCase();
  return normalized.includes("objectstore") || (normalized.includes("object store") && normalized.includes("not found"));
}

function normalizeUrl(value: string) {
  return value.trim().replace(/\/+$/, "");
}

function buildDatabaseUrl(config: SyncConfig) {
  return `${normalizeUrl(config.couchUrl)}/${encodeURIComponent(config.databaseName.trim())}`;
}

function authHeaders(config: SyncConfig) {
  if (!config.username || !config.password) {
    return {} as Record<string, string>;
  }

  return {
    Authorization: `Basic ${btoa(`${config.username}:${config.password}`)}`
  } satisfies Record<string, string>;
}

async function fetchJson<T>(url: string, init: RequestInit) {
  const response = await fetch(url, init);
  if (response.status === 404) {
    return { response, body: null as T | null };
  }

  const body = (await response.json()) as T;
  return { response, body };
}

async function putSyncMeta(input: SyncMetadata) {
  try {
    await db.syncMeta.put(input);
  } catch (error) {
    if (isMissingObjectStoreError(error)) {
      return;
    }
    throw error;
  }
}

export async function markEntityChanged(entityType: SyncEntityType, entityId: string, updatedAt?: string) {
  await putSyncMeta({
    id: buildSyncKey(entityType, entityId),
    entityType,
    entityId,
    updatedAt: updatedAt ?? new Date().toISOString(),
    dirty: true
  });
}

export async function markEntityDeleted(entityType: SyncEntityType, entityId: string, deletedAt?: string) {
  const timestamp = deletedAt ?? new Date().toISOString();
  await putSyncMeta({
    id: buildSyncKey(entityType, entityId),
    entityType,
    entityId,
    updatedAt: timestamp,
    deletedAt: timestamp,
    dirty: true
  });
}

export async function markEntitySynced(entityType: SyncEntityType, entityId: string, timestamp?: string) {
  const current = await db.syncMeta.get(buildSyncKey(entityType, entityId));
  if (!current) {
    return;
  }

  await putSyncMeta({
    ...current,
    dirty: false,
    lastSyncedAt: timestamp ?? new Date().toISOString()
  });
}

export async function ensureSyncMetadataSeed() {
  const now = new Date().toISOString();
  const entitySets: Array<{ entityType: SyncEntityType; ids: string[] }> = [
    { entityType: "location", ids: (await db.locations.toArray()).map((row) => row.id) },
    { entityType: "slot", ids: (await db.slots.toArray()).map((row) => row.id) },
    { entityType: "unitType", ids: (await db.unitTypes.toArray()).map((row) => row.id) },
    { entityType: "item", ids: (await db.items.toArray()).map((row) => row.id) },
    { entityType: "batch", ids: (await db.batches.toArray()).map((row) => row.id) },
    { entityType: "movement", ids: (await db.movements.toArray()).map((row) => row.id) },
    { entityType: "settings", ids: ["default"] }
  ];

  for (const set of entitySets) {
    for (const id of set.ids) {
      const key = buildSyncKey(set.entityType, id);
      const existing = await db.syncMeta.get(key);
      if (!existing) {
        await putSyncMeta({
          id: key,
          entityType: set.entityType,
          entityId: id,
          updatedAt: now,
          dirty: false
        });
      }
    }
  }
}

async function getEntityPayload(entityType: SyncEntityType, entityId: string) {
  switch (entityType) {
    case "location":
      return (await db.locations.get(entityId)) ?? null;
    case "slot":
      return (await db.slots.get(entityId)) ?? null;
    case "unitType":
      return (await db.unitTypes.get(entityId)) ?? null;
    case "item":
      return (await db.items.get(entityId)) ?? null;
    case "batch":
      return (await db.batches.get(entityId)) ?? null;
    case "movement":
      return (await db.movements.get(entityId)) ?? null;
    case "settings":
      return (await db.settings.get("default")) ?? null;
  }
}

async function applyRemoteDoc(doc: RemoteEntityDoc) {
  const syncedAt = new Date().toISOString();

  if (doc.deletedAt) {
    switch (doc.entityType) {
      case "location":
        await db.locations.delete(doc.entityId);
        break;
      case "slot":
        await db.slots.delete(doc.entityId);
        break;
      case "unitType":
        await db.unitTypes.delete(doc.entityId);
        break;
      case "item":
        await db.items.delete(doc.entityId);
        break;
      case "batch":
        await db.batches.delete(doc.entityId);
        break;
      case "movement":
        await db.movements.delete(doc.entityId);
        break;
      case "settings":
        break;
    }

    await putSyncMeta({
      id: buildSyncKey(doc.entityType, doc.entityId),
      entityType: doc.entityType,
      entityId: doc.entityId,
      updatedAt: doc.updatedAt,
      deletedAt: doc.deletedAt,
      dirty: false,
      lastSyncedAt: syncedAt
    });
    return;
  }

  const payload = doc.payload;
  if (!payload) {
    return;
  }

  switch (doc.entityType) {
    case "location":
      await db.locations.put(payload as Location);
      break;
    case "slot":
      await db.slots.put(payload as StorageSlot);
      break;
    case "unitType":
      await db.unitTypes.put(payload as UnitType);
      break;
    case "item":
      await db.items.put(payload as Item);
      break;
    case "batch":
      await db.batches.put(payload as Batch);
      break;
    case "movement":
      await db.movements.put(payload as Movement);
      break;
    case "settings":
      await db.settings.put(payload as AppSettings);
      break;
  }

  await putSyncMeta({
    id: buildSyncKey(doc.entityType, doc.entityId),
    entityType: doc.entityType,
    entityId: doc.entityId,
    updatedAt: doc.updatedAt,
    dirty: false,
    lastSyncedAt: syncedAt
  });
}

async function getRemoteDoc(config: SyncConfig, docId: string) {
  const { response, body } = await fetchJson<RemoteEntityDoc>(
    `${buildDatabaseUrl(config)}/${encodeURIComponent(docId)}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...authHeaders(config)
      }
    }
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok || !body) {
    throw new Error(`Remote-Dokument ${docId} konnte nicht geladen werden.`);
  }

  return body;
}

export async function validateSyncConnection(config: SyncConfig) {
  const databaseUrl = buildDatabaseUrl(config);
  const response = await fetch(databaseUrl, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...authHeaders(config)
    }
  });

  if (response.ok) {
    return;
  }

  if (response.status === 404) {
    const createResponse = await fetch(databaseUrl, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...authHeaders(config)
      }
    });

    if (createResponse.ok || createResponse.status === 412) {
      return;
    }
  }

  throw new Error("CouchDB-Verbindung oder Datenbank konnte nicht bestätigt werden.");
}

export async function runCouchSync(config: SyncConfig): Promise<SyncStatus> {
  if (!config.enabled || !config.couchUrl.trim() || !config.databaseName.trim()) {
    throw new Error("Bitte zuerst die Sync-Konfiguration vollständig speichern.");
  }

  await validateSyncConnection(config);
  await ensureSyncMetadataSeed();

  const dirtyMeta = await db.syncMeta.filter((entry) => entry.dirty).toArray();
  let pushed = 0;

  for (const meta of dirtyMeta) {
    const docId = buildRemoteDocId(meta.entityType, meta.entityId);
    const remote = await getRemoteDoc(config, docId);

    if (remote && remote.updatedAt > meta.updatedAt) {
      await applyRemoteDoc(remote);
      continue;
    }

    const payload = meta.deletedAt ? undefined : await getEntityPayload(meta.entityType, meta.entityId);
    const nextDoc: RemoteEntityDoc = {
      _id: docId,
      _rev: remote?._rev,
      entityType: meta.entityType,
      entityId: meta.entityId,
      updatedAt: meta.updatedAt,
      deletedAt: meta.deletedAt,
      deviceId: config.deviceId,
      payload: payload as Record<string, unknown> | undefined
    };

    const response = await fetch(`${buildDatabaseUrl(config)}/${encodeURIComponent(docId)}`, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...authHeaders(config)
      },
      body: JSON.stringify(nextDoc)
    });

    if (!response.ok) {
      throw new Error(`Änderung ${docId} konnte nicht nach CouchDB geschrieben werden.`);
    }

    pushed += 1;
    await markEntitySynced(meta.entityType, meta.entityId);
  }

  const allDocsResponse = await fetchJson<{ rows: Array<{ doc?: RemoteEntityDoc }> }>(
    `${buildDatabaseUrl(config)}/_all_docs?include_docs=true`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...authHeaders(config)
      }
    }
  );

  if (!allDocsResponse.response.ok || !allDocsResponse.body) {
    throw new Error("Remote-Daten konnten nicht gelesen werden.");
  }

  let pulled = 0;
  for (const row of allDocsResponse.body.rows) {
    const doc = row.doc;
    if (!doc) {
      continue;
    }

    const localMeta = await db.syncMeta.get(buildSyncKey(doc.entityType, doc.entityId));
    if (localMeta?.dirty && localMeta.updatedAt > doc.updatedAt) {
      continue;
    }

    if (!localMeta || doc.updatedAt > localMeta.updatedAt || doc.deletedAt !== localMeta.deletedAt) {
      await applyRemoteDoc(doc);
      pulled += 1;
    }
  }

  const syncedAt = new Date().toISOString();
  return {
    state: "success",
    message: "Sync abgeschlossen",
    lastSyncedAt: syncedAt,
    pushed,
    pulled
  };
}
