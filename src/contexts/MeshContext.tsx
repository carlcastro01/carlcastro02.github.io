import { createContext, type ComponentChildren, type FunctionComponent } from 'preact';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { BluetoothAdapter } from '../mesh/adapters/bluetooth';
import { SerialAdapter } from '../mesh/adapters/serial';
import { WifiAdapter } from '../mesh/adapters/wifi';
import type {
  BatteryState,
  MeshAdapter,
  MeshConfig,
  MeshConnectionType,
  MeshDeviceInfo,
  PositionState
} from '../mesh/types';
import { useEvent } from '../hooks/useEvent';

export interface MeshContextValue {
  connectionType?: MeshConnectionType;
  connected: boolean;
  deviceInfo?: MeshDeviceInfo;
  battery?: BatteryState;
  position?: PositionState;
  config?: MeshConfig;
  connectSerial(): Promise<void>;
  connectBluetooth(): Promise<void>;
  connectWifi(host: string, port?: number): Promise<void>;
  disconnect(): Promise<void>;
  configure(config: MeshConfig): Promise<void>;
  sendPacket(packet: Uint8Array): Promise<void>;
  subscribe(callback: (packet: Uint8Array) => void): () => void;
}

const MeshContext = createContext<MeshContextValue | undefined>(undefined);

export const MeshProvider: FunctionComponent<{ children: ComponentChildren }> = ({ children }) => {
  const adapterRef = useRef<MeshAdapter | undefined>();
  const [connectionType, setConnectionType] = useState<MeshConnectionType>();
  const [connected, setConnected] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<MeshDeviceInfo>();
  const [battery, setBattery] = useState<BatteryState>();
  const [position, setPosition] = useState<PositionState>();
  const [config, setConfig] = useState<MeshConfig>();
  const listeners = useRef(new Set<(packet: Uint8Array) => void>());

  const cleanupAdapter = useCallback(async () => {
    if (adapterRef.current) {
      try {
        await adapterRef.current.disconnect();
      } catch (error) {
        console.warn('Failed to teardown adapter', error);
      }
    }
    adapterRef.current = undefined;
    setConnected(false);
    setConnectionType(undefined);
    setDeviceInfo(undefined);
    setBattery(undefined);
    setPosition(undefined);
    setConfig(undefined);
  }, []);

  const handlePacket = useEvent((packet: Uint8Array) => {
    for (const listener of listeners.current) {
      listener(packet);
    }
  });

  const connectWithAdapter = useCallback(async (adapter: MeshAdapter) => {
    await cleanupAdapter();
    adapterRef.current = adapter;
    adapter.onPacket(handlePacket);
    try {
      await adapter.connect();
      setConnected(true);
      setConnectionType(adapter.type);
      setDeviceInfo(await adapter.getDeviceInfo());
      if (adapter.getBatteryState) {
        setBattery(await adapter.getBatteryState());
      }
      if (adapter.getPosition) {
        setPosition(await adapter.getPosition());
      }
    } catch (error) {
      console.error('Failed to connect with adapter', error);
      await cleanupAdapter();
      throw error;
    }
  }, [cleanupAdapter, handlePacket]);

  const connectSerial = useCallback(async () => {
    const adapter = new SerialAdapter();
    await connectWithAdapter(adapter);
  }, [connectWithAdapter]);

  const connectBluetooth = useCallback(async () => {
    const adapter = new BluetoothAdapter();
    await connectWithAdapter(adapter);
  }, [connectWithAdapter]);

  const connectWifi = useCallback(async (host: string, port?: number) => {
    const adapter = new WifiAdapter(host, port);
    await connectWithAdapter(adapter);
  }, [connectWithAdapter]);

  const disconnect = useCallback(async () => {
    await cleanupAdapter();
  }, [cleanupAdapter]);

  const configure = useCallback(async (incomingConfig: MeshConfig) => {
    if (!adapterRef.current) throw new Error('Not connected');
    await adapterRef.current.configure(incomingConfig);
    setConfig(incomingConfig);
  }, []);

  const sendPacket = useCallback(async (packet: Uint8Array) => {
    if (!adapterRef.current) throw new Error('Not connected');
    await adapterRef.current.send(packet);
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      const adapter = adapterRef.current;
      if (!adapter) return;
      if (adapter.getBatteryState) {
        setBattery(await adapter.getBatteryState());
      }
      if (adapter.getPosition) {
        setPosition(await adapter.getPosition());
      }
      setDeviceInfo(await adapter.getDeviceInfo());
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const subscribe = useCallback((callback: (packet: Uint8Array) => void) => {
    listeners.current.add(callback);
    return () => listeners.current.delete(callback);
  }, []);

  const value = useMemo<MeshContextValue>(() => ({
    connectionType,
    connected,
    deviceInfo,
    battery,
    position,
    config,
    connectSerial,
    connectBluetooth,
    connectWifi,
    disconnect,
    configure,
    sendPacket,
    subscribe
  }), [
    connectionType,
    connected,
    deviceInfo,
    battery,
    position,
    config,
    connectSerial,
    connectBluetooth,
    connectWifi,
    disconnect,
    configure,
    sendPacket,
    subscribe
  ]);

  return <MeshContext.Provider value={value}>{children}</MeshContext.Provider>;
};

export const useMesh = () => {
  const context = useContext(MeshContext);
  if (!context) throw new Error('useMesh must be used within a MeshProvider');
  return context;
};
