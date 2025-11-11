import { BaseAdapter } from './base';
import type { MeshConfig, MeshDeviceInfo, BatteryState, PositionState } from '../types';

export class SerialAdapter extends BaseAdapter {
  readonly type = 'serial' as const;
  private transport: any;

  async connect(): Promise<void> {
    const { SerialTransport } = await import('meshtastic');
    this.transport = new SerialTransport();
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
    if (!this.transport) throw new Error('Serial transport not connected');
    await this.transport.write(data);
  }

  async configure(config: MeshConfig): Promise<void> {
    if (!this.transport) throw new Error('Serial transport not connected');
    await this.transport.configure(config);
  }

  async getDeviceInfo(): Promise<MeshDeviceInfo | undefined> {
    if (!this.transport) return undefined;
    const info = await this.transport.getDeviceMetadata();
    return info ? {
      id: info.id || info.serialNumber,
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
