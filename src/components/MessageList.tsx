import { type FunctionComponent } from 'preact';
import { useMemo } from 'preact/hooks';
import { ALERT_PATTERNS, type AlertPatternKey, parseAlertBody } from '../utils/alerts';
import { useMessaging } from '../contexts/MessagingContext';

export const MessageList: FunctionComponent = () => {
  const { messages, channelId } = useMessaging();

  const filtered = useMemo(() => messages.filter((message) => message.channelId === channelId), [messages, channelId]);

  return (
    <section class="card flex h-full flex-col overflow-hidden" id="messages">
      <header class="flex items-center justify-between border-b border-secondary-blue/40 pb-3">
        <h2 class="text-lg font-semibold text-neutral-white">Messages</h2>
        <span class="text-xs uppercase tracking-wide text-neutral-white/50">{filtered.length} items</span>
      </header>
      <div class="flex-1 space-y-3 overflow-y-auto pt-3">
        {filtered.map((message) => {
          const alertPayload = parseAlertBody(message.body);
          const alertPattern = alertPayload && alertPayload.key in ALERT_PATTERNS
            ? ALERT_PATTERNS[alertPayload.key as AlertPatternKey]
            : undefined;
          const displayBody = alertPayload
            ? alertPayload.message ?? alertPattern?.description ?? `Alert broadcast: ${alertPayload.key}`
            : message.body;
          return (
          <article
            key={message.id ?? message.timestamp}
            class={`rounded-2xl border border-secondary-blue/40 p-4 transition ${
              message.priority === 'sos'
                ? 'bg-status-red/20'
                : message.priority === 'priority'
                  ? 'bg-secondary-blue/20'
                  : 'bg-primary-darker/60'
            }`}
          >
            <header class="flex items-center justify-between text-xs text-neutral-white/60">
              <span>{message.sender}</span>
              <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
            </header>
            <p class="mt-2 whitespace-pre-wrap text-sm text-neutral-white">{displayBody}</p>
            {alertPattern && (
              <p class="mt-1 text-xs uppercase tracking-wide text-accent-gold">{alertPattern.label}</p>
            )}
            <footer class="mt-2 text-xs text-neutral-white/40">{message.status.toUpperCase()}</footer>
          </article>
        );
        })}
        {filtered.length === 0 && (
          <p class="text-center text-sm text-neutral-white/50">No messages yet. Compose a new message below.</p>
        )}
      </div>
    </section>
  );
};
