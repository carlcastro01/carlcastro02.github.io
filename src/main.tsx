import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { DeviceSessionProvider } from './context/DeviceSessionContext';
import { MessagingProvider } from './context/MessagingContext';
import './serviceWorkerRegistration';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <DeviceSessionProvider>
      <MessagingProvider>
        <App />
      </MessagingProvider>
    </DeviceSessionProvider>
  </React.StrictMode>
);
