import type { StoredMessage } from './storage';

export type AlertPatternKey = 'sos' | 'medical' | 'lost' | 'disaster';

export interface AlertPattern {
  key: AlertPatternKey;
  label: string;
  description: string;
  frequency: number;
  sequence: number[];
  priority: StoredMessage['priority'];
}

export const ALERT_PATTERNS: Record<AlertPatternKey, AlertPattern> = {
  sos: {
    key: 'sos',
    label: 'SOS Broadcast',
    description: 'One-touch emergency broadcast to the entire mesh.',
    frequency: 720,
    priority: 'sos',
    sequence: [300, 150, 300, 150, 300, 300, 900, 300, 900, 300, 900, 300, 300, 150, 300, 150, 300]
  },
  medical: {
    key: 'medical',
    label: 'Medical Emergency',
    description: 'Three short, three long, three short pulses for triage support.',
    frequency: 840,
    priority: 'priority',
    sequence: [300, 120, 300, 120, 300, 180, 900, 180, 900, 180, 900, 180, 300, 120, 300, 120, 300]
  },
  lost: {
    key: 'lost',
    label: 'Lost / Rescue Needed',
    description: 'Continuous alarm requesting navigation support.',
    frequency: 560,
    priority: 'priority',
    sequence: [2000, 400, 2000, 400, 2000, 800]
  },
  disaster: {
    key: 'disaster',
    label: 'Natural Disaster Warning',
    description: 'Intermittent bursts signalling severe environmental danger.',
    frequency: 640,
    priority: 'priority',
    sequence: [500, 250, 500, 250, 500, 900, 500, 250, 500, 250, 500, 1500]
  }
};

export const DEFAULT_CUSTOM_PATTERN = '600,300,600,300,1200';

let audioContext: AudioContext | undefined;
let activeController: AbortController | undefined;

const ensureAudioContext = async () => {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }
  return audioContext;
};

const wait = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    const timeout = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timeout);
      signal.removeEventListener('abort', onAbort);
      reject(new DOMException('Aborted', 'AbortError'));
    };
    signal.addEventListener('abort', onAbort);
  });

const clearFlash = () => {
  document.body.classList.remove('alert-flash');
  navigator.vibrate?.(0);
};

export const stopAlertPattern = () => {
  activeController?.abort();
  activeController = undefined;
  clearFlash();
};

export const playAlertPattern = async (pattern: AlertPattern, sequenceOverride?: number[]) => {
  stopAlertPattern();
  const sequence = sequenceOverride && sequenceOverride.length > 0 ? sequenceOverride : pattern.sequence;
  const controller = new AbortController();
  activeController = controller;
  const context = await ensureAudioContext();
  navigator.vibrate?.(sequence);

  try {
    for (let index = 0; index < sequence.length; index++) {
      if (controller.signal.aborted) break;
      const duration = sequence[index];
      if (duration <= 0) continue;
      if (index % 2 === 0) {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = pattern.frequency;
        gain.gain.value = 0.28;
        oscillator.connect(gain);
        gain.connect(context.destination);
        document.body.classList.add('alert-flash');
        oscillator.start();
        await wait(duration, controller.signal).catch(() => {});
        oscillator.stop();
        document.body.classList.remove('alert-flash');
      } else {
        await wait(duration, controller.signal).catch(() => {});
      }
    }
  } finally {
    clearFlash();
    activeController = undefined;
  }
};

export interface AlertBroadcastPayload {
  key: string;
  message?: string;
  sequence?: string;
}

export const buildAlertBody = (key: string, sequence: number[], message?: string) =>
  `ALERT|${JSON.stringify({ key, message, sequence: serializeSequence(sequence) })}`;

export const parseAlertBody = (payload: string): AlertBroadcastPayload | undefined => {
  if (!payload.startsWith('ALERT|')) return undefined;
  const [, data] = payload.split('|', 2);
  try {
    return JSON.parse(data) as AlertBroadcastPayload;
  } catch (error) {
    console.warn('Failed to parse alert payload', error);
    return undefined;
  }
};

export const serializeSequence = (sequence: number[]) => sequence.join(',');

export const deserializeSequence = (value?: string | null) => {
  if (!value) return [];
  return value
    .split(/[,\s]+/)
    .map((entry) => Number(entry.trim()))
    .filter((entry) => !Number.isNaN(entry) && entry > 0);
};
