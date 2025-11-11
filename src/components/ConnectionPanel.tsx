import { useState } from 'react';
import { useDeviceSession } from '../context/DeviceSessionContext';

const ConnectionPanel = () => {
  const { connectSerial, connectBluetooth, connectWifi, disconnect, session, connection } = useDeviceSession();
  const [wifiHost, setWifiHost] = useState('meshtastic.local');
  const [wifiPort, setWifiPort] = useState(4403);
  const [wifiToken, setWifiToken] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  const handle = async (task: () => Promise<void>) => {
    setIsBusy(true);
    try {
      await task();
    } catch (error) {
      alert((error as Error).message);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div>
      <h2>Connections</h2>
      <button disabled={isBusy} onClick={() => handle(connectSerial)}>Connect Serial</button>
      <button disabled={isBusy} onClick={() => handle(connectBluetooth)}>Connect Bluetooth</button>
      <div>
        <label htmlFor="wifi-host">WiFi Host</label>
        <input id="wifi-host" value={wifiHost} onChange={(event) => setWifiHost(event.target.value)} />
        <label htmlFor="wifi-port">Port</label>
        <input
          id="wifi-port"
          type="number"
          value={wifiPort}
          onChange={(event) => setWifiPort(Number(event.target.value))}
        />
        <label htmlFor="wifi-token">Token</label>
        <input id="wifi-token" value={wifiToken} onChange={(event) => setWifiToken(event.target.value)} />
        <button disabled={isBusy} onClick={() => handle(() => connectWifi(wifiHost, wifiPort, wifiToken || undefined))}>
          Connect WiFi
        </button>
      </div>
      {session && (
        <div className="connected-summary">
          <p>Connected to {session.device.displayName}</p>
          <button disabled={!connection} onClick={() => handle(disconnect)}>
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
};

export default ConnectionPanel;
