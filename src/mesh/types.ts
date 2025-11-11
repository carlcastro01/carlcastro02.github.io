export type MeshConnectionType = 'serial' | 'bluetooth' | 'wifi';

export interface MeshDeviceInfo {
  id: string;
  firmwareVersion?: string;
  hardwareModel?: string;
  longName?: string;
  shortName?: string;
}

export interface BatteryState {
  percentage?: number;
  voltage?: number;
  isCharging?: boolean;
  updatedAt?: number;
}

export interface PositionState {
  latitude?: number;
  longitude?: number;
  altitude?: number;
  accuracy?: number;
  timestamp?: number;
}

export interface MeshConfig {
  owner?: string;
  channel?: string;
  region?: string;
  role?: string;
  loraConfig?: Record<string, unknown>;
  powerConfig?: Record<string, unknown>;
}

export interface MeshAdapter {
  readonly type: MeshConnectionType;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  send(data: Uint8Array): Promise<void>;
  onPacket(callback: (packet: Uint8Array) => void): void;
  configure(config: MeshConfig): Promise<void>;
  getDeviceInfo(): Promise<MeshDeviceInfo | undefined>;
  getBatteryState?(): Promise<BatteryState | undefined>;
  getPosition?(): Promise<PositionState | undefined>;
}
