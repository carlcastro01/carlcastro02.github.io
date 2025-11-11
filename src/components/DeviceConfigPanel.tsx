import { useEffect, useState } from 'react';
import { useDeviceSession } from '../context/DeviceSessionContext';

const DeviceConfigPanel = () => {
  const { session, updateConfig } = useDeviceSession();
  const [owner, setOwner] = useState({
    longName: session?.config.owner.longName ?? '',
    shortName: session?.config.owner.shortName ?? '',
    avatar: session?.config.owner.avatar ?? ''
  });
  const [lora, setLora] = useState({
    region: session?.config.lora.region ?? 'US',
    modemPreset: session?.config.lora.modemPreset ?? 'LONG_FAST',
    hopLimit: session?.config.lora.hopLimit ?? 3
  });
  const [network, setNetwork] = useState({
    wifiEnabled: session?.config.network.wifiEnabled ?? false,
    wifiSsid: session?.config.network.wifiSsid ?? '',
    wifiPassword: session?.config.network.wifiPassword ?? ''
  });

  useEffect(() => {
    if (!session) return;
    setOwner({
      longName: session.config.owner.longName,
      shortName: session.config.owner.shortName,
      avatar: session.config.owner.avatar ?? ''
    });
    setLora({
      region: session.config.lora.region,
      modemPreset: session.config.lora.modemPreset,
      hopLimit: session.config.lora.hopLimit
    });
    setNetwork({
      wifiEnabled: session.config.network.wifiEnabled,
      wifiSsid: session.config.network.wifiSsid ?? '',
      wifiPassword: session.config.network.wifiPassword ?? ''
    });
  }, [session]);

  const handleSave = () => {
    updateConfig({ owner, lora, network });
  };

  return (
    <div>
      <h2>Device Configuration</h2>
      <section>
        <h3>Owner</h3>
        <label htmlFor="long-name">Long Name</label>
        <input
          id="long-name"
          value={owner.longName}
          onChange={(event) => setOwner((prev) => ({ ...prev, longName: event.target.value }))}
        />
        <label htmlFor="short-name">Short Name</label>
        <input
          id="short-name"
          value={owner.shortName}
          onChange={(event) => setOwner((prev) => ({ ...prev, shortName: event.target.value }))}
        />
        <label htmlFor="avatar">Avatar URL</label>
        <input
          id="avatar"
          value={owner.avatar}
          onChange={(event) => setOwner((prev) => ({ ...prev, avatar: event.target.value }))}
        />
      </section>
      <section>
        <h3>LoRa</h3>
        <label htmlFor="region">Region</label>
        <select
          id="region"
          value={lora.region}
          onChange={(event) => setLora((prev) => ({ ...prev, region: event.target.value }))}
        >
          <option value="US">US</option>
          <option value="EU">EU</option>
          <option value="AU">AU</option>
        </select>
        <label htmlFor="modemPreset">Modem Preset</label>
        <select
          id="modemPreset"
          value={lora.modemPreset}
          onChange={(event) => setLora((prev) => ({ ...prev, modemPreset: event.target.value }))}
        >
          <option value="LONG_FAST">Long Fast</option>
          <option value="LONG_SLOW">Long Slow</option>
          <option value="SHORT_FAST">Short Fast</option>
        </select>
        <label htmlFor="hopLimit">Hop Limit</label>
        <input
          id="hopLimit"
          type="number"
          value={lora.hopLimit}
          onChange={(event) => setLora((prev) => ({ ...prev, hopLimit: Number(event.target.value) }))}
        />
      </section>
      <section>
        <h3>WiFi</h3>
        <label>
          <input
            type="checkbox"
            checked={network.wifiEnabled}
            onChange={(event) => setNetwork((prev) => ({ ...prev, wifiEnabled: event.target.checked }))}
          />
          Enable WiFi
        </label>
        <label htmlFor="wifiSsid">SSID</label>
        <input
          id="wifiSsid"
          value={network.wifiSsid}
          onChange={(event) => setNetwork((prev) => ({ ...prev, wifiSsid: event.target.value }))}
        />
        <label htmlFor="wifiPassword">Password</label>
        <input
          id="wifiPassword"
          type="password"
          value={network.wifiPassword}
          onChange={(event) => setNetwork((prev) => ({ ...prev, wifiPassword: event.target.value }))}
        />
      </section>
      <button onClick={handleSave} disabled={!session}>
        Save Configuration
      </button>
    </div>
  );
};

export default DeviceConfigPanel;
