import { type FunctionComponent } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import L from 'leaflet';
import { useMesh } from '../contexts/MeshContext';
import { storage, type Breadcrumb } from '../utils/storage';
import { useSettings } from '../contexts/SettingsContext';

const EARTH_RADIUS_KM = 6371;

const TILE_SOURCES = {
  offline: {
    url: '/offline-tiles/{z}/{x}/{y}.png',
    attribution: 'Offline tiles'
  },
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors'
  },
  stamen: {
    url: 'https://stamen-tiles.a.ssl.fastly.net/terrain/{z}/{x}/{y}.jpg',
    attribution: '&copy; Stamen Design'
  }
} as const;

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

export const MapPanel: FunctionComponent = () => {
  const mesh = useMesh();
  const { showOfflineTiles, mapTileSource } = useSettings();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map>();
  const tileLayerRef = useRef<L.TileLayer>();
  const breadcrumbLayerRef = useRef<L.LayerGroup>();
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);
  const [attribution, setAttribution] = useState('');

  useEffect(() => {
    storage
      .listBreadcrumbs()
      .then((items) => items.filter((item) => item.latitude !== undefined && item.longitude !== undefined))
      .then(setBreadcrumbs);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;
    mapRef.current = L.map(container, {
      zoomControl: false,
      attributionControl: false,
      preferCanvas: true,
      minZoom: 2,
      maxZoom: 18
    });
    mapRef.current.setView([0, 0], 2);
    breadcrumbLayerRef.current = L.layerGroup().addTo(mapRef.current);
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const sourceKey = mapTileSource === 'offline' && !showOfflineTiles ? 'osm' : mapTileSource;
    const source = TILE_SOURCES[sourceKey];
    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
    }
    tileLayerRef.current = L.tileLayer(source.url, {
      detectRetina: true,
      keepBuffer: 8,
      className: 'rounded-3xl overflow-hidden',
      attribution: source.attribution
    }).addTo(map);
    setAttribution(source.attribution);
  }, [mapTileSource, showOfflineTiles]);

  useEffect(() => {
    const { latitude, longitude } = mesh.position ?? {};
    if (latitude === undefined || longitude === undefined) return;
    const last = breadcrumbs[breadcrumbs.length - 1];
    if (last && Math.abs(last.latitude - latitude) < 1e-6 && Math.abs(last.longitude - longitude) < 1e-6) return;
    const breadcrumb: Breadcrumb = {
      latitude,
      longitude,
      timestamp: mesh.position?.timestamp ?? Date.now()
    };
    storage.addBreadcrumb(breadcrumb).then((persisted) => {
      setBreadcrumbs((prev) => [...prev.slice(-499), persisted]);
    });
  }, [breadcrumbs, mesh.position?.latitude, mesh.position?.longitude, mesh.position?.timestamp]);

  useEffect(() => {
    const map = mapRef.current;
    const layer = breadcrumbLayerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    breadcrumbs.forEach((breadcrumb, index) => {
      const marker = L.circleMarker([breadcrumb.latitude, breadcrumb.longitude], {
        radius: index === breadcrumbs.length - 1 ? 8 : 6,
        weight: 2,
        color: index === breadcrumbs.length - 1 ? '#ECC440' : '#1D03A6',
        fillColor: index === breadcrumbs.length - 1 ? '#ECC440' : '#1D03A6',
        fillOpacity: 0.8
      }).bindTooltip(new Date(breadcrumb.timestamp).toLocaleString(), {
        direction: 'top'
      });
      marker.addTo(layer);
    });
    if (breadcrumbs.length > 1) {
      const coordinates = breadcrumbs.map((item) => [item.latitude, item.longitude]) as [number, number][];
      L.polyline(coordinates, {
        color: '#1D03A6',
        opacity: 0.6,
        weight: 3
      }).addTo(layer);
    }
    if (breadcrumbs.length > 0) {
      map.fitBounds(layer.getBounds().pad(0.25), { animate: true });
    }
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

  const latest = breadcrumbs[breadcrumbs.length - 1];

  return (
    <section class="card space-y-5" id="location">
      <header class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-lg font-semibold text-neutral-white">Location</h2>
          <p class="text-xs text-neutral-white/60">Offline map with breadcrumb trail, distance &amp; bearing tools.</p>
        </div>
        {showOfflineTiles && mapTileSource === 'offline' && (
          <span class="rounded-full bg-secondary-blue/30 px-3 py-1 text-xs font-medium text-accent-gold">Offline tiles enabled</span>
        )}
      </header>
      <div ref={containerRef} class="h-72 w-full overflow-hidden rounded-3xl border border-secondary-blue/40" role="application" aria-label="Breadcrumb trail map" />
      {attribution && (
        <p class="text-[10px] uppercase tracking-wide text-neutral-white/40">{attribution}</p>
      )}
      {latest && (
        <dl class="grid gap-3 text-sm text-neutral-white/70 sm:grid-cols-3">
          <div>
            <dt class="uppercase tracking-wide text-xs">Latitude</dt>
            <dd>{latest.latitude.toFixed(6)}</dd>
          </div>
          <div>
            <dt class="uppercase tracking-wide text-xs">Longitude</dt>
            <dd>{latest.longitude.toFixed(6)}</dd>
          </div>
          <div>
            <dt class="uppercase tracking-wide text-xs">Last Heard</dt>
            <dd>{new Date(latest.timestamp).toLocaleString()}</dd>
          </div>
        </dl>
      )}
      {stats && (
        <dl class="grid gap-3 text-sm text-neutral-white/70 sm:grid-cols-2">
          <div>
            <dt class="uppercase tracking-wide text-xs">Distance Travelled</dt>
            <dd>{stats.distance.toFixed(2)} km</dd>
          </div>
          <div>
            <dt class="uppercase tracking-wide text-xs">Bearing to Last Point</dt>
            <dd>{stats.bearing.toFixed(0)}°</dd>
          </div>
        </dl>
      )}
    </section>
  );
};
