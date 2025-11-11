import { useDeviceSession } from './context/DeviceSessionContext';
import { useMessaging } from './context/MessagingContext';
import ConnectionPanel from './components/ConnectionPanel';
import DeviceConfigPanel from './components/DeviceConfigPanel';
import MessagingPanel from './components/MessagingPanel';
import './styles.css';

function App() {
  const { session } = useDeviceSession();
  const { stats } = useMessaging();

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Meshtastic Web Client</h1>
        <div className="status">
          <span>{session?.device?.displayName ?? 'No Device Connected'}</span>
          <small>{stats.pending} pending • {stats.sent} sent</small>
        </div>
      </header>
      <main className="app-main">
        <section>
          <ConnectionPanel />
          <DeviceConfigPanel />
        </section>
        <section>
          <MessagingPanel />
        </section>
      </main>
    </div>
  );
}

export default App;
