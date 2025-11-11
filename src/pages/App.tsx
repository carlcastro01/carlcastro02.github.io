import type { RouteComponentProps } from 'preact-router';
import { type FunctionComponent } from 'preact';
import { BatteryPanel } from '../components/BatteryPanel';
import { ConnectionPanel } from '../components/ConnectionPanel';
import { ConfigurationPanel } from '../components/ConfigurationPanel';
import { MapPanel } from '../components/MapPanel';
import { MessageComposer } from '../components/MessageComposer';
import { MessageList } from '../components/MessageList';
import { SosPanel } from '../components/SosPanel';

export const App: FunctionComponent<RouteComponentProps> = () => {
  return (
    <div class="flex min-h-screen flex-col bg-gradient-to-b from-midnight via-midnight to-ocean/40">
      <header class="border-b border-ocean/40 bg-midnight/80 px-6 py-4 backdrop-blur">
        <div class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <div>
            <h1 class="text-2xl font-semibold text-sand">Mesh Companion</h1>
            <p class="text-sm text-sand/60">Responsive PWA tailored for Heltec Wireless Tracker v1.1</p>
          </div>
          <nav class="flex flex-wrap gap-3 text-sm text-sand/70">
            <a href="#connection" class="hover:text-sky">Connection</a>
            <a href="#messages" class="hover:text-sky">Messages</a>
            <a href="#alerts" class="hover:text-sky">Alerts</a>
            <a href="#location" class="hover:text-sky">Location</a>
            <a href="#config" class="hover:text-sky">Configuration</a>
          </nav>
        </div>
      </header>
      <main class="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-6">
        <section id="connection" class="grid gap-6 lg:grid-cols-3">
          <div class="lg:col-span-2 space-y-6">
            <ConnectionPanel />
            <MessageComposer />
          </div>
          <div class="space-y-6">
            <BatteryPanel />
            <SosPanel />
          </div>
        </section>
        <section id="messages" class="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <MessageList />
          <MapPanel />
        </section>
        <section id="config">
          <ConfigurationPanel />
        </section>
      </main>
      <footer class="border-t border-ocean/40 bg-midnight/80 px-6 py-4 text-center text-xs text-sand/50">
        Works offline thanks to service workers. Meshtastic integrations provided by Meshtastic.js.
      </footer>
    </div>
  );
};
