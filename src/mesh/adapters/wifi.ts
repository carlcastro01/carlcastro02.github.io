import { BaseAdapter } from './base';
import type { MeshConfig, MeshDeviceInfo, BatteryState, PositionState } from '../types';

export class WifiAdapter extends BaseAdapter {
  readonly type = 'wifi' as const;
  private transport: any;

  constructor(private readonly host: string, private readonly port: number = 4403) {
    super();
  }

  async connect(): Promise<void> {
    const { TcpTransport } = await import('meshtastic');
    this.transport = new TcpTransport({ host: this.host, port: this.port });
    await this.transport.connect();
    this.transport.on('packet', (packet: Uint8Array) => this.emitPacket(packet));
  }

  async disconnect(): Promise<void> {
    if (this.transport) {
      await this.transport.close();
      this.transport = undefined;
    }
  }

  async send(data: Uint8Array): Promise<void> {
    if (!this.transport) throw new Error('Wi-Fi transport not connected');
    await this.transport.write(data);
  }

  async configure(config: MeshConfig): Promise<void> {
    if (!this.transport) throw new Error('Wi-Fi transport not connected');
    await this.transport.configure(config);
  }

  async getDeviceInfo(): Promise<MeshDeviceInfo | undefined> {
    if (!this.transport) return undefined;
    const info = await this.transport.getDeviceMetadata();
    return info ? {
      id: info.id || `${this.host}:${this.port}`,
      firmwareVersion: info.firmware,
      hardwareModel: info.hardware,
      longName: info.longName,
      shortName: info.shortName
    } : undefined;
  }

  async getBatteryState(): Promise<BatteryState | undefined> {
    if (!this.transport?.getBatteryState) return undefined;
    return this.transport.getBatteryState();
  }

  async getPosition(): Promise<PositionState | undefined> {
    if (!this.transport?.getPosition) return undefined;
    return this.transport.getPosition();
  }
}
