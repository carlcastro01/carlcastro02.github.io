import { createContext, type ComponentChildren, type FunctionComponent } from 'preact';
import { useCallback, useContext, useEffect, useMemo, useState } from 'preact/hooks';
import { useMesh } from './MeshContext';
import { storage, type StoredMessage } from '../utils/storage';

export interface MessagingContextValue {
  messages: StoredMessage[];
  channelId: string;
  setChannel(channelId: string): void;
  send(body: string, priority?: StoredMessage['priority']): Promise<void>;
  markDelivered(id: number): Promise<void>;
}

const MessagingContext = createContext<MessagingContextValue | undefined>(undefined);

const DEFAULT_CHANNEL = 'primary';

const decoder = new TextDecoder();
const encoder = new TextEncoder();

const parsePacket = (packet: Uint8Array): StoredMessage => {
  const message = decoder.decode(packet);
  const [metadata, body] = message.split('\n', 2);
  const [channelId = DEFAULT_CHANNEL, sender = 'mesh', priority = 'normal'] = metadata.split('|');
  return {
    channelId,
    sender,
    body: body ?? '',
    priority: priority as StoredMessage['priority'],
    timestamp: Date.now(),
    status: 'received'
  };
};

const buildPacket = (message: StoredMessage): Uint8Array => {
  const header = `${message.channelId}|${message.sender}|${message.priority ?? 'normal'}`;
  return encoder.encode(`${header}\n${message.body}`);
};

export const MessagingProvider: FunctionComponent<{ children: ComponentChildren }> = ({ children }) => {
  const mesh = useMesh();
  const [messages, setMessages] = useState<StoredMessage[]>([]);
  const [channelId, setChannelId] = useState(DEFAULT_CHANNEL);

  useEffect(() => {
    storage.listRecent().then(setMessages);
  }, []);

  useEffect(() => mesh.subscribe(async (packet) => {
    const parsed = parsePacket(packet);
    const persisted = await storage.saveMessage(parsed);
    setMessages((prev) => [persisted, ...prev].slice(0, 500));
  }), [mesh]);

  const send = useCallback(async (body: string, priority: StoredMessage['priority'] = 'normal') => {
    const message: StoredMessage = {
      channelId,
      body,
      priority,
      sender: 'me',
      timestamp: Date.now(),
      status: 'pending'
    };
    const persisted = await storage.saveMessage(message);
    setMessages((prev) => [persisted, ...prev]);
    try {
      await mesh.sendPacket(buildPacket({ ...message, sender: mesh.deviceInfo?.shortName ?? 'me', status: 'sent' }));
      await storage.saveMessage({ ...persisted, status: 'sent' });
      setMessages((prev) => prev.map((item) => item.id === persisted.id ? { ...item, status: 'sent' } : item));
    } catch (error) {
      console.warn('Failed to send packet, stored offline', error);
    }
  }, [channelId, mesh]);

  const markDelivered = useCallback(async (id: number) => {
    const existing = messages.find((item) => item.id === id);
    if (!existing) return;
    await storage.saveMessage({ ...existing, status: 'received' });
    setMessages((prev) => prev.map((item) => item.id === id ? { ...item, status: 'received' } : item));
  }, [messages]);

  const value = useMemo<MessagingContextValue>(() => ({
    messages,
    channelId,
    setChannel: setChannelId,
    send,
    markDelivered
  }), [messages, channelId, send, markDelivered]);

  return <MessagingContext.Provider value={value}>{children}</MessagingContext.Provider>;
};

export const useMessaging = () => {
  const context = useContext(MessagingContext);
  if (!context) throw new Error('useMessaging must be used within a MessagingProvider');
  return context;
};
