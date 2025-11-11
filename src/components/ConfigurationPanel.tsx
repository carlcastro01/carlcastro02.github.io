import { type FunctionComponent } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { useMesh } from '../contexts/MeshContext';
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
    <form class="card space-y-4" onSubmit={submit}>
      <header class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-sand">Device Configuration</h2>
        <span class="text-xs text-sand/60">Full parity with meshtxt fields</span>
      </header>
      <div class="grid gap-4 md:grid-cols-2">
        <label class="space-y-1 text-sm">
          <span class="text-sand/60">Owner</span>
          <input class="input" value={config.owner ?? ''} onInput={(event) => update('owner', (event.target as HTMLInputElement).value)} />
        </label>
        <label class="space-y-1 text-sm">
          <span class="text-sand/60">Channel</span>
          <input class="input" value={config.channel ?? ''} onInput={(event) => update('channel', (event.target as HTMLInputElement).value)} />
        </label>
        <label class="space-y-1 text-sm">
          <span class="text-sand/60">Region</span>
          <select class="input" value={config.region ?? 'US'} onChange={(event) => update('region', (event.target as HTMLSelectElement).value)}>
            <option value="US">US</option>
            <option value="EU">EU</option>
            <option value="AU">AU</option>
          </select>
        </label>
        <label class="space-y-1 text-sm">
          <span class="text-sand/60">Role</span>
          <select class="input" value={config.role ?? 'CLIENT'} onChange={(event) => update('role', (event.target as HTMLSelectElement).value)}>
            <option value="CLIENT">Client</option>
            <option value="ROUTER">Router</option>
            <option value="TRACKER">Tracker</option>
          </select>
        </label>
      </div>
      <details class="rounded-lg border border-ocean/40 p-3">
        <summary class="cursor-pointer text-sm font-medium text-sand">LoRa Advanced</summary>
        <textarea class="mt-3 w-full rounded-lg border border-ocean/40 bg-midnight/80 p-2 text-xs" rows={6} value={JSON.stringify(config.loraConfig ?? {}, null, 2)} onInput={(event) => update('loraConfig', JSON.parse((event.target as HTMLTextAreaElement).value || '{}'))} />
      </details>
      <details class="rounded-lg border border-ocean/40 p-3">
        <summary class="cursor-pointer text-sm font-medium text-sand">Power Profile</summary>
        <textarea class="mt-3 w-full rounded-lg border border-ocean/40 bg-midnight/80 p-2 text-xs" rows={6} value={JSON.stringify(config.powerConfig ?? {}, null, 2)} onInput={(event) => update('powerConfig', JSON.parse((event.target as HTMLTextAreaElement).value || '{}'))} />
      </details>
      <button class="btn-primary" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save Configuration'}</button>
    </form>
  );
};
