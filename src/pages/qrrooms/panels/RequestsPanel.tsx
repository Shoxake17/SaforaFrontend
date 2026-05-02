import React from 'react';
import { HandHelping } from 'lucide-react';
import EmptyPanelState from './EmptyPanelState';

interface Props {
  hotelSlug?: string;
  accentColor: string;
}

const RequestsPanel: React.FC<Props> = () => {
  return (
    <EmptyPanelState
      icon={HandHelping}
      title="No requests yet"
      message="Guest service requests will appear here"
    />
  );
};

export default RequestsPanel;