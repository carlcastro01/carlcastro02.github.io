import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

interface MeshDb extends DBSchema {
  messages: {
    key: number;
    value: StoredMessage;
    indexes: { byChannel: string; byTimestamp: number };
  };
  drafts: {
    key: string;
    value: string;
  };
  breadcrumbs: {
    key: number;
    value: Breadcrumb;
    indexes: { byTimestamp: number };
  };
}

export interface StoredMessage {
  id?: number;
  channelId: string;
  sender: string;
  body: string;
  priority?: 'normal' | 'sos' | 'priority';
  timestamp: number;
  status: 'sent' | 'received' | 'pending';
}

export interface Breadcrumb {
  id?: number;
  latitude: number;
  longitude: number;
  timestamp: number;
  label?: string;
}

let dbPromise: Promise<IDBPDatabase<MeshDb>> | undefined;

const getDb = () => {
  if (!dbPromise) {
    dbPromise = openDB<MeshDb>('mesh-pwa', 1, {
      upgrade(db) {
        const messages = db.createObjectStore('messages', { keyPath: 'id', autoIncrement: true });
        messages.createIndex('byChannel', 'channelId');
        messages.createIndex('byTimestamp', 'timestamp');
        db.createObjectStore('drafts');
        const breadcrumbs = db.createObjectStore('breadcrumbs', { keyPath: 'id', autoIncrement: true });
        breadcrumbs.createIndex('byTimestamp', 'timestamp');
      }
    });
  }
  return dbPromise;
};

export const storage = {
  async saveMessage(message: StoredMessage) {
    const db = await getDb();
    const id = await db.put('messages', message);
    return { ...message, id };
  },
  async listMessages(channelId: string) {
    const db = await getDb();
    return db.getAllFromIndex('messages', 'byChannel', channelId);
  },
  async listRecent(limit = 100) {
    const db = await getDb();
    const tx = db.transaction('messages');
    const index = tx.store.index('byTimestamp');
    const results: StoredMessage[] = [];
    let cursor = await index.openCursor(null, 'prev');
    while (cursor && results.length < limit) {
      results.push(cursor.value);
      cursor = await cursor.continue();
    }
    await tx.done;
    return results;
  },
  async deleteMessage(id: number) {
    const db = await getDb();
    await db.delete('messages', id);
  },
  async saveDraft(channelId: string, value: string) {
    const db = await getDb();
    await db.put('drafts', value, channelId);
  },
  async getDraft(channelId: string) {
    const db = await getDb();
    return db.get('drafts', channelId);
  },
  async clearDraft(channelId: string) {
    const db = await getDb();
    await db.delete('drafts', channelId);
  },
  async addBreadcrumb(breadcrumb: Breadcrumb) {
    const db = await getDb();
    const id = await db.put('breadcrumbs', breadcrumb);
    return { ...breadcrumb, id };
  },
  async listBreadcrumbs(limit = 1000) {
    const db = await getDb();
    const tx = db.transaction('breadcrumbs');
    const index = tx.store.index('byTimestamp');
    const results: Breadcrumb[] = [];
    let cursor = await index.openCursor(null, 'prev');
    while (cursor && results.length < limit) {
      results.push(cursor.value);
      cursor = await cursor.continue();
    }
    await tx.done;
    return results;
  }
};
