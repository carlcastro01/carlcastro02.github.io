// Minimal protobuf like definitions used by the UI. This is inspired by the meshtxt project
// but intentionally simplified so the UI can bind against a typed object graph without
// requiring a generated bundle inside the repository.

export enum ConfigField {
  OWNER_LONG_NAME = 'owner.long_name',
  OWNER_SHORT_NAME = 'owner.short_name',
  OWNER_AVATAR = 'owner.avatar',
  LORA_REGION = 'lora.region',
  LORA_MODEM_PRESET = 'lora.modem_preset',
  LORA_HOP_LIMIT = 'lora.hop_limit',
  NETWORK_WIFI_ENABLED = 'network.wifi.enabled',
  NETWORK_WIFI_SSID = 'network.wifi.ssid',
  NETWORK_WIFI_PASSWORD = 'network.wifi.password'
}

export interface ConfigValue<T> {
  field: ConfigField;
  value: T;
}

export interface DeviceConfigMessage {
  values: ConfigValue<unknown>[];
}

export interface ChannelSettingsMessage {
  index: number;
  name: string;
  key: string;
  uplinkEnabled: boolean;
  downlinkEnabled: boolean;
}

export interface TextMessage {
  id: string;
  text: string;
  senderId: string;
  timestamp: number;
}

export type DeviceMessage =
  | { type: 'config'; payload: DeviceConfigMessage }
  | { type: 'channel'; payload: ChannelSettingsMessage }
  | { type: 'text'; payload: TextMessage }
  | { type: 'ack'; payload: { id: string; timestamp: number } };

export const encodeDeviceMessage = (message: DeviceMessage): Uint8Array => {
  return new TextEncoder().encode(JSON.stringify(message));
};

export const decodeDeviceMessage = (bytes: Uint8Array): DeviceMessage => {
  const json = new TextDecoder().decode(bytes);
  return JSON.parse(json) as DeviceMessage;
};
