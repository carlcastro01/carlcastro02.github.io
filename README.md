# Mesh Companion PWA

A Meshtastic-inspired Progressive Web App optimised for the Heltec Wireless Tracker v1.1. The project adapts core meshtxt UI concepts to a responsive layout, integrates Meshtastic.js transports (Web Serial, Web Bluetooth, Wi-Fi/TCP), and persists messages and breadcrumb telemetry for offline-first operation.

## Features

- 📡 **Multi-transport connections** — switch between Web Serial, Web Bluetooth, and Wi-Fi to reach Heltec Wireless Tracker v1.1 nodes.
- 💬 **Rich messaging** — channel-aware messaging interface with IndexedDB offline storage, message priorities, and draft persistence.
- 🚨 **Alerts workflow** — SOS & priority triggers with audible + visual cues, including remote SOS detection.
- 🔋 **Device telemetry** — battery and firmware readouts plus periodic refresh.
- 🗺️ **Location utilities** — offline breadcrumb visualisation, distance/bearing calculator, and offline tile toggle.
- ⚙️ **Configuration parity** — edit core owner, channel, region, role, and advanced LoRa/Power JSON payloads mirroring meshtxt capabilities.
- 📱 **PWA ready** — service worker + manifest for offline installs, responsive palette-aligned UI.

## Getting started

> **Prerequisites**
>
> - Node.js 18+
> - npm 9+
> - Chrome or Edge for Web Serial/Bluetooth APIs

```bash
npm install
npm run dev
```

The development server is available on <http://localhost:5173>. For Web Serial/Bluetooth you must serve over HTTPS in production (Vite dev uses localhost exception).

## Production build

```bash
npm run build
npm run preview
```

`npm run build` emits a static bundle within `dist/`. Deploy the contents of that folder to any static host (GitHub Pages, Netlify, S3, etc.). The generated `sw.js` and `manifest.webmanifest` ensure offline capability; remember to enable HTTPS to unlock Web Serial/Web Bluetooth.

## Project structure

```
├── index.html                # Vite entry, includes PWA mount point
├── public/
│   ├── manifest.webmanifest  # Standalone install metadata
│   └── pwa-icon-*.png        # Generated solid-color icons
├── src/
│   ├── components/           # UI surface for connection, messaging, alerts, maps
│   ├── contexts/             # Mesh, messaging, settings state containers
│   ├── mesh/                 # Transport adapters using Meshtastic.js
│   ├── pages/                # App composition
│   ├── utils/storage.ts      # IndexedDB persistence helpers
│   └── index.css             # Tailwind-powered design tokens
├── vite.config.ts            # Vite + PWA plugin configuration
└── README.md
```

## Offline behaviour

- Messages, drafts, and breadcrumb trails persist in IndexedDB (`mesh-pwa`).
- Runtime caching rules in the service worker allow full navigation offline once assets are cached.
- Offline map mode renders stored breadcrumbs locally; drop your own tiles under `public/offline-tiles/` if needed.

## Meshtastic.js integration

Transport adapters lazily import Meshtastic.js classes to keep bundle size low while supporting:

- `SerialTransport` via Web Serial API
- `BluetoothTransport` via Web Bluetooth
- `TcpTransport` for Wi-Fi/TCP links (default port 4403)

The adapters expose battery, position, configuration, and packet piping to the rest of the UI. Adjust transport class names if future Meshtastic.js releases rename them.

## Deployment notes

1. Run `npm run build`.
2. Upload the `dist/` directory to your static host.
3. Serve over HTTPS to access hardware transports.
4. Encourage users to “Install App” via the browser’s PWA prompt for the best offline experience.

## License

MIT
