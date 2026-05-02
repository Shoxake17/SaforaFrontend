import React from 'react';
import { MessageSquare } from 'lucide-react';
import EmptyPanelState from './EmptyPanelState';

interface Props {
  hotelSlug?: string;
  accentColor: string;
}

const MessagesPanel: React.FC<Props> = () => {
  return (
    <EmptyPanelState
      icon={MessageSquare}
      title="No conversations yet"
      message="Guest messages will appear here. Click a chat to reply."
    />
  );
};

export default MessagesPanel;