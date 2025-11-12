import { type FunctionComponent } from 'preact';
import { useState } from 'preact/hooks';
import { useMesh } from '../contexts/MeshContext';

export const ConnectionPanel: FunctionComponent = () => {
  const mesh = useMesh();
  const [wifiHost, setWifiHost] = useState('');
  const [wifiPort, setWifiPort] = useState(4403);
  const [loading, setLoading] = useState<'serial' | 'bluetooth' | 'wifi' | undefined>();

  const connect = async (type: 'serial' | 'bluetooth' | 'wifi') => {
    setLoading(type);
    try {
      if (type === 'serial') await mesh.connectSerial();
      if (type === 'bluetooth') await mesh.connectBluetooth();
      if (type === 'wifi') await mesh.connectWifi(wifiHost, wifiPort);
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
          class={`btn ${loading === 'serial' ? 'opacity-60' : ''}`}
          disabled={loading === 'serial'}
          onClick={() => connect('serial')}
        >
          {loading === 'serial' ? 'Connecting…' : 'Web Serial'}
        </button>
        <button
          class={`btn ${loading === 'bluetooth' ? 'opacity-60' : ''}`}
          disabled={loading === 'bluetooth'}
          onClick={() => connect('bluetooth')}
        >
          {loading === 'bluetooth' ? 'Connecting…' : 'Web Bluetooth'}
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
