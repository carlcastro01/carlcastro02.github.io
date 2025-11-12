import { type FunctionComponent } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { useMesh } from '../contexts/MeshContext';
import { useSettings } from '../contexts/SettingsContext';
import type { MeshConfig } from '../mesh/types';

const emptyConfig: MeshConfig = {
  owner: '',
  channel: '',
  region: 'US',
  role: 'CLIENT',
  loraConfig: {},
  powerConfig: {}
};

export const ConfigurationPanel: FunctionComponent = () => {
  const mesh = useMesh();
  const [config, setConfig] = useState<MeshConfig>(emptyConfig);
  const [busy, setBusy] = useState(false);
  const settings = useSettings();

  useEffect(() => {
    if (mesh.config) {
      setConfig((prev) => ({ ...prev, ...mesh.config }));
    }
  }, [mesh.config]);

  const update = (field: keyof MeshConfig, value: any) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const submit = async (event: Event) => {
    event.preventDefault();
    setBusy(true);
    try {
      await mesh.configure(config);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form class="card space-y-6" onSubmit={submit}>
      <header class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h2 class="text-lg font-semibold text-neutral-white">Device Configuration</h2>
        <span class="text-xs text-neutral-white/60">Full parity with meshtxt fields</span>
      </header>
      <div class="grid gap-4 md:grid-cols-2">
        <label class="space-y-1 text-sm">
          <span class="text-neutral-white/60">Owner</span>
          <input class="input" value={config.owner ?? ''} onInput={(event) => update('owner', (event.target as HTMLInputElement).value)} />
        </label>
        <label class="space-y-1 text-sm">
          <span class="text-neutral-white/60">Channel</span>
          <input class="input" value={config.channel ?? ''} onInput={(event) => update('channel', (event.target as HTMLInputElement).value)} />
        </label>
        <label class="space-y-1 text-sm">
          <span class="text-neutral-white/60">Region</span>
          <select class="input" value={config.region ?? 'US'} onChange={(event) => update('region', (event.target as HTMLSelectElement).value)}>
            <option value="US">US</option>
            <option value="EU">EU</option>
            <option value="AU">AU</option>
          </select>
        </label>
        <label class="space-y-1 text-sm">
          <span class="text-neutral-white/60">Role</span>
          <select class="input" value={config.role ?? 'CLIENT'} onChange={(event) => update('role', (event.target as HTMLSelectElement).value)}>
            <option value="CLIENT">Client</option>
            <option value="ROUTER">Router</option>
            <option value="TRACKER">Tracker</option>
          </select>
        </label>
      </div>
      <details class="rounded-2xl border border-secondary-blue/30 bg-primary-darker/60 p-4">
        <summary class="cursor-pointer text-sm font-medium text-neutral-white">LoRa Advanced</summary>
        <textarea class="mt-3 w-full rounded-xl border border-secondary-blue/40 bg-primary-darker/80 p-3 text-xs" rows={6} value={JSON.stringify(config.loraConfig ?? {}, null, 2)} onInput={(event) => update('loraConfig', JSON.parse((event.target as HTMLTextAreaElement).value || '{}'))} />
      </details>
      <details class="rounded-2xl border border-secondary-blue/30 bg-primary-darker/60 p-4">
        <summary class="cursor-pointer text-sm font-medium text-neutral-white">Power Profile</summary>
        <textarea class="mt-3 w-full rounded-xl border border-secondary-blue/40 bg-primary-darker/80 p-3 text-xs" rows={6} value={JSON.stringify(config.powerConfig ?? {}, null, 2)} onInput={(event) => update('powerConfig', JSON.parse((event.target as HTMLTextAreaElement).value || '{}'))} />
      </details>
      <section class="rounded-2xl border border-secondary-blue/30 bg-primary-darker/60 p-4">
        <header class="mb-3 flex items-center justify-between">
          <h3 class="text-sm font-semibold text-neutral-white">Offline &amp; Map Options</h3>
          <span class="text-xs text-neutral-white/60">Persisted locally</span>
        </header>
        <div class="space-y-3 text-sm text-neutral-white/80">
          <label class="flex items-center justify-between gap-3">
            <span>Use offline tiles when available</span>
            <input
              type="checkbox"
              class="h-4 w-4 accent-accent-gold"
              checked={settings.showOfflineTiles}
              onChange={(event) => settings.update({ showOfflineTiles: (event.target as HTMLInputElement).checked })}
            />
          </label>
          <label class="space-y-2">
            <span>Tile source</span>
            <select
              class="input"
              value={settings.mapTileSource}
              onChange={(event) => settings.update({ mapTileSource: (event.target as HTMLSelectElement).value })}
            >
              <option value="offline">Offline bundle</option>
              <option value="osm">OpenStreetMap</option>
              <option value="stamen">Stamen Terrain</option>
            </select>
          </label>
        </div>
      </section>
      <button class="btn btn-primary" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save Configuration'}</button>
    </form>
  );
};
