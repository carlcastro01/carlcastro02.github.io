import { FormEvent, useMemo, useState } from 'react';
import { useMessaging } from '../context/MessagingContext';

const MessagingPanel = () => {
  const { messages, sendMessage, retryMessage } = useMessaging();
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);

  const sorted = useMemo(() => [...messages].sort((a, b) => a.createdAt - b.createdAt), [messages]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.trim()) return;
    setIsSending(true);
    await sendMessage(draft.trim());
    setDraft('');
    setIsSending(false);
  };

  return (
    <div>
      <h2>Mesh Messages</h2>
      <div className="messages-list">
        {sorted.map((message) => (
          <div key={message.id} className={`message ${message.status}`}>
            <strong>{message.senderShortName ?? message.sender}</strong>
            <p>{message.text}</p>
            <div className="delivery-status">
              {message.status === 'pending' && (
                <button onClick={() => retryMessage(message.id)}>Retry</button>
              )}
              <span>
                {message.status === 'sent'
                  ? `Delivered ${new Date(message.deliveredAt ?? message.createdAt).toLocaleTimeString()}`
                  : 'Pending'}
              </span>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit}>
        <textarea
          rows={3}
          placeholder="Send a message to the mesh..."
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <button type="submit" disabled={isSending || !draft.trim()}>
          Send
        </button>
      </form>
    </div>
  );
};

export default MessagingPanel;
