import { BaseConnection } from './BaseConnection';
import type { MeshtasticDevice } from '../types';

interface WifiOptions {
  host: string;
  port?: number;
  token?: string;
}

export class WifiConnection extends BaseConnection<WifiOptions> {
  private socket?: WebSocket;
  private options?: WifiOptions;

  async connect(options: WifiOptions): Promise<void> {
    this.options = options;
    const url = `ws://${options.host}:${options.port ?? 4403}/api/v1/ws`;
    this.socket = new WebSocket(url, options.token ? ['token', options.token] : undefined);

    this.socket.binaryType = 'arraybuffer';

    await new Promise<void>((resolve, reject) => {
      if (!this.socket) return reject(new Error('Socket missing'));
      this.socket.onopen = () => resolve();
      this.socket.onerror = (event) => reject(event instanceof ErrorEvent ? event.error : new Error('Socket error'));
    });

    const device: MeshtasticDevice = {
      id: options.host,
      transport: 'wifi',
      displayName: `WiFi ${options.host}`
    };

    this.emit('connect', device);

    this.socket.onmessage = (event) => {
      const data = event.data;
      if (data instanceof ArrayBuffer) {
        this.emit('message', new Uint8Array(data));
      }
    };

    this.socket.onclose = () => this.emit('disconnect');
  }

  async send(bytes: Uint8Array): Promise<void> {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('Socket not open');
    }

    this.socket.send(bytes);
  }

  async disconnect(): Promise<void> {
    this.socket?.close();
    this.emit('disconnect');
  }
}
