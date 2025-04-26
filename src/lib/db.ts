// IndexedDB utilities for file storage
const DB_NAME = "soundboardDB";
const STORE_NAME = "files";

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export function saveFile(fileId: string, blob: Blob): Promise<void> {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        tx.objectStore(STORE_NAME).put(blob, fileId);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      }),
  );
}

export function getFile(fileId: string): Promise<Blob> {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const req = tx.objectStore(STORE_NAME).get(fileId);
        req.onsuccess = () => {
          if (req.result) resolve(req.result as Blob);
          else reject(new Error("File not found in DB"));
        };
        req.onerror = () => reject(tx.error);
      }),
  );
}

/**
 * Deletes a file blob from IndexedDB by its key.
 */
export function deleteFile(fileId: string): Promise<void> {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        tx.objectStore(STORE_NAME).delete(fileId);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      }),
  );
}
