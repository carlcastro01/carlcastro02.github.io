export interface MeshtasticDevice {
  id: string;
  transport: 'serial' | 'bluetooth' | 'wifi';
  displayName: string;
  hardwareModel?: string;
  firmwareVersion?: string;
}

export interface DeviceConfig {
  owner: {
    longName: string;
    shortName: string;
    avatar?: string;
  };
  lora: {
    region: string;
    modemPreset: string;
    hopLimit: number;
  };
  power: {
    batteryLevel?: number;
    isCharging?: boolean;
    voltage?: number;
  };
  network: {
    wifiSsid?: string;
    wifiPassword?: string;
    wifiEnabled: boolean;
  };
}

export interface MeshMessage {
  id: string;
  sender: string;
  senderShortName?: string;
  text: string;
  createdAt: number;
  deliveredAt?: number;
  status: 'pending' | 'sent' | 'failed';
}

export interface ChannelSettings {
  index: number;
  name: string;
  key: string;
  uplinkEnabled: boolean;
  downlinkEnabled: boolean;
}

export interface DeviceSession {
  device: MeshtasticDevice;
  config: DeviceConfig;
  channels: ChannelSettings[];
}
