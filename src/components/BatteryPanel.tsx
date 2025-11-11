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
    <section class={`card space-y-4 ${alert ? 'ring-2 ring-coral' : ''}`}>
      <header class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-sand">Battery</h2>
        {battery?.isCharging && <span class="rounded bg-sky/20 px-2 text-xs text-sky">Charging</span>}
      </header>
      <div class="flex items-baseline gap-4 text-3xl font-bold">
        <span>{formatBattery(battery?.percentage)}</span>
        <span class="text-base font-medium text-sand/60">{formatVoltage(battery?.voltage)}</span>
      </div>
      {alert && (
        <div class="rounded-lg bg-coral/20 p-3 text-sm text-sand">
          Critical battery level. Consider enabling power saving settings or sending an SOS update.
        </div>
      )}
    </section>
  );
};
