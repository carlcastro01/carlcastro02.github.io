import { type FunctionComponent } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { useMessaging } from '../contexts/MessagingContext';
import { storage } from '../utils/storage';

export const MessageComposer: FunctionComponent = () => {
  const { channelId, setChannel, send } = useMessaging();
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState<'normal' | 'priority' | 'sos'>('normal');
  const [draftLoaded, setDraftLoaded] = useState(false);

  useEffect(() => {
    storage.getDraft(channelId).then((draft) => {
      if (draft) setBody(draft);
      setDraftLoaded(true);
    });
  }, [channelId]);

  useEffect(() => {
    if (!draftLoaded) return;
    storage.saveDraft(channelId, body);
  }, [channelId, body, draftLoaded]);

  const submit = async (event: Event) => {
    event.preventDefault();
    if (!body.trim()) return;
    await send(body, priority);
    setBody('');
    setPriority('normal');
    await storage.clearDraft(channelId);
  };

  return (
    <form class="card space-y-5" onSubmit={submit}>
      <header class="flex flex-wrap items-center justify-between gap-3">
        <h2 class="text-lg font-semibold text-neutral-white">Compose</h2>
        <div class="flex items-center gap-2">
          <label class="text-xs uppercase text-neutral-white/50" htmlFor="channel">Channel</label>
          <select id="channel" class="input w-36" value={channelId} onChange={(event) => setChannel((event.target as HTMLSelectElement).value)}>
            <option value="primary">Primary</option>
            <option value="team">Team</option>
            <option value="emergency">Emergency</option>
          </select>
        </div>
      </header>
      <textarea class="input min-h-[120px]" placeholder="Type a message" value={body} onInput={(event) => setBody((event.target as HTMLTextAreaElement).value)} />
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <label class="text-xs uppercase text-neutral-white/50">Priority</label>
          <select class="input" value={priority} onChange={(event) => setPriority((event.target as HTMLSelectElement).value as typeof priority)}>
            <option value="normal">Normal</option>
            <option value="priority">Priority</option>
            <option value="sos">SOS</option>
          </select>
        </div>
        <button class="btn btn-primary" type="submit">Send</button>
      </div>
    </form>
  );
};
