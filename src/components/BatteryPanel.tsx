import { type FunctionComponent } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { useMesh } from '../contexts/MeshContext';

const formatBattery = (percentage?: number) => {
  if (percentage === undefined) return '—';
  return `${Math.round(percentage)}%`;
};

const formatVoltage = (voltage?: number) => {
  if (voltage === undefined) return '—';
  return `${voltage.toFixed(2)}V`;
};

export const BatteryPanel: FunctionComponent = () => {
  const { battery } = useMesh();
  const [alert, setAlert] = useState(false);

  useEffect(() => {
    if (battery?.percentage !== undefined && battery.percentage < 15) {
      setAlert(true);
    } else {
      setAlert(false);
    }
  }, [battery?.percentage]);

  return (
    <section class={`card space-y-5 ${alert ? 'ring-2 ring-status-red/80 shadow-status-red/40' : ''}`} aria-live="polite">
      <header class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-neutral-white">Power</h2>
        {battery?.isCharging && (
          <span class="rounded-full bg-secondary-blue/30 px-3 py-1 text-xs font-medium text-accent-gold">Charging</span>
        )}
      </header>
      <div class="space-y-3">
        <div class="flex items-end gap-4 text-4xl font-semibold">
          <span>{formatBattery(battery?.percentage)}</span>
          <span class="text-base font-medium text-neutral-white/60">{formatVoltage(battery?.voltage)}</span>
        </div>
        <div class="h-3 w-full overflow-hidden rounded-full bg-primary-darker/80">
          <div
            class={`h-full transition-all ${alert ? 'bg-status-red' : 'bg-accent-gold'}`}
            style={{ width: battery?.percentage !== undefined ? `${battery.percentage}%` : '8%' }}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={battery?.percentage ?? 0}
          />
        </div>
      </div>
      {alert && (
        <div class="rounded-2xl border border-status-red/60 bg-status-red/10 p-4 text-sm text-neutral-white">
          Critical battery level. Reduce radio duty cycle or broadcast an assistance update.
        </div>
      )}
    </section>
  );
};
