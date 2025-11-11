import type { MeshAdapter, MeshConfig, MeshConnectionType, MeshDeviceInfo, BatteryState, PositionState } from '../types';

type PacketListener = (packet: Uint8Array) => void;

export abstract class BaseAdapter implements MeshAdapter {
  protected listeners: PacketListener[] = [];
  abstract readonly type: MeshConnectionType;

  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract send(data: Uint8Array): Promise<void>;
  abstract configure(config: MeshConfig): Promise<void>;
  abstract getDeviceInfo(): Promise<MeshDeviceInfo | undefined>;
  getBatteryState?(): Promise<BatteryState | undefined>;
  getPosition?(): Promise<PositionState | undefined>;

  onPacket(callback: PacketListener): void {
    this.listeners.push(callback);
  }

  protected emitPacket(packet: Uint8Array): void {
    for (const listener of this.listeners) {
      listener(packet);
    }
  }
}
