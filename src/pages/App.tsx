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
    <div class="flex min-h-screen flex-col bg-gradient-to-b from-primary-darker via-primary-dark to-secondary-blue/30">
      <header class="border-b border-secondary-blue/40 bg-primary-darker/80 px-6 py-4 backdrop-blur">
        <div class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <div>
            <h1 class="text-2xl font-semibold text-neutral-white">ConnectTa Emergency Client</h1>
            <p class="text-sm text-neutral-white/60">Responsive PWA tailored for Heltec Wireless Tracker v1.1</p>
          </div>
          <nav class="flex flex-wrap gap-3 text-sm text-neutral-white/70">
            <a href="#connection" class="hover:text-accent-gold">Connection</a>
            <a href="#messages" class="hover:text-accent-gold">Messages</a>
            <a href="#alerts" class="hover:text-accent-gold">Alerts</a>
            <a href="#location" class="hover:text-accent-gold">Location</a>
            <a href="#config" class="hover:text-accent-gold">Configuration</a>
          </nav>
        </div>
      </header>
      <main class="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-6">
        <section id="connection" class="grid gap-6 lg:grid-cols-3">
          <div class="space-y-6 lg:col-span-2">
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
      <footer class="border-t border-secondary-blue/40 bg-primary-darker/80 px-6 py-4 text-center text-xs text-neutral-white/50">
        Works offline thanks to service workers. Meshtastic integrations provided by Meshtastic.js.
      </footer>
    </div>
  );
};
