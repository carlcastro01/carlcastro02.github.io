import { render } from 'preact';
import { Router } from 'preact-router';
import { registerSW } from 'virtual:pwa-register';
import { App } from './pages/App';
import { MeshProvider } from './contexts/MeshContext';
import { MessagingProvider } from './contexts/MessagingContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { WebRtcProvider } from './contexts/WebRtcContext';
import './index.css';

const Main = () => (
  <SettingsProvider>
    <MeshProvider>
      <MessagingProvider>
        <WebRtcProvider>
          <Router>
            <App path="/" />
          </Router>
        </WebRtcProvider>
      </MessagingProvider>
    </MeshProvider>
  </SettingsProvider>
);

render(<Main />, document.getElementById('root') as HTMLElement);

registerSW({ immediate: true });
