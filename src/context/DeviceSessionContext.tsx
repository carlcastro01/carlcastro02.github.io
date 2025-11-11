import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  BaseConnection,
  BluetoothConnection,
  DeviceSession,
  SerialConnection,
  WifiConnection,
  decodeDeviceMessage,
  encodeDeviceMessage,
  type DeviceMessage,
  type MeshtasticDevice,
  type DeviceConfig
} from '../lib/meshtastic';

interface DeviceSessionContextValue {
  session?: DeviceSession;
  connection?: BaseConnection;
  connectSerial: () => Promise<void>;
  connectBluetooth: () => Promise<void>;
  connectWifi: (host: string, port?: number, token?: string) => Promise<void>;
  disconnect: () => Promise<void>;
  updateConfig: (config: Partial<DeviceConfig>) => void;
}

const DeviceSessionContext = createContext<DeviceSessionContextValue | undefined>(undefined);

export const DeviceSessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connection, setConnection] = useState<BaseConnection>();
  const [session, setSession] = useState<DeviceSession>();

  const snakeToCamel = (value: string) => value.replace(/_([a-z])/g, (_, char: string) => char.toUpperCase());

  const applyDeviceMessage = useCallback((device: MeshtasticDevice, message: DeviceMessage) => {
    setSession((prev) => {
      const base: DeviceSession =
        prev ?? {
          device,
          config: {
            owner: { longName: '', shortName: '' },
            lora: { region: 'US', modemPreset: 'LONG_FAST', hopLimit: 3 },
            power: {},
            network: { wifiEnabled: false }
          },
          channels: []
        };

      if (message.type === 'config') {
        const config = { ...base.config };
        message.payload.values.forEach((entry) => {
          switch (entry.field) {
            case 'owner.long_name':
            case 'owner.short_name':
            case 'owner.avatar':
              config.owner = {
                ...config.owner,
                [snakeToCamel(entry.field.split('.').pop()!)]: entry.value as string
              };
              break;
            case 'lora.region':
              config.lora = { ...config.lora, region: entry.value as string };
              break;
            case 'lora.modem_preset':
              config.lora = { ...config.lora, modemPreset: entry.value as string };
              break;
            case 'lora.hop_limit':
              config.lora = { ...config.lora, hopLimit: entry.value as number };
              break;
            case 'network.wifi.enabled':
              config.network = { ...config.network, wifiEnabled: Boolean(entry.value) };
              break;
            case 'network.wifi.ssid':
              config.network = { ...config.network, wifiSsid: entry.value as string };
              break;
            case 'network.wifi.password':
              config.network = { ...config.network, wifiPassword: entry.value as string };
              break;
            default:
              break;
          }
        });

        return { ...base, config };
      }

      if (message.type === 'channel') {
        const channels = base.channels.filter((channel) => channel.index !== message.payload.index);
        return { ...base, channels: [...channels, message.payload] };
      }

      return base;
    });
  }, []);

  const setupConnection = useCallback((next: BaseConnection, device: MeshtasticDevice) => {
    setSession({
      device,
      config: {
        owner: { longName: '', shortName: '' },
        lora: { region: 'US', modemPreset: 'LONG_FAST', hopLimit: 3 },
        power: {},
        network: { wifiEnabled: false }
      },
      channels: []
    });

    next.on('message', (bytes) => {
      const message = decodeDeviceMessage(bytes);
      applyDeviceMessage(device, message);
    });

    next.on('config', (config) => {
      setSession((prev) => (prev ? { ...prev, config } : prev));
    });

    next.on('disconnect', () => {
      setConnection(undefined);
      setSession(undefined);
    });

    setConnection(next);
  }, [applyDeviceMessage]);

  const connectSerial = useCallback(async () => {
    const serial = new SerialConnection();
    serial.on('connect', (device) => setupConnection(serial, device));
    await serial.connect();
  }, [setupConnection]);

  const connectBluetooth = useCallback(async () => {
    const bluetooth = new BluetoothConnection();
    bluetooth.on('connect', (device) => setupConnection(bluetooth, device));
    await bluetooth.connect();
  }, [setupConnection]);

  const connectWifi = useCallback(async (host: string, port?: number, token?: string) => {
    const wifi = new WifiConnection();
    wifi.on('connect', (device) => setupConnection(wifi, device));
    await wifi.connect({ host, port, token });
  }, [setupConnection]);

  const disconnect = useCallback(async () => {
    await connection?.disconnect();
  }, [connection]);

  const camelToSnake = (value: string) => value.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);

  const updateConfig = useCallback((config: Partial<DeviceConfig>) => {
    setSession((prev) => (prev ? { ...prev, config: { ...prev.config, ...config } } : prev));

    if (connection && session) {
      const payload: DeviceMessage = {
        type: 'config',
        payload: {
          values: Object.entries(config).flatMap(([key, value]) => {
            if (!value) return [];
            if (key === 'owner') {
              return Object.entries(value).map(([ownerKey, ownerValue]) => ({
                field: `owner.${camelToSnake(ownerKey)}` as const,
                value: ownerValue
              }));
            }
            if (key === 'lora') {
              return Object.entries(value).map(([loraKey, loraValue]) => ({
                field: `lora.${camelToSnake(loraKey)}` as const,
                value: loraValue
              }));
            }
            if (key === 'network') {
              return Object.entries(value).map(([netKey, netValue]) => {
                if (netKey === 'wifiEnabled') {
                  return { field: 'network.wifi.enabled' as const, value: Number(netValue) };
                }
                const trimmed = netKey.startsWith('wifi') ? netKey.replace(/^wifi/, '') : netKey;
                const normalized = camelToSnake(trimmed).replace(/^_/, '');
                return { field: `network.wifi.${normalized}` as const, value: netValue };
              });
            }
            return [];
          })
        }
      };

      void connection.send(encodeDeviceMessage(payload));
    }
  }, [connection, session]);

  const value = useMemo(
    () => ({ session, connection, connectSerial, connectBluetooth, connectWifi, disconnect, updateConfig }),
    [session, connection, connectSerial, connectBluetooth, connectWifi, disconnect, updateConfig]
  );

  return <DeviceSessionContext.Provider value={value}>{children}</DeviceSessionContext.Provider>;
};

export const useDeviceSession = () => {
  const ctx = useContext(DeviceSessionContext);
  if (!ctx) throw new Error('useDeviceSession must be used within DeviceSessionProvider');
  return ctx;
};
