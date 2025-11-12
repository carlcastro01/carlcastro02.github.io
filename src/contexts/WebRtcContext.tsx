import { createContext, type ComponentChildren, type FunctionComponent } from 'preact';
import { useCallback, useContext, useMemo, useRef, useState } from 'preact/hooks';

const STUN_SERVERS: RTCConfiguration['iceServers'] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' }
];

export type WebRtcMessageDirection = 'incoming' | 'outgoing';

export interface WebRtcMessage {
  id: number;
  body: string;
  direction: WebRtcMessageDirection;
  timestamp: number;
}

export interface WebRtcContextValue {
  supported: boolean;
  connected: boolean;
  busy: boolean;
  error?: string;
  offer?: string;
  answer?: string;
  messages: WebRtcMessage[];
  reset(): void;
  createOffer(): Promise<string>;
  applyRemoteAnswer(answer: string): Promise<void>;
  acceptOffer(offer: string): Promise<string>;
  send(body: string): Promise<void>;
}

const WebRtcContext = createContext<WebRtcContextValue | undefined>(undefined);

const encodeDescription = (description: RTCSessionDescriptionInit) => {
  const json = JSON.stringify(description);
  if (typeof btoa !== 'function') throw new Error('Base64 encoding unavailable in this environment');
  return btoa(json);
};

const decodeDescription = (payload: string): RTCSessionDescriptionInit => {
  if (typeof atob !== 'function') throw new Error('Base64 decoding unavailable in this environment');
  return JSON.parse(atob(payload)) as RTCSessionDescriptionInit;
};

const waitForIceGathering = (pc: RTCPeerConnection) =>
  new Promise<void>((resolve) => {
    if (pc.iceGatheringState === 'complete') {
      resolve();
      return;
    }
    const timeout = setTimeout(() => {
      pc.removeEventListener('icegatheringstatechange', onChange);
      resolve();
    }, 4000);
    const onChange = () => {
      if (pc.iceGatheringState === 'complete') {
        clearTimeout(timeout);
        pc.removeEventListener('icegatheringstatechange', onChange);
        resolve();
      }
    };
    pc.addEventListener('icegatheringstatechange', onChange);
  });

export const WebRtcProvider: FunctionComponent<{ children: ComponentChildren }> = ({ children }) => {
  const supported = typeof window !== 'undefined' && typeof RTCPeerConnection !== 'undefined';
  const connectionRef = useRef<RTCPeerConnection>();
  const channelRef = useRef<RTCDataChannel>();
  const messageId = useRef(0);
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [offer, setOffer] = useState<string>();
  const [answer, setAnswer] = useState<string>();
  const [messages, setMessages] = useState<WebRtcMessage[]>([]);

  const reset = useCallback(() => {
    connectionRef.current?.close();
    connectionRef.current = undefined;
    channelRef.current = undefined;
    setConnected(false);
    setBusy(false);
    setError(undefined);
    setOffer(undefined);
    setAnswer(undefined);
    setMessages([]);
  }, []);

  const attachChannel = useCallback((channel: RTCDataChannel) => {
    channelRef.current = channel;
    channel.binaryType = 'arraybuffer';
    channel.onopen = () => setConnected(true);
    channel.onclose = () => setConnected(false);
    channel.onerror = (event) => {
      console.warn('WebRTC channel error', event);
      setError('Peer data channel error');
    };
    channel.onmessage = (event) => {
      const value = typeof event.data === 'string' ? event.data : '[binary payload]';
      const id = messageId.current++;
      setMessages((prev) => [...prev.slice(-99), { id, body: value, direction: 'incoming', timestamp: Date.now() }]);
    };
  }, []);

  const ensureConnection = useCallback(
    (createChannel: boolean) => {
      if (!supported) throw new Error('WebRTC unsupported in this browser');
      let pc = connectionRef.current;
      if (!pc) {
        pc = new RTCPeerConnection({ iceServers: STUN_SERVERS });
        pc.onconnectionstatechange = () => {
          if (pc?.connectionState === 'failed' || pc?.connectionState === 'disconnected' || pc?.connectionState === 'closed') {
            setConnected(false);
          }
        };
        pc.oniceconnectionstatechange = () => {
          if (pc?.iceConnectionState === 'failed') {
            setError('Peer connection failed');
          }
        };
        pc.ondatachannel = (event) => attachChannel(event.channel);
        connectionRef.current = pc;
      }
      if (createChannel && !channelRef.current) {
        attachChannel(pc.createDataChannel('mesh-direct'));
      }
      return pc;
    },
    [attachChannel, supported]
  );

  const createOffer = useCallback(async () => {
    setError(undefined);
    setBusy(true);
    try {
      const pc = ensureConnection(true);
      const offerDescription = await pc.createOffer({ offerToReceiveAudio: false, offerToReceiveVideo: false });
      await pc.setLocalDescription(offerDescription);
      await waitForIceGathering(pc);
      const description = pc.localDescription;
      if (!description) throw new Error('Failed to gather offer description');
      const encoded = encodeDescription(description);
      setOffer(encoded);
      return encoded;
    } catch (exception) {
      const message = exception instanceof Error ? exception.message : 'Failed to create peer offer';
      setError(message);
      throw exception;
    } finally {
      setBusy(false);
    }
  }, [ensureConnection]);

  const applyRemoteAnswer = useCallback(
    async (payload: string) => {
      setError(undefined);
      setBusy(true);
      try {
        const pc = ensureConnection(true);
        const description = decodeDescription(payload);
        await pc.setRemoteDescription(description);
        setAnswer(payload);
      } catch (exception) {
        const message = exception instanceof Error ? exception.message : 'Failed to apply remote answer';
        setError(message);
        throw exception;
      } finally {
        setBusy(false);
      }
    },
    [ensureConnection]
  );

  const acceptOffer = useCallback(
    async (payload: string) => {
      setError(undefined);
      setBusy(true);
      try {
        const pc = ensureConnection(false);
        const description = decodeDescription(payload);
        await pc.setRemoteDescription(description);
        const answerDescription = await pc.createAnswer();
        await pc.setLocalDescription(answerDescription);
        await waitForIceGathering(pc);
        const answerValue = pc.localDescription;
        if (!answerValue) throw new Error('Failed to gather answer description');
        const encoded = encodeDescription(answerValue);
        setAnswer(encoded);
        return encoded;
      } catch (exception) {
        const message = exception instanceof Error ? exception.message : 'Failed to accept peer offer';
        setError(message);
        throw exception;
      } finally {
        setBusy(false);
      }
    },
    [ensureConnection]
  );

  const send = useCallback(async (body: string) => {
    const channel = channelRef.current;
    if (!channel || channel.readyState !== 'open') {
      const errorMessage = 'Peer data channel is not open';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
    channel.send(body);
    const id = messageId.current++;
    setMessages((prev) => [...prev.slice(-99), { id, body, direction: 'outgoing', timestamp: Date.now() }]);
  }, []);

  const value = useMemo<WebRtcContextValue>(
    () => ({
      supported,
      connected,
      busy,
      error,
      offer,
      answer,
      messages,
      reset,
      createOffer,
      applyRemoteAnswer,
      acceptOffer,
      send
    }),
    [supported, connected, busy, error, offer, answer, messages, reset, createOffer, applyRemoteAnswer, acceptOffer, send]
  );

  return <WebRtcContext.Provider value={value}>{children}</WebRtcContext.Provider>;
};

export const useWebRtc = () => {
  const context = useContext(WebRtcContext);
  if (!context) throw new Error('useWebRtc must be used within a WebRtcProvider');
  return context;
};

