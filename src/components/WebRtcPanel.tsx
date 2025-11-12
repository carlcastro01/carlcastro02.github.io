import { type FunctionComponent } from 'preact';
import { useState } from 'preact/hooks';
import { useWebRtc } from '../contexts/WebRtcContext';

const copyToClipboard = async (value: string) => {
  if (!value) return;
  try {
    await navigator.clipboard.writeText(value);
  } catch (error) {
    console.warn('Clipboard copy failed', error);
  }
};

export const WebRtcPanel: FunctionComponent = () => {
  const {
    supported,
    connected,
    busy,
    error,
    offer,
    answer,
    messages,
    reset,
    createOffer,
    acceptOffer,
    applyRemoteAnswer,
    send
  } = useWebRtc();

  const [remoteOffer, setRemoteOffer] = useState('');
  const [remoteAnswer, setRemoteAnswer] = useState('');
  const [directMessage, setDirectMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const handleCreateOffer = async () => {
    setStatusMessage('Generating offer…');
    try {
      const payload = await createOffer();
      setRemoteOffer(payload);
      setStatusMessage('Offer ready. Share with the remote peer.');
    } catch (exception) {
      const message = exception instanceof Error ? exception.message : 'Unable to create offer';
      setStatusMessage(message);
    }
  };

  const handleAcceptOffer = async () => {
    if (!remoteOffer.trim()) {
      setStatusMessage('Paste a remote offer first.');
      return;
    }
    setStatusMessage('Computing answer…');
    try {
      const answerPayload = await acceptOffer(remoteOffer.trim());
      setRemoteAnswer(answerPayload);
      setStatusMessage('Answer ready. Send back to the initiator.');
    } catch (exception) {
      const message = exception instanceof Error ? exception.message : 'Unable to accept offer';
      setStatusMessage(message);
    }
  };

  const handleApplyAnswer = async () => {
    if (!remoteAnswer.trim()) {
      setStatusMessage('Paste the remote answer to finish pairing.');
      return;
    }
    setStatusMessage('Applying answer…');
    try {
      await applyRemoteAnswer(remoteAnswer.trim());
      setStatusMessage('Direct peer channel established.');
    } catch (exception) {
      const message = exception instanceof Error ? exception.message : 'Unable to apply answer';
      setStatusMessage(message);
    }
  };

  const handleSend = async () => {
    if (!directMessage.trim()) return;
    try {
      await send(directMessage.trim());
      setDirectMessage('');
    } catch (exception) {
      const message = exception instanceof Error ? exception.message : 'Failed to send direct message';
      setStatusMessage(message);
    }
  };

  return (
    <section class="card space-y-5" id="direct-peer">
      <header class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 class="text-lg font-semibold text-neutral-white">Direct Peer Link (WebRTC)</h2>
          <p class="text-xs text-neutral-white/60">
            Establish a data-channel to nearby responders when Internet access is unreliable.
          </p>
        </div>
        <span
          class={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${
            connected ? 'bg-status-green/20 text-status-green' : 'bg-secondary-blue/30 text-neutral-white/80'
          }`}
        >
          {supported ? (connected ? 'Peer connected' : 'Peer idle') : 'Unsupported'}
        </span>
      </header>
      {!supported && (
        <div class="rounded-2xl border border-status-red/60 bg-status-red/20 p-4 text-sm text-neutral-white">
          This browser does not expose WebRTC APIs. Upgrade to a modern Chromium or Firefox build to use direct peer links.
        </div>
      )}
      {supported && (
        <div class="space-y-4">
          <div class="space-y-2">
            <div class="flex flex-wrap items-center gap-2">
              <button
                type="button"
                class="btn"
                onClick={handleCreateOffer}
                disabled={busy}
              >
                {busy ? 'Working…' : 'Generate shareable offer'}
              </button>
              {offer && (
                <button type="button" class="btn" onClick={() => copyToClipboard(offer)}>
                  Copy offer
                </button>
              )}
            </div>
            <textarea
              class="input min-h-[110px]"
              placeholder="Offer code to share with peer"
              value={offer ?? remoteOffer}
              readOnly
            />
          </div>
          <div class="grid gap-4 md:grid-cols-2">
            <div class="space-y-2">
              <label class="text-xs uppercase text-neutral-white/50" htmlFor="remote-offer">
                Paste remote offer
              </label>
              <textarea
                id="remote-offer"
                class="input min-h-[110px]"
                value={remoteOffer}
                onInput={(event) => setRemoteOffer((event.target as HTMLTextAreaElement).value)}
                placeholder="Offer string received from peer"
              />
              <button type="button" class="btn" onClick={handleAcceptOffer} disabled={busy}>
                {busy ? 'Working…' : 'Generate answer'}
              </button>
            </div>
            <div class="space-y-2">
              <label class="text-xs uppercase text-neutral-white/50" htmlFor="remote-answer">
                Paste remote answer
              </label>
              <textarea
                id="remote-answer"
                class="input min-h-[110px]"
                value={remoteAnswer}
                onInput={(event) => setRemoteAnswer((event.target as HTMLTextAreaElement).value)}
                placeholder="Answer string from remote peer"
              />
              <div class="flex flex-wrap gap-2">
                <button type="button" class="btn" onClick={handleApplyAnswer} disabled={busy}>
                  {busy ? 'Working…' : 'Finalize handshake'}
                </button>
                {answer && (
                  <button type="button" class="btn" onClick={() => copyToClipboard(answer)}>
                    Copy answer
                  </button>
                )}
              </div>
            </div>
          </div>
          <div class="space-y-2">
            <label class="text-xs uppercase text-neutral-white/50">Direct peer messages</label>
            <div class="max-h-48 space-y-2 overflow-y-auto rounded-2xl border border-secondary-blue/40 bg-primary-darker/50 p-3">
              {messages.length === 0 && (
                <p class="text-xs text-neutral-white/50">
                  Once paired, any message you send here travels over the peer-to-peer channel.
                </p>
              )}
              {messages
                .slice()
                .reverse()
                .map((message) => (
                  <div
                    key={message.id}
                    class={`rounded-xl p-3 text-sm ${
                      message.direction === 'outgoing'
                        ? 'bg-accent-gold/10 text-accent-gold'
                        : 'bg-secondary-blue/20 text-neutral-white'
                    }`}
                  >
                    <div class="text-[10px] uppercase tracking-wide text-neutral-white/40">
                      {message.direction === 'outgoing' ? 'Sent' : 'Received'} ·{' '}
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                    <p class="mt-1 whitespace-pre-wrap">{message.body}</p>
                  </div>
                ))}
            </div>
            <div class="flex flex-wrap items-end gap-2">
              <textarea
                class="input min-h-[72px] flex-1"
                value={directMessage}
                onInput={(event) => setDirectMessage((event.target as HTMLTextAreaElement).value)}
                placeholder="Send a short coordination note"
              />
              <button type="button" class="btn btn-primary" onClick={handleSend} disabled={!connected}>
                Send direct
              </button>
            </div>
          </div>
        </div>
      )}
      <footer class="space-y-2 text-xs text-neutral-white/60">
        {statusMessage && <p>{statusMessage}</p>}
        {error && <p class="text-status-red">{error}</p>}
        <div class="flex flex-wrap gap-2">
          <button type="button" class="btn" onClick={() => copyToClipboard(remoteOffer)} disabled={!remoteOffer}>
            Copy remote offer
          </button>
          <button type="button" class="btn" onClick={() => copyToClipboard(remoteAnswer)} disabled={!remoteAnswer}>
            Copy remote answer
          </button>
          <button
            type="button"
            class="btn btn-destructive"
            onClick={() => {
              reset();
              setRemoteOffer('');
              setRemoteAnswer('');
              setDirectMessage('');
              setStatusMessage('');
            }}
          >
            Reset session
          </button>
        </div>
      </footer>
    </section>
  );
};

