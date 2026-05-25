/**
 * Olay analizi videoları — tarayıcı IndexedDB (tenant/kullanıcı başına metadata).
 */
import { getCurrentUserId } from './userContext';

const DB_NAME = 'deepwhy-rca-videos';
const DB_VERSION = 1;
const STORE = 'videos';
const MAX_BYTES = 250 * 1024 * 1024;

const CHANGED_EVENT = 'rca-videos-changed';

function scopeKey() {
  const user = getCurrentUserId() || 'anonymous';
  return user;
}

function openDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB desteklenmiyor'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error || new Error('IndexedDB açılamadı'));
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (ev) => {
      const db = ev.target.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('scope', 'scope', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
  });
}

function txStore(db, mode) {
  return db.transaction(STORE, mode).objectStore(STORE);
}

export function notifyVideosChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CHANGED_EVENT));
  }
}

export function onVideosChanged(handler) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(CHANGED_EVENT, handler);
  return () => window.removeEventListener(CHANGED_EVENT, handler);
}

function makeId() {
  return `vid-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * @returns {Promise<object[]>}
 */
export async function listVideos() {
  const db = await openDb();
  const scope = scopeKey();
  return new Promise((resolve, reject) => {
    const store = txStore(db, 'readonly');
    const req = store.getAll();
    req.onsuccess = () => {
      const all = (req.result || []).filter((v) => v.scope === scope);
      all.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
      resolve(all);
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * @param {File} file
 * @param {{ title?: string, incidentId?: string, notes?: string }} meta
 */
export async function addVideoFile(file, meta = {}) {
  if (!file || !file.size) {
    throw new Error('Geçersiz dosya');
  }
  if (!String(file.type || '').startsWith('video/')) {
    throw new Error('Yalnızca video dosyaları yüklenebilir');
  }
  if (file.size > MAX_BYTES) {
    throw new Error(`Dosya çok büyük (max ${Math.round(MAX_BYTES / (1024 * 1024))} MB)`);
  }

  const buffer = await file.arrayBuffer();
  const entry = {
    id: makeId(),
    scope: scopeKey(),
    kind: 'file',
    title: (meta.title || file.name || 'Video').trim(),
    incidentId: (meta.incidentId || '').trim(),
    notes: (meta.notes || '').trim(),
    fileName: file.name,
    mimeType: file.type || 'video/mp4',
    size: file.size,
    createdAt: new Date().toISOString(),
    blob: buffer,
  };

  const db = await openDb();
  await new Promise((resolve, reject) => {
    const req = txStore(db, 'readwrite').put(entry);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
  notifyVideosChanged();
  return { ...entry, blob: undefined };
}

/**
 * Harici video bağlantısı (YouTube, Drive, vb.)
 */
export async function addVideoUrl(url, meta = {}) {
  const cleanUrl = String(url || '').trim();
  if (!cleanUrl || !/^https?:\/\//i.test(cleanUrl)) {
    throw new Error('Geçerli bir http(s) bağlantısı girin');
  }
  const entry = {
    id: makeId(),
    scope: scopeKey(),
    kind: 'url',
    title: (meta.title || 'Video bağlantısı').trim(),
    incidentId: (meta.incidentId || '').trim(),
    notes: (meta.notes || '').trim(),
    externalUrl: cleanUrl,
    mimeType: '',
    size: 0,
    createdAt: new Date().toISOString(),
  };
  const db = await openDb();
  await new Promise((resolve, reject) => {
    const req = txStore(db, 'readwrite').put(entry);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
  notifyVideosChanged();
  return entry;
}

export async function deleteVideo(id) {
  const db = await openDb();
  await new Promise((resolve, reject) => {
    const req = txStore(db, 'readwrite').delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
  notifyVideosChanged();
}

export async function renameVideo(id, title) {
  const db = await openDb();
  const entry = await new Promise((resolve, reject) => {
    const req = txStore(db, 'readonly').get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  if (!entry || entry.scope !== scopeKey()) {
    throw new Error('Video bulunamadı');
  }
  entry.title = String(title || '').trim() || entry.title;
  await new Promise((resolve, reject) => {
    const req = txStore(db, 'readwrite').put(entry);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
  notifyVideosChanged();
}

/**
 * Yerel dosya için oynatma URL’si (revoke gerekebilir).
 * @param {string} id
 */
export async function getVideoPlaybackUrl(id) {
  const db = await openDb();
  const entry = await new Promise((resolve, reject) => {
    const req = txStore(db, 'readonly').get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  if (!entry || entry.scope !== scopeKey()) {
    throw new Error('Video bulunamadı');
  }
  if (entry.kind === 'url') {
    return { type: 'url', url: entry.externalUrl, entry };
  }
  const blob = new Blob([entry.blob], { type: entry.mimeType || 'video/mp4' });
  return { type: 'blob', url: URL.createObjectURL(blob), entry };
}

export function formatVideoSize(bytes) {
  const n = Number(bytes) || 0;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
