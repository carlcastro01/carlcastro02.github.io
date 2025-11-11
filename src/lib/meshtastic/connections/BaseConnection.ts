import type { DeviceConfig, MeshtasticDevice } from '../types';

type Listener<T extends (...args: any[]) => void> = T;

type ListenerMap = {
  [K in keyof ConnectionEvents]?: Listener<ConnectionEvents[K]>[];
};

export interface ConnectionEvents {
  connect: (device: MeshtasticDevice) => void;
  disconnect: () => void;
  message: (bytes: Uint8Array) => void;
  config: (config: DeviceConfig) => void;
  error: (error: Error) => void;
}

export abstract class BaseConnection<TOptions = unknown> {
  private listeners: ListenerMap = {};

  on<E extends keyof ConnectionEvents>(event: E, listener: ConnectionEvents[E]) {
    const bucket = this.listeners[event] ?? [];
    bucket.push(listener as Listener<any>);
    this.listeners[event] = bucket;
    return () => this.off(event, listener);
  }

  off<E extends keyof ConnectionEvents>(event: E, listener: ConnectionEvents[E]) {
    const bucket = this.listeners[event];
    if (!bucket) return;
    this.listeners[event] = bucket.filter((l) => l !== listener);
  }

  protected emit<E extends keyof ConnectionEvents>(event: E, ...args: Parameters<ConnectionEvents[E]>) {
    const bucket = this.listeners[event];
    bucket?.forEach((listener) => listener(...args));
  }

  abstract connect(options?: TOptions): Promise<void>;

  abstract disconnect(): Promise<void>;

  abstract send(bytes: Uint8Array): Promise<void>;
}
