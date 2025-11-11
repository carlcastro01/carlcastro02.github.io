import { type FunctionComponent } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { useMessaging } from '../contexts/MessagingContext';
import { useMesh } from '../contexts/MeshContext';

const AUDIO_FREQUENCY = 440;

let audioContext: AudioContext | undefined;

const playTone = () => {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.frequency.value = AUDIO_FREQUENCY;
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  gain.gain.value = 0.1;
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 1.5);
};

export const SosPanel: FunctionComponent = () => {
  const { send } = useMessaging();
  const mesh = useMesh();
  const [remoteTriggered, setRemoteTriggered] = useState(false);

  useEffect(() => mesh.subscribe((packet) => {
    const payload = new TextDecoder().decode(packet);
    if (payload.startsWith('ALERT|SOS')) {
      setRemoteTriggered(true);
      playTone();
    }
  }), [mesh]);

  const trigger = async (priority: 'sos' | 'priority') => {
    await send(priority === 'sos' ? 'Emergency assistance requested.' : 'Priority update.', priority);
    playTone();
  };

  return (
    <section class={`card space-y-4 ${remoteTriggered ? 'ring-2 ring-coral animate-pulse' : ''}`}>
      <header class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-sand">Alerts</h2>
        {remoteTriggered && <span class="rounded bg-coral px-2 text-xs text-midnight">Remote SOS</span>}
      </header>
      <p class="text-sm text-sand/70">
        Send SOS or priority alerts. Remote triggers from the mesh network play an audible cue and highlight this module.
      </p>
      <div class="flex flex-wrap gap-3">
        <button class="btn-primary" onClick={() => trigger('sos')}>Send SOS</button>
        <button class="btn" onClick={() => trigger('priority')}>Send Priority</button>
      </div>
      <p class="text-xs text-sand/50">Connected via {mesh.connectionType ?? 'no link'}.</p>
    </section>
  );
};
