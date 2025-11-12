import { type FunctionComponent } from 'preact';
import { useMemo, useState } from 'preact/hooks';
import { useMesh } from '../contexts/MeshContext';

export const ConnectionPanel: FunctionComponent = () => {
  const mesh = useMesh();
  const [wifiHost, setWifiHost] = useState('');
  const [wifiPort, setWifiPort] = useState(4403);
  const [loading, setLoading] = useState<'serial' | 'bluetooth' | 'wifi' | undefined>();
  const [error, setError] = useState<string>();

  const capability = useMemo(() => ({
    serial: typeof navigator !== 'undefined' && 'serial' in navigator,
    bluetooth: typeof navigator !== 'undefined' && 'bluetooth' in navigator,
    wifi: true
  }), []);

  const connect = async (type: 'serial' | 'bluetooth' | 'wifi') => {
    setError(undefined);
    setLoading(type);
    try {
      if (type === 'serial') await mesh.connectSerial();
      if (type === 'bluetooth') await mesh.connectBluetooth();
      if (type === 'wifi') await mesh.connectWifi(wifiHost, wifiPort);
    } catch (exception) {
      const message = exception instanceof Error ? exception.message : 'Unknown connection error';
      setError(message);
    } finally {
      setLoading(undefined);
    }
  };

  return (
    <section class="card space-y-5" id="connection-panel">
      <header class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 class="text-lg font-semibold text-neutral-white">Connection</h2>
          <p class="text-sm text-neutral-white/60">Link to Heltec Wireless Tracker v1.1 using any supported transport.</p>
        </div>
        {mesh.connected && (
          <button class="btn btn-destructive" onClick={() => mesh.disconnect()}>Disconnect</button>
        )}
      </header>
      <div class="grid gap-3 md:grid-cols-3">
        <button
          class={`btn ${loading === 'serial' || !capability.serial ? 'opacity-60' : ''}`}
          disabled={loading === 'serial' || !capability.serial}
          onClick={() => connect('serial')}
        >
          {capability.serial ? loading === 'serial' ? 'Connecting…' : 'Web Serial' : 'Serial unavailable'}
        </button>
        <button
          class={`btn ${loading === 'bluetooth' || !capability.bluetooth ? 'opacity-60' : ''}`}
          disabled={loading === 'bluetooth' || !capability.bluetooth}
          onClick={() => connect('bluetooth')}
        >
          {capability.bluetooth ? loading === 'bluetooth' ? 'Connecting…' : 'Web Bluetooth' : 'Bluetooth unavailable'}
        </button>
        <div class="flex flex-col gap-2">
          <div class="flex gap-2">
            <input
              class="input"
              placeholder="192.168.4.1"
              value={wifiHost}
              onInput={(event) => setWifiHost((event.target as HTMLInputElement).value)}
            />
            <input
              class="input w-24"
              type="number"
              value={wifiPort}
              min={1}
              onInput={(event) => setWifiPort(Number((event.target as HTMLInputElement).value))}
            />
          </div>
          <button
            class={`btn ${loading === 'wifi' ? 'opacity-60' : ''}`}
            disabled={!wifiHost || loading === 'wifi'}
            onClick={() => connect('wifi')}
          >
            {loading === 'wifi' ? 'Connecting…' : 'Wi-Fi / TCP'}
          </button>
        </div>
      </div>
      {(!capability.serial || !capability.bluetooth) && (
        <p class="text-xs text-neutral-white/50">
          Some connection types are disabled because this browser does not expose the required Web Serial or Web Bluetooth APIs.
          Use Chrome/Edge on desktop with experimental hardware flags enabled to unlock every transport.
        </p>
      )}
      {error && (
        <div class="rounded-2xl border border-status-red/60 bg-status-red/20 p-3 text-sm text-neutral-white">
          {error}
        </div>
      )}
      {mesh.deviceInfo && (
        <dl class="grid grid-cols-2 gap-2 text-sm text-neutral-white/70">
          <div>
            <dt class="uppercase tracking-wide text-xs">Device</dt>
            <dd>{mesh.deviceInfo.longName ?? mesh.deviceInfo.shortName ?? mesh.deviceInfo.id}</dd>
          </div>
          <div>
            <dt class="uppercase tracking-wide text-xs">Firmware</dt>
            <dd>{mesh.deviceInfo.firmwareVersion ?? 'Unknown'}</dd>
          </div>
        </dl>
      )}
    </section>
  );
};
