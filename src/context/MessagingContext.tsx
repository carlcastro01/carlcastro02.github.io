import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import { useDeviceSession } from './DeviceSessionContext';
import { decodeDeviceMessage, encodeDeviceMessage, type MeshMessage } from '../lib/meshtastic';

interface MessagingDB extends DBSchema {
  messages: {
    key: string;
    value: MeshMessage;
    indexes: { 'by-createdAt': number; 'by-status': string };
  };
}

interface MessagingContextValue {
  messages: MeshMessage[];
  stats: { sent: number; pending: number };
  sendMessage: (text: string) => Promise<void>;
  retryMessage: (id: string) => Promise<void>;
}

const MessagingContext = createContext<MessagingContextValue | undefined>(undefined);

const DB_NAME = 'meshtastic-web';
const DB_VERSION = 1;

export const MessagingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { connection, session } = useDeviceSession();
  const [db, setDb] = useState<IDBPDatabase<MessagingDB>>();
  const [messages, setMessages] = useState<MeshMessage[]>([]);

  useEffect(() => {
    openDB<MessagingDB>(DB_NAME, DB_VERSION, {
      upgrade(database) {
        const store = database.createObjectStore('messages', { keyPath: 'id' });
        store.createIndex('by-createdAt', 'createdAt');
        store.createIndex('by-status', 'status');
      }
    }).then(setDb);
  }, []);

  const loadMessages = useCallback(async (database: IDBPDatabase<MessagingDB>) => {
    const tx = database.transaction('messages', 'readonly');
    const store = tx.store;
    const all = await store.getAll();
    all.sort((a, b) => a.createdAt - b.createdAt);
    setMessages(all);
  }, []);

  useEffect(() => {
    if (!db) return;
    void loadMessages(db);
  }, [db, loadMessages]);

  useEffect(() => {
    if (!connection) return;

    const dispose = connection.on('message', (bytes) => {
      const decoded = decodeDeviceMessage(bytes);
      if (decoded.type === 'text') {
        const incoming: MeshMessage = {
          id: decoded.payload.id,
          sender: decoded.payload.senderId,
          text: decoded.payload.text,
          createdAt: decoded.payload.timestamp,
          status: 'sent'
        };

        setMessages((prev) => {
          const existing = prev.some((message) => message.id === incoming.id);
          return existing ? prev : [...prev, incoming];
        });

        if (db) {
          void db.put('messages', incoming);
        }
      } else if (decoded.type === 'ack') {
        setMessages((prev) => {
          const next = prev.map((message) =>
            message.id === decoded.payload.id
              ? { ...message, status: 'sent', deliveredAt: decoded.payload.timestamp }
              : message
          );
          if (db) {
            void Promise.all(next.map((message) => db.put('messages', message)));
          }
          return next;
        });
      }
    });

    return () => {
      dispose?.();
    };
  }, [connection, db]);

  const flushPending = useCallback(async () => {
    if (!db || !connection || !session) return;
    const tx = db.transaction('messages', 'readonly');
    const index = tx.store.index('by-status');
    const pending = await index.getAll('pending');
    await Promise.all(
      pending.map(async (message) => {
        try {
          await dispatchMessage(message);
        } catch (error) {
          console.error('Failed to flush message', error);
        }
      })
    );
    await loadMessages(db);
  }, [connection, db, dispatchMessage, loadMessages, session]);

  useEffect(() => {
    void flushPending();
  }, [flushPending]);

  const dispatchMessage = useCallback(async (message: MeshMessage) => {
    if (!connection || !session) return;
    const payload = encodeDeviceMessage({
      type: 'text',
      payload: {
        id: message.id,
        text: message.text,
        senderId: session.device.id,
        timestamp: Date.now()
      }
    });

    await connection.send(payload);
    const delivered = { ...message, status: 'sent', deliveredAt: Date.now() };
    await db?.put('messages', delivered);
    setMessages((prev) => prev.map((entry) => (entry.id === delivered.id ? delivered : entry)));
  }, [connection, db, session]);

  const sendMessage = useCallback(async (text: string) => {
    if (!db || !session) return;
    const message: MeshMessage = {
      id: crypto.randomUUID(),
      sender: session.device.id,
      senderShortName: session.config.owner.shortName,
      text,
      createdAt: Date.now(),
      status: 'pending'
    };

    await db.put('messages', message);
    setMessages((prev) => [...prev, message]);

    if (connection) {
      try {
        await dispatchMessage(message);
      } catch (error) {
        console.error('Send failed, keeping offline', error);
      }
    }
  }, [connection, db, dispatchMessage, session]);

  const retryMessage = useCallback(async (id: string) => {
    if (!db || !session) return;
    const existing = await db.get('messages', id);
    if (!existing) return;
    const pending: MeshMessage = { ...existing, status: 'pending' };
    await db.put('messages', pending);
    setMessages((prev) => prev.map((entry) => (entry.id === id ? pending : entry)));
    if (connection) {
      try {
        await dispatchMessage(pending);
      } catch (error) {
        console.error('Retry failed', error);
      }
    }
  }, [connection, db, dispatchMessage, session]);

  const stats = useMemo(() => ({
    sent: messages.filter((message) => message.status === 'sent').length,
    pending: messages.filter((message) => message.status === 'pending').length
  }), [messages]);

  const value = useMemo(() => ({ messages, stats, sendMessage, retryMessage }), [messages, stats, sendMessage, retryMessage]);

  return <MessagingContext.Provider value={value}>{children}</MessagingContext.Provider>;
};

export const useMessaging = () => {
  const ctx = useContext(MessagingContext);
  if (!ctx) throw new Error('useMessaging must be used inside MessagingProvider');
  return ctx;
};
