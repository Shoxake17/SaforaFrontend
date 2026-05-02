// src/pages/qrrooms/panels/CallsPanel.tsx
import React from 'react';
import { Phone } from 'lucide-react';
import EmptyPanelState from './EmptyPanelState';

interface Props {
  hotelSlug?: string;
  accentColor: string;
}

const CallsPanel: React.FC<Props> = () => {
  return (
    <EmptyPanelState
      icon={Phone}
      title="No calls yet"
      message="Call history from guest room phones will appear here"
    />
  );
};

export default CallsPanel;