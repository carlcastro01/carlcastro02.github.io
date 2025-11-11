import { BaseConnection } from './BaseConnection';
import type { DeviceConfig, MeshtasticDevice } from '../types';

interface SerialOptions {
  filters?: SerialPortRequestOptions['filters'];
}

export class SerialConnection extends BaseConnection<SerialOptions> {
  private port?: SerialPort;
  private reader?: ReadableStreamDefaultReader<Uint8Array>;

  async connect(options?: SerialOptions): Promise<void> {
    if (!('serial' in navigator)) {
      throw new Error('Web Serial not supported');
    }

    this.port = await (navigator as any).serial.requestPort({ filters: options?.filters });
    await this.port.open({ baudRate: 115200 });

    const info = this.port.getInfo();
    const device: MeshtasticDevice = {
      id: `${info.usbVendorId}:${info.usbProductId}`,
      transport: 'serial',
      displayName: `Serial ${info.usbProductId ?? 'Meshtastic'}`
    };

    this.emit('connect', device);
    this.listenLoop();
  }

  private async listenLoop() {
    if (!this.port?.readable) return;
    this.reader = this.port.readable.getReader();

    try {
      while (true) {
        const result = await this.reader.read();
        if (result.done || !result.value) break;
        this.emit('message', result.value);
      }
    } catch (error) {
      this.emit('error', error as Error);
    } finally {
      this.reader?.releaseLock();
      this.emit('disconnect');
    }
  }

  async send(bytes: Uint8Array): Promise<void> {
    if (!this.port?.writable) throw new Error('Port not writable');
    const writer = this.port.writable.getWriter();
    await writer.write(bytes);
    writer.releaseLock();
  }

  async disconnect(): Promise<void> {
    await this.reader?.cancel().catch(() => undefined);
    await this.port?.close();
    this.emit('disconnect');
  }

  // placeholder to align with BaseConnection events
  protected emitConfig(_config: DeviceConfig) {
    this.emit('config', _config);
  }
}
