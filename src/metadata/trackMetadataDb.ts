import type { DjAnalysisFields } from "./types";

export interface CachedTrackMetadata extends DjAnalysisFields {
  spotifyTrackId?: string;
  cachedAt: number;
}

const memoryCache = new Map<string, CachedTrackMetadata>();

const DB_NAME = "njsp-track-metadata";
const DB_VERSION = 1;
const STORE = "tracks";

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}

export function metadataCacheKey(releaseId: string, songId: string): string {
  return `${releaseId}:${songId}`;
}

export function getMemoryCached(key: string): CachedTrackMetadata | undefined {
  return memoryCache.get(key);
}

export async function getPersistedCached(key: string): Promise<CachedTrackMetadata | null> {
  try {
    const db = await openDb();
    return await new Promise((resolve) => {
      const tx = db.transaction(STORE, "readonly");
      const request = tx.objectStore(STORE).get(key);
      request.onsuccess = () => {
        const row = request.result as { id: string; val: CachedTrackMetadata } | undefined;
        resolve(row?.val ?? null);
      };
      request.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function setCachedMetadata(key: string, val: CachedTrackMetadata): Promise<void> {
  memoryCache.set(key, val);
  try {
    const db = await openDb();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put({ id: key, val });
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // IndexedDB unavailable — memory cache still helps this session.
  }
}
