# ConnectTa Emergency Mesh Client

A Meshtastic-inspired Progressive Web App optimised for the Heltec Wireless Tracker v1.1. The project adapts core meshtxt UI concepts to a responsive layout, integrates Meshtastic.js transports (Web Serial, Web Bluetooth, Wi-Fi/TCP), and persists messages and breadcrumb telemetry for offline-first operation. The visual system respects the mandatory ConnectTa palette to keep the interface legible outdoors during emergency response.

## Features

- 📡 **Multi-transport connections** — switch between Web Serial, Web Bluetooth, and Wi-Fi to reach Heltec Wireless Tracker v1.1 nodes.
- 💬 **Rich messaging** — channel-aware messaging interface with IndexedDB offline storage, message priorities, and draft persistence.
- 🚨 **Alerts workflow** — SOS & multi-pattern priority triggers with audible + visual cues, including remote activation and custom patterns.
- 🔗 **Direct peer bridge** — browser-based WebRTC data channel with copy/paste offer & answer codes for resilient sideband messaging.
- 🔋 **Device telemetry** — battery and firmware readouts plus periodic refresh.
- 🗺️ **Location utilities** — Leaflet-powered offline breadcrumbs, distance/bearing calculator, and switchable map tile sources.
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

## Step-by-step setup procedure

1. **Install dependencies** — run `npm install` to fetch Meshtastic.js, Leaflet, idb, and the Preact toolchain.
2. **Prepare hardware access** — enable experimental Web Platform features in Chrome/Edge if prompted; connect the Heltec Wireless Tracker v1.1 via USB, Bluetooth, or Wi-Fi.
3. **Start the client** — execute `npm run dev` and visit `http://localhost:5173`. Use the Connection panel to pick Web Serial, Web Bluetooth, or Wi-Fi/TCP.
4. **Configure the device** — open the Configuration section to set owner/channel/role fields and persist preferred map tile source or offline tile usage.
5. **Pair a direct link** — open the Direct Peer Link card, press “Generate shareable offer” and exchange the code with another responder. Use the returned answer to complete the handshake and test the peer-to-peer pad.
6. **Test messaging and alerts** — send a text from the Compose panel, then trigger each emergency pattern (SOS, Medical, Lost, Disaster, Custom). Remote alerts are replayed automatically when another node transmits an `ALERT` payload.
7. **Validate mapping** — confirm GPS breadcrumbs appear on the Leaflet map. Drop offline tiles under `public/offline-tiles/{z}/{x}/{y}.png` for fully disconnected deployments.
8. **Build for production** — run `npm run build` and deploy the generated `dist/` folder to a static host that serves HTTPS so Web Serial/Bluetooth continue to function.

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

## Design system

| Token | Hex | Usage |
| --- | --- | --- |
| `--primary-dark` | `#0C012D` | Cards, panels, primary surfaces |
| `--primary-darker` | `#030015` | App background, modals |
| `--accent-gold` | `#ECC440` | Alerts, primary buttons, key accents |
| `--secondary-blue` | `#1D03A6` | Secondary emphasis, dividers |
| `--neutral-white` | `#FFFFFF` | Text/icons for high contrast |

All buttons maintain large touch targets and high-contrast states to ensure outdoor readability and gloved usage.

## Deployment notes

1. Run `npm run build`.
2. Upload the `dist/` directory to your static host.
3. Serve over HTTPS to access hardware transports.
4. Encourage users to “Install App” via the browser’s PWA prompt for the best offline experience.

## License

MIT
