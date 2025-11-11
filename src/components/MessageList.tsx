import { type FunctionComponent } from 'preact';
import { useMemo } from 'preact/hooks';
import { useMessaging } from '../contexts/MessagingContext';

export const MessageList: FunctionComponent = () => {
  const { messages, channelId } = useMessaging();

  const filtered = useMemo(() => messages.filter((message) => message.channelId === channelId), [messages, channelId]);

  return (
    <section class="card flex h-full flex-col overflow-hidden">
      <header class="flex items-center justify-between border-b border-ocean/40 pb-3">
        <h2 class="text-lg font-semibold text-sand">Messages</h2>
        <span class="text-xs uppercase tracking-wide text-sand/50">{filtered.length} items</span>
      </header>
      <div class="flex-1 space-y-3 overflow-y-auto pt-3">
        {filtered.map((message) => (
          <article key={message.id ?? message.timestamp} class={`rounded-xl border border-ocean/40 p-3 ${message.priority === 'sos' ? 'bg-coral/20' : message.priority === 'priority' ? 'bg-sky/10' : 'bg-midnight/40'}`}>
            <header class="flex items-center justify-between text-xs text-sand/60">
              <span>{message.sender}</span>
              <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
            </header>
            <p class="mt-2 whitespace-pre-wrap text-sm text-sand">{message.body}</p>
            <footer class="mt-2 text-xs text-sand/40">{message.status.toUpperCase()}</footer>
          </article>
        ))}
        {filtered.length === 0 && (
          <p class="text-center text-sm text-sand/50">No messages yet. Compose a new message below.</p>
        )}
      </div>
    </section>
  );
};
