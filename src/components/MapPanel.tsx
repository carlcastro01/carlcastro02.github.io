import { type FunctionComponent } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { useMesh } from '../contexts/MeshContext';
import { storage, type Breadcrumb } from '../utils/storage';
import { useSettings } from '../contexts/SettingsContext';

const EARTH_RADIUS_KM = 6371;

const toRadians = (degrees: number) => degrees * Math.PI / 180;

const distanceBetween = (from: Breadcrumb, to: Breadcrumb) => {
  const dLat = toRadians(to.latitude - from.latitude);
  const dLon = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);
  const a = Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
};

const bearingBetween = (from: Breadcrumb, to: Breadcrumb) => {
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);
  const dLon = toRadians(to.longitude - from.longitude);
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  const bearing = Math.atan2(y, x) * 180 / Math.PI;
  return (bearing + 360) % 360;
};

const drawBreadcrumbs = (canvas: HTMLCanvasElement, breadcrumbs: Breadcrumb[]) => {
  const context = canvas.getContext('2d');
  if (!context) return;
  context.clearRect(0, 0, canvas.width, canvas.height);
  if (breadcrumbs.length === 0) return;

  const lats = breadcrumbs.map((b) => b.latitude);
  const lons = breadcrumbs.map((b) => b.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const padding = 20;

  breadcrumbs.forEach((breadcrumb, index) => {
    const x = padding + ((breadcrumb.longitude - minLon) / (maxLon - minLon || 1)) * (canvas.width - padding * 2);
    const y = padding + ((maxLat - breadcrumb.latitude) / (maxLat - minLat || 1)) * (canvas.height - padding * 2);
    context.fillStyle = index === breadcrumbs.length - 1 ? '#ff6f61' : '#57c7ff';
    context.beginPath();
    context.arc(x, y, 5, 0, Math.PI * 2);
    context.fill();

    if (index > 0) {
      const previous = breadcrumbs[index - 1];
      const prevX = padding + ((previous.longitude - minLon) / (maxLon - minLon || 1)) * (canvas.width - padding * 2);
      const prevY = padding + ((maxLat - previous.latitude) / (maxLat - minLat || 1)) * (canvas.height - padding * 2);
      context.strokeStyle = '#57c7ff';
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(prevX, prevY);
      context.lineTo(x, y);
      context.stroke();
    }
  });
};

export const MapPanel: FunctionComponent = () => {
  const mesh = useMesh();
  const { showOfflineTiles } = useSettings();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);

  useEffect(() => {
    storage.listBreadcrumbs().then(setBreadcrumbs);
  }, []);

  useEffect(() => {
    if (!mesh.position?.latitude || !mesh.position?.longitude) return;
    const breadcrumb: Breadcrumb = {
      latitude: mesh.position.latitude,
      longitude: mesh.position.longitude,
      timestamp: mesh.position.timestamp ?? Date.now()
    };
    storage.addBreadcrumb(breadcrumb).then((persisted) => {
      setBreadcrumbs((prev) => [...prev, persisted].slice(-500));
    });
  }, [mesh.position?.latitude, mesh.position?.longitude, mesh.position?.timestamp]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawBreadcrumbs(canvas, breadcrumbs);
  }, [breadcrumbs]);

  const stats = useMemo(() => {
    if (breadcrumbs.length < 2) return undefined;
    const start = breadcrumbs[0];
    const end = breadcrumbs[breadcrumbs.length - 1];
    return {
      distance: distanceBetween(start, end),
      bearing: bearingBetween(start, end)
    };
  }, [breadcrumbs]);

  return (
    <section class="card space-y-4">
      <header class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-lg font-semibold text-sand">Location</h2>
          <p class="text-xs text-sand/60">Offline breadcrumbs with distance &amp; bearing utilities.</p>
        </div>
        {showOfflineTiles && <span class="rounded bg-sky/20 px-2 text-xs text-sky">Offline tiles enabled</span>}
      </header>
      <canvas ref={canvasRef} class="h-64 w-full rounded-xl bg-midnight/80" width={640} height={320} role="img" aria-label="Breadcrumb trail map" />
      {stats && (
        <dl class="grid grid-cols-2 gap-3 text-sm text-sand/70">
          <div>
            <dt class="uppercase tracking-wide text-xs">Distance</dt>
            <dd>{stats.distance.toFixed(2)} km</dd>
          </div>
          <div>
            <dt class="uppercase tracking-wide text-xs">Bearing</dt>
            <dd>{stats.bearing.toFixed(0)}°</dd>
          </div>
        </dl>
      )}
    </section>
  );
};
