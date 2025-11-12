import { type FunctionComponent } from 'preact';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { useMessaging } from '../contexts/MessagingContext';
import { useMesh } from '../contexts/MeshContext';
import {
  ALERT_PATTERNS,
  DEFAULT_CUSTOM_PATTERN,
  type AlertPatternKey,
  buildAlertBody,
  deserializeSequence,
  parseAlertBody,
  playAlertPattern,
  stopAlertPattern
} from '../utils/alerts';

type SosSelection = AlertPatternKey | 'custom';

export const SosPanel: FunctionComponent = () => {
  const { send } = useMessaging();
  const mesh = useMesh();
  const [selection, setSelection] = useState<SosSelection>('sos');
  const [customPattern, setCustomPattern] = useState(DEFAULT_CUSTOM_PATTERN);
  const [customLabel, setCustomLabel] = useState('Custom Alert');
  const [customPriority, setCustomPriority] = useState<'priority' | 'sos'>('priority');
  const [remoteDetails, setRemoteDetails] = useState<{ label: string; message?: string }>();

  useEffect(() => {
    return () => stopAlertPattern();
  }, []);

  useEffect(() => {
    if (!remoteDetails) return;
    const timeout = setTimeout(() => setRemoteDetails(undefined), 15000);
    return () => clearTimeout(timeout);
  }, [remoteDetails]);

  useEffect(() =>
    mesh.subscribe((packet) => {
      const payload = new TextDecoder().decode(packet);
      const parsed = parseAlertBody(payload);
      if (!parsed) return;
      const pattern = ALERT_PATTERNS[parsed.key as AlertPatternKey];
      const sequence = deserializeSequence(parsed.sequence);
      void playAlertPattern(pattern ?? {
        key: 'sos',
        label: parsed.key ?? 'Custom Alert',
        description: parsed.message ?? 'Remote alert',
        frequency: 700,
        priority: 'priority',
        sequence: sequence.length > 0 ? sequence : ALERT_PATTERNS.sos.sequence
      }, sequence.length > 0 ? sequence : undefined);
      setRemoteDetails({
        label: pattern?.label ?? (parsed.key ? parsed.key.toUpperCase() : 'Remote Alert'),
        message: parsed.message
      });
    }), [mesh]);

  const selectionDescription = useMemo(() => {
    if (selection === 'custom') {
      return `${customLabel} · ${customPriority.toUpperCase()}`;
    }
    const pattern = ALERT_PATTERNS[selection];
    return `${pattern.label} · ${pattern.priority?.toUpperCase()}`;
  }, [selection, customLabel, customPriority]);

  const triggerAlert = async (key: SosSelection) => {
    const basePattern = key === 'custom' ? undefined : ALERT_PATTERNS[key];
    const sequence = key === 'custom' ? deserializeSequence(customPattern) : basePattern?.sequence ?? [];
    if (sequence.length === 0) return;
    const priority = key === 'custom' ? customPriority : basePattern?.priority ?? 'priority';
    const message = key === 'custom' ? customLabel : basePattern?.description;
    const playbackPattern =
      basePattern ?? {
        key: 'sos',
        label: customLabel,
        description: message ?? 'Custom alert',
        frequency: 700,
        priority,
        sequence
      };
    void playAlertPattern(playbackPattern, sequence);
    try {
      await send(buildAlertBody(key, sequence, message), priority);
    } catch (error) {
      console.warn('Failed to broadcast alert', error);
    }
  };

  return (
    <section class={`card space-y-5 ${remoteDetails ? 'ring-2 ring-accent-gold animate-pulse' : ''}`} id="alerts">
      <header class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 class="text-lg font-semibold text-neutral-white">Emergency Alerts</h2>
          <p class="text-xs text-neutral-white/60">Broadcast mesh-wide alarms with audible, visual, and vibration cues.</p>
        </div>
        {remoteDetails && (
          <span class="rounded-full bg-accent-gold/10 px-3 py-1 text-xs font-medium text-accent-gold">
            Remote alert: {remoteDetails.label}
          </span>
        )}
      </header>
      {remoteDetails?.message && (
        <p class="text-xs text-neutral-white/60">{remoteDetails.message}</p>
      )}
      <p class="text-sm text-neutral-white/70">Selected: {selectionDescription}</p>
      <div class="grid gap-3 sm:grid-cols-2">
        {Object.values(ALERT_PATTERNS).map((pattern) => (
          <button
            type="button"
            key={pattern.key}
            class={`flex flex-col gap-1 rounded-2xl border border-secondary-blue/40 bg-primary-darker/60 p-4 text-left transition hover:border-accent-gold ${
              selection === pattern.key ? 'border-accent-gold bg-accent-gold/10' : ''
            }`}
            onClick={() => {
              setSelection(pattern.key);
              triggerAlert(pattern.key).catch(() => {});
            }}
          >
            <span class="text-sm font-semibold text-neutral-white">{pattern.label}</span>
            <span class="text-xs text-neutral-white/60">{pattern.description}</span>
          </button>
        ))}
      </div>
      <form
        class="space-y-3 rounded-2xl border border-secondary-blue/30 bg-primary-darker/60 p-4"
        onSubmit={(event) => {
          event.preventDefault();
          setSelection('custom');
          triggerAlert('custom').catch(() => {});
        }}
      >
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h3 class="text-sm font-semibold text-neutral-white">Custom pattern</h3>
          <button type="button" class="text-xs uppercase text-accent-gold" onClick={() => setCustomPattern(DEFAULT_CUSTOM_PATTERN)}>
            Reset pattern
          </button>
        </div>
        <label class="space-y-1 text-sm text-neutral-white/80">
          <span>Label</span>
          <input class="input" value={customLabel} onInput={(event) => setCustomLabel((event.target as HTMLInputElement).value)} />
        </label>
        <label class="space-y-1 text-sm text-neutral-white/80">
          <span>Pulse / pause sequence (ms)</span>
          <input
            class="input"
            value={customPattern}
            onInput={(event) => setCustomPattern((event.target as HTMLInputElement).value)}
            placeholder="e.g. 500,200,500,800"
          />
        </label>
        <label class="space-y-1 text-sm text-neutral-white/80">
          <span>Priority</span>
          <select class="input" value={customPriority} onChange={(event) => setCustomPriority((event.target as HTMLSelectElement).value as typeof customPriority)}>
            <option value="priority">Priority</option>
            <option value="sos">SOS</option>
          </select>
        </label>
        <button type="submit" class="w-full btn btn-primary">Broadcast custom pattern</button>
      </form>
      <div class="flex flex-wrap gap-3">
        <button type="button" class="btn btn-primary flex-1" onClick={() => triggerAlert(selection).catch(() => {})}>
          Re-broadcast {selection === 'custom' ? 'custom alert' : ALERT_PATTERNS[selection].label}
        </button>
        <button type="button" class="btn btn-destructive" onClick={() => stopAlertPattern()}>
          Stop alarms
        </button>
      </div>
      <p class="text-xs text-neutral-white/50">Connected via {mesh.connectionType ?? 'no link'}.</p>
    </section>
  );
};
